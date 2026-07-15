import logging
from typing import BinaryIO
import boto3
from botocore.exceptions import ClientError, NoCredentialsError, PartialCredentialsError
import config

logger = logging.getLogger("s3_service")

class S3Service:
    """
    Service class responsible for wrapping Amazon S3 interactions via the boto3 SDK.
    Uses credentials loaded from the application config.
    """
    
    def __init__(self):
        self.bucket_name = config.S3_BUCKET_NAME
        self.s3_client = None
        self._initialize_client()

    def _initialize_client(self):
        """
        Initializes the boto3 S3 client.
        Uses environment-configured credentials if available, otherwise relies on the default boto3 chain.
        """
        try:
            if config.is_aws_credentials_configured():
                logger.info("Initializing boto3 S3 client using credentials from configuration.")
                self.s3_client = boto3.client(
                    "s3",
                    aws_access_key_id=config.AWS_ACCESS_KEY_ID,
                    aws_secret_access_key=config.AWS_SECRET_ACCESS_KEY,
                    region_name=config.AWS_REGION
                )
            else:
                logger.info("Initializing boto3 S3 client using default AWS credential resolution chain.")
                self.s3_client = boto3.client(
                    "s3",
                    region_name=config.AWS_REGION
                )
        except Exception as e:
            logger.error(f"Failed to initialize boto3 S3 client: {str(e)}", exc_info=True)
            self.s3_client = None

    def upload_file_object(self, file_obj: BinaryIO, filename: str) -> str:
        """
        Uploads an open file-like object to the configured S3 Bucket.
        
        Args:
            file_obj (BinaryIO): The file stream/object to upload.
            filename (str): The object key (filename) in the target S3 bucket.
            
        Returns:
            str: The S3 object key (filename) if successful.
            
        Raises:
            ValueError: If S3 client is uninitialized or config is invalid.
            NoCredentialsError: If AWS credentials are not found.
            PartialCredentialsError: If AWS credentials are incomplete.
            ClientError: If AWS API request fails (e.g. Bucket not found, Access Denied).
            Exception: Any other unexpected errors.
        """
        if not self.s3_client:
            logger.error("Upload failed: S3 Client is not initialized.")
            raise ValueError(
                "S3 Client is not initialized. Please verify your AWS configuration and restart the server."
            )
            
        if not self.bucket_name:
            logger.error("Upload failed: S3 Bucket Name is not configured.")
            raise ValueError(
                "Target S3 Bucket Name is not configured. Please set the S3_BUCKET_NAME in your environment."
            )

        logger.info(f"Initiating upload of file '{filename}' to S3 bucket '{self.bucket_name}'...")
        
        try:
            # Upload file-like object directly
            self.s3_client.upload_fileobj(
                file_obj,
                self.bucket_name,
                filename
            )
            logger.info(f"Successfully uploaded '{filename}' to S3 bucket '{self.bucket_name}'.")
            return filename
            
        except NoCredentialsError as e:
            logger.error("AWS credentials not found during S3 upload.", exc_info=True)
            raise NoCredentialsError()
            
        except PartialCredentialsError as e:
            logger.error("Incomplete AWS credentials provided for S3 upload.", exc_info=True)
            raise PartialCredentialsError(
                provider="env",
                cred_var="AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY"
            )
            
        except ClientError as e:
            error_code = e.response.get("Error", {}).get("Code", "Unknown")
            logger.error(f"S3 Client Error {error_code} occurred during upload of '{filename}': {str(e)}", exc_info=True)
            raise e
            
        except Exception as e:
            logger.error(f"Unexpected error uploading '{filename}' to S3: {str(e)}", exc_info=True)
            raise e
