import os
import logging
from dotenv import load_dotenv

# Load environment variables from the environment or .env file
load_dotenv()

# Configure logging format and level
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("config")

# AWS Credentials and Region Settings
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID", "").strip()
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY", "").strip()
AWS_REGION = os.getenv("AWS_REGION", "ap-south-1").strip()

# Target Amazon S3 bucket name
S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME", "").strip()

# Application Server settings (0.0.0.0 binds to all network interfaces for EC2/Docker compatibility)
HOST = os.getenv("HOST", "0.0.0.0").strip()
PORT = int(os.getenv("PORT", "8000").strip())

def is_aws_credentials_configured() -> bool:
    """
    Checks whether AWS credentials (Access Key and Secret Access Key)
    are explicitly configured in the environment variables.
    
    Returns:
        bool: True if both variables are configured, False otherwise.
    """
    return bool(AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY)

def validate_config():
    """
    Performs startup validation on loaded configuration parameters.
    Logs warning messages for any critical configuration values that are missing.
    """
    if not is_aws_credentials_configured():
        logger.warning(
            "AWS credentials (AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY) are not set. "
            "The backend will attempt to use the default IAM/boto3 credential chain."
        )
    else:
        logger.info("AWS credentials found in environment variables.")
        
    if not S3_BUCKET_NAME:
        logger.warning(
            "S3_BUCKET_NAME is empty. File uploads will fail until a valid "
            "bucket name is configured in the environment."
        )
    else:
        logger.info(f"Target S3 Bucket configured: {S3_BUCKET_NAME}")

# Run config validation on module load
validate_config()
