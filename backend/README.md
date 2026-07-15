# Serverless File Processing System - Backend

This folder contains the **FastAPI** backend application for the Serverless File Processing System. The backend is responsible for receiving the uploaded `.txt` files from the client, performing validations (size and type), and securely uploading them to Amazon S3 using the AWS SDK for Python (`boto3`).

## Backend Features
- **FastAPI Framework**: High-performance, asynchronous endpoints.
- **boto3 Integration**: Clean interface for Amazon S3 file uploads using file streams (`upload_fileobj`) to optimize memory.
- **Robust Validations**: Enforces `.txt` extension and `< 10 MB` file size both client-side and server-side.
- **Unified Error Handling**: Translates AWS errors (e.g. invalid credentials, bucket not found, permission denied) and application errors into user-friendly standard JSON payloads.
- **CORS Configured**: Ready to communicate with frontend clients running on different origins.

---

## Architecture Flow

```
+------------------+           HTTP POST (Multipart)          +-----------------+
|                  | ---------------------------------------> |                 |
|  HTML/JS Client  |                                          | FastAPI Backend |
|                  | <--------------------------------------- |    (Port 8000)  |
+------------------+            JSON Success/Error            +-----------------+
                                                                       |
                                                                       | boto3 (S3 Stream)
                                                                       v
                                                              +-----------------+
                                                              |    Amazon S3    |
                                                              |  (Input Bucket) |
                                                              +-----------------+
```

---

## Configuration & Environment Setup

### 1. Virtual Environment Setup
Navigate to the root or backend directory and create a Python virtual environment:

```bash
# Navigate to the backend directory
cd backend

# Create a virtual environment
python -m venv venv

# Activate the virtual environment
# On Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# On Windows (Command Prompt):
.\venv\Scripts\activate.bat
# On macOS/Linux:
source venv/bin/activate
```

### 2. Install Dependencies
Install all required libraries specified in `requirements.txt`:

```bash
pip install -r requirements.txt
```

### 3. AWS Configuration
Create a `.env` file in the `backend/` directory (you can copy the template provided) and populate it with your AWS details:

```env
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_REGION=ap-south-1
S3_BUCKET_NAME=serverless-input-yourname
```

> [!NOTE]
> If `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` are left blank, `boto3` will attempt to fall back to the default credentials provider chain (such as looking up environment variables, `~/.aws/credentials` file, or AWS IAM Roles if running on an EC2 instance or ECS container).

---

## API Documentation

### GET `/`
- **Description**: Health check endpoint to verify that the FastAPI backend server is running.
- **Response Type**: `text/plain`
- **Response Body**:
  ```
  Server Running
  ```

### POST `/upload`
- **Description**: Uploads a single text file. Must be sent as a multipart/form-data request.
- **Request Parameters**:
  - `file`: File payload (must end with `.txt`, max size of 10 MB).
- **Responses**:
  - **200 OK** (Successful Upload):
    ```json
    {
      "status": "success",
      "message": "File uploaded successfully",
      "filename": "sample.txt"
    }
    ```
  - **400 Bad Request** (Invalid extension or name):
    ```json
    {
      "status": "error",
      "message": "Invalid file extension. Only '.txt' files are allowed.",
      "detail": "HTTP Status 400"
    }
    ```
  - **413 Request Entity Too Large** (Exceeds size limit):
    ```json
    {
      "status": "error",
      "message": "File size exceeds the maximum limit of 10MB.",
      "detail": "HTTP Status 413"
    }
    ```
  - **404 Not Found** (S3 Bucket does not exist):
    ```json
    {
      "status": "error",
      "message": "The configured S3 bucket does not exist. Check S3_BUCKET_NAME config.",
      "detail": "HTTP Status 404"
    }
    ```
  - **403 Forbidden** (IAM Permissions issue):
    ```json
    {
      "status": "error",
      "message": "AWS S3 permission denied: ... Please verify credentials and policies.",
      "detail": "HTTP Status 403"
    }
    ```

---

## Running the Application

To run the FastAPI server locally, make sure your virtual environment is active and execute:

```bash
uvicorn app:app --reload --host 127.0.0.1 --port 8000
```

- `--reload` enables auto-reloading when code changes.
- The server will be accessible at: `http://127.0.0.1:8000`
- You can access the auto-generated Swagger API documentation at: `http://127.0.0.1:8000/docs`
