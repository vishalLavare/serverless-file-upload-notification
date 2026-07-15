import logging
from typing import Dict, Any
from fastapi import HTTPException, status

# Configuration Constants
ALLOWED_EXTENSION = ".txt"
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 Megabytes

# Module-level logger
logger = logging.getLogger("utils")

def configure_app_logging():
    """
    Configures standard application logging formatting and root handlers.
    Ensures logs are output cleanly to stdout.
    """
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
    )
    # Set levels for noisy libraries if needed
    logging.getLogger("urllib3").setLevel(logging.WARNING)
    logging.getLogger("botocore").setLevel(logging.WARNING)

def validate_uploaded_file(filename: str, file_size: int) -> bool:
    """
    Validates an uploaded file's metadata:
    1. Checks if a file was selected.
    2. Validates that the file has a `.txt` extension.
    3. Validates that the file size does not exceed the maximum allowed size (10 MB).
    
    Args:
        filename (str): Name of the uploaded file.
        file_size (int): Size of the uploaded file in bytes.
        
    Returns:
        bool: True if validation passes.
        
    Raises:
        HTTPException: If file is missing, format is invalid, or size is too large.
    """
    # 1. Check if a filename is provided
    if not filename or filename.strip() == "":
        logger.warning("File validation failed: Filename is empty.")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No file selected. Please select a valid file to upload."
        )

    # 2. Check for correct extension (.txt only)
    if not filename.lower().endswith(ALLOWED_EXTENSION):
        logger.warning(f"File validation failed: Invalid extension for '{filename}'. Only .txt files are allowed.")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file extension. Only '{ALLOWED_EXTENSION}' files are allowed."
        )

    # 3. Check for file size limits
    if file_size > MAX_FILE_SIZE_BYTES:
        logger.warning(
            f"File validation failed: Size {file_size} bytes exceeds limit of {MAX_FILE_SIZE_BYTES} bytes."
        )
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size exceeds the maximum limit of {MAX_FILE_SIZE_BYTES // (1024 * 1024)}MB."
        )

    logger.info(f"File metadata validated successfully: {filename} ({file_size} bytes)")
    return True

def create_success_response(message: str, filename: str, extra_info: Dict[str, Any] = None) -> Dict[str, Any]:
    """
    Constructs a standardized success response dictionary.
    
    Args:
        message (str): Descriptive success message.
        filename (str): Name of the processed file.
        extra_info (Dict[str, Any], optional): Additional key-value pairs to include.
        
    Returns:
        Dict[str, Any]: Formatted success response dictionary.
    """
    response = {
        "status": "success",
        "message": message,
        "filename": filename
    }
    if extra_info:
        response.update(extra_info)
    return response

def create_error_response(message: str, error_detail: str = None) -> Dict[str, Any]:
    """
    Constructs a standardized error response dictionary.
    
    Args:
        message (str): High-level error summary.
        error_detail (str, optional): Technical detail or exception traceback info.
        
    Returns:
        Dict[str, Any]: Formatted error response dictionary.
    """
    response = {
        "status": "error",
        "message": message
    }
    if error_detail:
        response["detail"] = error_detail
    return response
