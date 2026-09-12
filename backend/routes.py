import os
import logging
from typing import List, Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status
from fastapi.responses import PlainTextResponse
from botocore.exceptions import ClientError, NoCredentialsError, PartialCredentialsError

from s3_service import S3Service
from utils import (
    validate_uploaded_file,
    sanitize_folder_path,
    create_success_response,
    create_error_response
)

# Setup module-level logger
logger = logging.getLogger("routes")

# Instantiate APIRouter
router = APIRouter()

# Instantiate S3 service
s3_service = S3Service()

@router.get("/", response_class=PlainTextResponse)
def read_root():
    """
    Root endpoint.
    Returns:
        str: "Server Running" plain text message.
    """
    logger.info("Health check endpoint accessed.")
    return "Server Running"

@router.post("/create-folder")
async def create_folder_endpoint(folder: str = Form(...)):
    """
    Explicit endpoint to create a folder directory marker in S3.
    """
    clean_folder = sanitize_folder_path(folder)
    if not clean_folder:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Folder name cannot be empty."
        )
    try:
        res = s3_service.create_folder(clean_folder)
        return create_success_response(
            message=f"Folder '{clean_folder}' created in S3 bucket.",
            extra_info=res
        )
    except Exception as e:
        logger.exception(f"Error creating folder '{clean_folder}': {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create folder in S3: {str(e)}"
        )

@router.post("/upload")
async def upload_file(
    file: Optional[UploadFile] = File(None),
    files: Optional[List[UploadFile]] = File(None),
    folder: Optional[str] = Form("")
):
    """
    Upload endpoint.
    Accepts single or multiple multipart file uploads and an optional folder path.
    Validates files and uploads each to Amazon S3 under the specified folder prefix.
    
    Returns:
        JSONResponse: Standardized JSON success message with list of uploaded files, keys, and S3 URLs.
    """
    # Consolidate uploaded files list (mutually exclusive)
    upload_list: List[UploadFile] = []
    if files:
        upload_list.extend([f for f in files if f and f.filename])
    elif file and file.filename:
        upload_list.append(file)

    # Deduplicate in case any client sends duplicate identical file objects
    seen_names = set()
    deduped_list: List[UploadFile] = []
    for f in upload_list:
        clean_name = os.path.basename(f.filename.replace("\\", "/"))
        if clean_name not in seen_names:
            seen_names.add(clean_name)
            deduped_list.append(f)
    upload_list = deduped_list
        
    if not upload_list:
        logger.warning("Upload rejected: No file provided in request.")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No file selected. Please select at least one file to upload."
        )

    # Sanitize folder prefix (e.g. "folder1", "folder2/subfolder", or empty "")
    clean_folder = sanitize_folder_path(folder)
    logger.info(f"Upload initiated: {len(upload_list)} file(s) targeting folder '{clean_folder or 'root'}'.")

    uploaded_results = []
    
    try:
        # Validate all files first before attempting S3 uploads
        for f in upload_list:
            clean_name = os.path.basename(f.filename.replace("\\", "/"))
            f.file.seek(0, 2)
            file_size = f.file.tell()
            f.file.seek(0)
            
            logger.info(f"Validating file metadata: '{clean_name}', size={file_size} bytes.")
            validate_uploaded_file(clean_name, file_size)

        # Proceed to upload each file to Amazon S3
        for f in upload_list:
            clean_name = os.path.basename(f.filename.replace("\\", "/"))
            f.file.seek(0, 2)
            file_size = f.file.tell()
            f.file.seek(0)

            # Build full object key (e.g. "folder3/myfile.txt" or "myfile.txt")
            object_key = f"{clean_folder}/{clean_name}" if clean_folder else clean_name
            
            logger.info(f"Uploading file '{clean_name}' to S3 key '{object_key}'...")
            upload_meta = s3_service.upload_file_object(f.file, object_key)
            
            uploaded_results.append({
                "filename": clean_name,
                "key": object_key,
                "folder": clean_folder,
                "size": file_size,
                "s3_url": upload_meta["s3_url"],
                "s3_uri": upload_meta["s3_uri"],
                "presigned_url": upload_meta.get("presigned_url", "")
            })

        count = len(uploaded_results)
        primary_file = uploaded_results[0]["filename"] if uploaded_results else ""
        primary_url = uploaded_results[0]["s3_url"] if uploaded_results else ""
        primary_uri = uploaded_results[0]["s3_uri"] if uploaded_results else ""
        
        folder_desc = f" in folder '{clean_folder}'" if clean_folder else ""
        success_msg = f"Successfully uploaded {count} file{'s' if count > 1 else ''}{folder_desc} to S3."
        logger.info(f"Upload batch finished: {success_msg}")

        return create_success_response(
            message=success_msg,
            filename=primary_file,
            extra_info={
                "count": count,
                "folder": clean_folder,
                "s3_url": primary_url,
                "s3_uri": primary_uri,
                "file_url": primary_url,
                "uploaded_files": uploaded_results
            }
        )

        
    except HTTPException as http_exc:
        # Re-raise HTTPExceptions from validation logic
        logger.warning(f"Validation failed: {http_exc.detail}")
        raise http_exc
        
    except NoCredentialsError:
        error_msg = "AWS credentials not found. S3 client authentication failed."
        logger.error(f"Upload failed: {error_msg}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=error_msg
        )
        
    except PartialCredentialsError:
        error_msg = "Incomplete AWS credentials. Please check your configuration."
        logger.error(f"Upload failed: {error_msg}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=error_msg
        )
        
    except ClientError as client_err:
        # Parse common AWS S3 ClientError instances
        error_code = client_err.response.get("Error", {}).get("Code", "Unknown")
        message = client_err.response.get("Error", {}).get("Message", "S3 Client Error")
        
        logger.error(f"AWS S3 ClientError: Code={error_code}, Message={message}", exc_info=True)
        
        if error_code == "NoSuchBucket":
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"The configured S3 bucket does not exist. Check S3_BUCKET_NAME config."
            )
        elif error_code in ("AccessDenied", "InvalidAccessKeyId", "SignatureDoesNotMatch"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"AWS S3 permission denied: {message}. Please verify credentials and policies."
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"AWS S3 error: {message} (Code: {error_code})"
            )
            
    except Exception as exc:
        # Catch-all for other unexpected backend/boto3 errors
        logger.exception(f"Unexpected upload failure: {str(exc)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(exc)}"
        )
