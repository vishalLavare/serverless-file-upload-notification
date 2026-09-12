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

    def get_file_url(self, object_key: str) -> str:
        """
        Generates the standard virtual-hosted HTTPS URL for the S3 object.
        Format: https://<bucket-name>.s3.<region>.amazonaws.com/<object-key>
        """
        region = config.AWS_REGION or "us-east-1"
        return f"https://{self.bucket_name}.s3.{region}.amazonaws.com/{object_key}"

    def generate_presigned_url(self, object_key: str, expiration: int = 3600) -> str:
        """
        Generates a temporary presigned GET URL for accessing the S3 object.
        Falls back to empty string if client is uninitialized.
        """
        if not self.s3_client or not self.bucket_name:
            return ""
        try:
            return self.s3_client.generate_presigned_url(
                "get_object",
                Params={"Bucket": self.bucket_name, "Key": object_key},
                ExpiresIn=expiration
            )
        except Exception as e:
            logger.warning(f"Could not generate presigned URL for '{object_key}': {str(e)}")
            return ""

    def create_folder(self, folder: str) -> dict:
        """
        Creates an explicit directory marker object (e.g. 'folder1/') in S3.
        This ensures that the AWS S3 Management Console immediately displays
        an actual folder icon and structure.
        """
        if not self.s3_client:
            raise ValueError("S3 Client is not initialized.")
        if not self.bucket_name:
            raise ValueError("Target S3 Bucket Name is not configured.")

        clean_folder = folder.replace("\\", "/").strip().strip("/")
        if not clean_folder:
            return {"folder": "", "key": ""}

        folder_key = f"{clean_folder}/"
        logger.info(f"Creating S3 folder marker: '{folder_key}' in bucket '{self.bucket_name}'...")
        try:
            self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=folder_key,
                Body=b""
            )
            logger.info(f"Successfully verified S3 folder marker: '{folder_key}'")
            return {
                "folder": clean_folder,
                "key": folder_key,
                "s3_uri": f"s3://{self.bucket_name}/{folder_key}"
            }
        except Exception as e:
            logger.warning(f"Could not create folder marker '{folder_key}': {str(e)}")
            return {"folder": clean_folder, "key": folder_key}

    def upload_file_object(self, file_obj: BinaryIO, object_key: str) -> dict:
        """
        Uploads an open file-like object to the configured S3 Bucket.
        
        Args:
            file_obj (BinaryIO): The file stream/object to upload.
            object_key (str): The destination object key (including folder prefix) in the target S3 bucket.
            
        Returns:
            dict: Upload details including object key, s3_url, s3_uri, and presigned_url.
            
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

        # If object_key contains a folder prefix (e.g. folder1/file.txt or folder3/file.txt),
        # also create the explicit S3 directory marker so S3 Console UI shows the folder
        if "/" in object_key:
            folder_part = object_key.rsplit("/", 1)[0]
            self.create_folder(folder_part)

        logger.info(f"Initiating upload of file to S3: '{object_key}' in bucket '{self.bucket_name}'...")
        
        try:
            # Upload file-like object directly
            self.s3_client.upload_fileobj(
                file_obj,
                self.bucket_name,
                object_key
            )
            s3_url = self.get_file_url(object_key)
            s3_uri = f"s3://{self.bucket_name}/{object_key}"
            presigned_url = self.generate_presigned_url(object_key)

            logger.info(f"Successfully uploaded '{object_key}' to S3 bucket '{self.bucket_name}'. URL: {s3_url}")
            return {
                "key": object_key,
                "bucket": self.bucket_name,
                "s3_url": s3_url,
                "s3_uri": s3_uri,
                "presigned_url": presigned_url
            }
            
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
            logger.error(f"S3 Client Error {error_code} occurred during upload of '{object_key}': {str(e)}", exc_info=True)
            raise e
            
        except Exception as e:
            logger.error(f"Unexpected error uploading '{object_key}' to S3: {str(e)}", exc_info=True)
            raise e

