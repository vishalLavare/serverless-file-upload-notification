import logging
from fastapi import APIRouter, UploadFile, File, HTTPException, status
from fastapi.responses import PlainTextResponse
from botocore.exceptions import ClientError, NoCredentialsError, PartialCredentialsError

from s3_service import S3Service
from utils import (
    validate_uploaded_file,
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

@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """
    Upload endpoint.
    Accepts a multipart file upload, validates it, and uploads it to Amazon S3.
    
    Returns:
        JSONResponse: Standardized JSON success or error message.
    """
    filename = file.filename
    logger.info(f"Upload started: received file '{filename}'.")
    
    try:
        # Determine file size by seeking to the end, then resetting the file cursor
        file.file.seek(0, 2)
        file_size = file.file.tell()
        file.file.seek(0)
        
        logger.info(f"Validating file metadata: name='{filename}', size={file_size} bytes.")
        # Validate file size and extension (.txt only)
        validate_uploaded_file(filename, file_size)
        
        # Upload the file stream to Amazon S3 using the S3 Service
        logger.info(f"Uploading file '{filename}' to S3...")
        s3_service.upload_file_object(file.file, filename)
        
        logger.info(f"Upload completed successfully: '{filename}'.")
        return create_success_response(
            message="File uploaded successfully",
            filename=filename
        )
        
    except HTTPException as http_exc:
        # Re-raise HTTPExceptions from validation logic
        logger.warning(f"Validation failed for file '{filename}': {http_exc.detail}")
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
