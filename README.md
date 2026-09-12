# ☁️ Serverless File Processing System

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.12-blue?style=for-the-badge&logo=python" alt="Python" />
  <img src="https://img.shields.io/badge/FastAPI-0.115-green?style=for-the-badge&logo=fastapi" alt="FastAPI" />
  <img src="https://img.shields.io/badge/AWS-Serverless-orange?style=for-the-badge&logo=amazonaws" alt="AWS" />
  <img src="https://img.shields.io/badge/Lambda-AWS_Lambda-yellow?style=for-the-badge&logo=awslambda" alt="AWS Lambda" />
  <img src="https://img.shields.io/badge/S3-Amazon_S3-red?style=for-the-badge&logo=amazons3" alt="Amazon S3" />
  <img src="https://img.shields.io/badge/SNS-Amazon_SNS-blue?style=for-the-badge&logo=amazonsns" alt="Amazon SNS" />
</p>
---
## 📖 Project Overview

The **Serverless File Processing System** is a complete, production-ready Serverless File Upload & Processing application. It features a robust **FastAPI** backend in Python, a modern, highly aesthetic web client interface built with **HTML5, CSS3, and JavaScript (Bootstrap 5)**, and integrated AWS serverless infrastructure (**Amazon S3**, **AWS Lambda**, and **Amazon SNS**).

The system follows a fully decoupled, reactive event-driven model:

```
+--------------------------------------------------------------------------------+
|                                    BROWSER                                     |
|  +------------------+                   +-----------------------------------+  |
|  |   HTML5 Canvas   |  <=============>  | JavaScript (Vanilla, Local Hist)  |  |
|  +------------------+                   +-----------------------------------+  |
+--------------------------------------------------------------------------------+
                                           │
                                           │ HTTP POST (multipart/form-data)
                                           ▼
+--------------------------------------------------------------------------------+
|                                FASTAPI BACKEND                                 |
|  +-------------------+                  +-----------------------------------+  |
|  |   app.py (CORS)   |  ------------─>  | routes.py (Validators, Endpoints) |  |
|  +-------------------+                  +-----------------------------------+  |
|                                                          │                     |
|                                                          │ boto3 SDK           |
|                                                          ▼                     |
|                                         +-----------------------------------+  |
|                                         |  s3_service.py (Object Upload)    |  |
|                                         +-----------------------------------+  |
+--------------------------------------------------------------------------------+
                                                           │
                                                           │ HTTPS (s3.upload_fileobj)
                                                           ▼
+--------------------------------------------------------------------------------+
|                             AWS CLOUD SERVICES                                 |
|  +--------------------+                                                        |
|  |     Amazon S3      | (Input Bucket)                                         |
|  +--------------------+                                                        |
|            │                                                                   |
|            │ Object Created Event Trigger                                      |
|            ▼                                                                   |
|  +--------------------+                                                        |
|  |     AWS Lambda     | (Processes Text: e.g., counts words, averages)         |
|  +--------------------+                                                        |
|       /            \                                                           |
|      /              \ Stores processed output                                  |
|     /                ▼                                                         |
|    /         +--------------------+                                            |
|   /          |     Amazon S3      | (Output Bucket)                            |
|  /           +--------------------+                                            |
| ▼                                                                              |
|  +--------------------+                                                        |
|  |     Amazon SNS     | =====> Sends Email Notification                        |
|  +--------------------+                                                        |
+--------------------------------------------------------------------------------+
```

---

## ✨ Key Features

### 🎨 Frontend Features
- **Aesthetic Cloud Dashboard**: Modern custom layout with rich blue radial gradients, CSS transitions, and glassmorphism styling.
- **Dark Mode Support**: Seamless dynamic dark/light mode toggle with state persistence in `localStorage`.
- **S3 Target Folder Selection**: Set or create custom S3 folders (e.g., `folder1/`, `folder2/`, `folder3/`) with live destination path badges and quick suggestion chips.
- **Multi-File Batch Upload**: Upload multiple `.txt` files at once via multi-file file browser or drag-and-drop.
- **Selected Files Queue & Preview**: Inspect queued files, see individual sizes, remove files before upload, and preview text content.
- **Client-Side Validations**: Enforces `.txt` extension limit and `< 10 MB` per-file size threshold instantly before sending to the backend.
- **Upload Progress Tracker**: Real-time `XMLHttpRequest` progress metrics driving dynamic progress bars and percentage indicators.
- **Interactive S3 File URL Cards**: Prominently renders direct S3 URLs upon upload with one-click **Copy URL** and **Open File** buttons.
- **Recent Uploads History**: Client-side log displaying folder paths, file sizes, timestamps, and direct **Copy URL** / **Open S3 URL** links.
- **Interactive Toasts**: Clean toast alerts that announce results in color-coded overlays.

### ⚙️ Backend Features
- **FastAPI Engine**: Asynchronous architecture providing rapid processing and automatic Swagger documentation.
- **Folder & Prefix Management**: Dynamically routes uploads into folder prefixes and creates explicit S3 directory markers (`folder1/`, `folder2/`, etc.) for seamless AWS S3 Console browsing.
- **Multi-File Batch Processing**: Robust batch upload endpoint (`POST /upload`) supporting simultaneous multi-file streams with deduplication safeguards.
- **Explicit Folder Creation**: Dedicated `POST /create-folder` endpoint to create S3 folder markers directly.
- **Direct S3 URL & URI Generation**: Automatically generates virtual-hosted HTTPS URLs (`https://<bucket>.s3.<region>.amazonaws.com/<key>`) and S3 URIs (`s3://<bucket>/<key>`).
- **Robust S3 Integration**: Native `boto3` streams upload file buffers straight into S3 without loading them into server memory unnecessarily.
- **AWS Exception Parser**: Automatically intercepts boto3 runtime exceptions (like missing IAM keys, bad bucket configurations, network outages) and converts them into structured HTTP responses.
- **Unified Logging**: Outputs application telemetry (such as initialization details, upload start, size checkpoints, completions, and exceptions) cleanly using standard python logging.
- **CORS Enabled**: Out-of-the-box configuration allowing cross-origin requests from the static HTML frontend.

---

## 🛠️ Technology Stack

| Category | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | HTML5, CSS3, JavaScript, Bootstrap 5 | Responsive Web Dashboard, UI Theme Persistence, File Upload UI |
| **Backend** | FastAPI (Python 3.12) | Asynchronous API Framework, Validation, and Routing |
| **Cloud Storage** | Amazon S3 | Secure Bucket Storage for Input & Processed Output |
| **Compute** | AWS Lambda | Event-driven processing function executing Python 3.12 |
| **Notifications**| Amazon SNS | Real-time Email notifications on successful processing |
| **SDK & Utils**  | boto3, python-dotenv, uvicorn | AWS SDK integration, environment configuration, ASGI server |

---

## 📂 Folder Structure

```text
Serverless File Processing System/
│
├── backend/
│   ├── app.py              # Application entrypoint & CORS config
│   ├── config.py           # Configuration loader (.env parser)
│   ├── routes.py           # API endpoints (GET / and POST /upload)
│   ├── s3_service.py       # Amazon S3 upload implementation (boto3)
│   ├── utils.py            # Validation helpers & response builders
│   ├── requirements.txt    # Python dependencies
│   ├── .env                # Local AWS Credentials (secrets)
│   └── README.md           # Backend specific readme
│
├── docs/
│   ├── index.html          # Dashboard HTML structure
│   ├── style.css           # Layouts, themes, animations, & variables
│   └── script.js           # Client actions, requests, & theme toggle
│
├── lambda/
│   └── lambda_function.py  # AWS Lambda text processing function code
│
├── screenshots/            # UI presentation captures
│   ├── home.png
│   ├── upload.png
│   ├── s3.png
│   ├── lambda.png
│   └── email.png
│
└── README.md               # Main project readme
```

---

## ⚙️ Installation & Setup

### 1. Backend Setup (FastAPI)

#### Create a Virtual Environment
Navigate to the project root and create a virtual environment in the `backend` folder:
```bash
# Enter backend folder
cd backend

# Create virtual environment
python -m venv venv

# Activate the virtual environment
# Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# Windows (Command Prompt):
.\venv\Scripts\activate.bat
# macOS/Linux:
source venv/bin/activate
```

#### Install Dependencies
```bash
pip install -r requirements.txt
```

#### Configure Environment Variables
Create a file named `.env` in the `backend/` directory and populate it:
```env
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
AWS_REGION=your_region
S3_BUCKET_NAME=your_bucket_name
```

#### Running the Backend
Start the server using `uvicorn`:
```bash
uvicorn app:app --reload --host 127.0.0.1 --port 8000
```
- The API health check will be active at `http://127.0.0.1:8000/`.
- Swagger interactive documentation is generated at `http://127.0.0.1:8000/docs`.

---

### 2. Frontend Setup

Since the frontend is built using standard Vanilla JavaScript, HTML5, and CSS3, it does not require a compilation step.

#### Running the Frontend
You can open `docs/index.html` in your web browser:
- **Option A (Simple)**: Double-click the `docs/index.html` file to open it directly (`file://` protocol).
- **Option B (Recommended)**: Serve the files using a local HTTP server:
  ```bash
  # Using Python (from the docs directory):
  cd docs
  python -m http.server 5500
  ```
  Open `http://127.0.0.1:5500` in your browser.


---

## ☁️ AWS Configuration & Deployment (Reference)

To complete the serverless loop on AWS:

### 1. Amazon S3 Input Bucket
- Create the bucket configured in your `.env` (e.g. `serverless-file-processing-system`).
- Block public access and assign appropriate IAM policies to the user access keys.

### 2. AWS Lambda Setup
- Create a Lambda function using the **Python 3.12** runtime.
- Attach policies allowing Lambda to read from your input bucket, write to your output bucket, and publish to SNS.
- Sample Lambda Handler code (`lambda/lambda_function.py`):
  ```python
  import json
  import boto3
  s3 = boto3.client("s3")
  sns = boto3.client("sns")

  OUTPUT_BUCKET = "serverless-file-processing-system"
  SNS_TOPIC_ARN = "arn:aws:sns:us-east-1:142166253229:serverless-SNS"

  def lambda_handler(event, context):
      print(json.dumps(event))

      bucket = event["Records"][0]["s3"]["bucket"]["name"]
      key = event["Records"][0]["s3"]["object"]["key"]

      # Prevent recursive processing loop
      if key.startswith("processed_") or key.endswith(".json"):
          return {
              "statusCode": 200,
              "body": "Skipped"
          }

      response = s3.get_object(
          Bucket=bucket,
          Key=key
      )

      text = response["Body"].read().decode("utf-8")

      word_count = len(text.split())
      char_count = len(text)

      report = {
          "filename": key,
          "word_count": word_count,
          "char_count": char_count
      }

      output_key = f"processed_{key}.json"

      s3.put_object(
          Bucket=OUTPUT_BUCKET,
          Key=output_key,
          Body=json.dumps(report, indent=4),
          ContentType="application/json"
      )

      message = f"""
  File Processed Successfully

  Bucket: {bucket}
  File: {key}

  Word Count: {word_count}
  Character Count: {char_count}

  Report:
  {output_key}
  """

      response = sns.publish(
          TopicArn=SNS_TOPIC_ARN,
          Subject="File Processed Successfully",
          Message=message
      )

      print(response)

      return {
          "statusCode": 200,
          "body": "Success"
      }
  ```

### 3. S3 Event Notification
- Go to your input S3 bucket -> Properties -> Event notifications.
- Create a notification for `All object create events` and route it to your Lambda function.

### 4. Amazon SNS Configuration
- Create an SNS Topic (Standard) named `serverless-SNS`.
- Create an Email subscription for your topic and confirm the subscription request from your email inbox.

---

## 🔐 IAM Policy Example

For secure, least-privilege AWS integration, attach a policy similar to the following to your IAM User/Execution Role:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::serverless-file-processing-system",
        "arn:aws:s3:::serverless-file-processing-system/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "sns:Publish"
      ],
      "Resource": "arn:aws:sns:*:*:serverless-SNS"
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "*"
    }
  ]
}
```

---

## 📊 API Specification

### 1. Endpoint: `POST /upload`
Uploads single or multiple text files to the configured Amazon S3 bucket under an optional folder prefix.

- **Request Content Type**: `multipart/form-data`
- **Body parameters**:
  - `files`: Single or multiple `.txt` file payloads (max 10 MB per file).
  - `file`: Single `.txt` file payload (supported for backwards compatibility).
  - `folder` *(optional)*: Target folder path prefix (e.g., `folder1`, `folder2`, `folder3`).
- **Success Response (200 OK)**:
  ```json
  {
      "status": "success",
      "message": "Successfully uploaded 2 files in folder 'folder3' to S3.",
      "filename": "sample1.txt",
      "count": 2,
      "folder": "folder3",
      "s3_url": "https://storage-bucket.s3.ap-south-1.amazonaws.com/folder3/sample1.txt",
      "s3_uri": "s3://storage-bucket/folder3/sample1.txt",
      "file_url": "https://storage-bucket.s3.ap-south-1.amazonaws.com/folder3/sample1.txt",
      "uploaded_files": [
          {
              "filename": "sample1.txt",
              "key": "folder3/sample1.txt",
              "folder": "folder3",
              "size": 128,
              "s3_url": "https://storage-bucket.s3.ap-south-1.amazonaws.com/folder3/sample1.txt",
              "s3_uri": "s3://storage-bucket/folder3/sample1.txt"
          },
          {
              "filename": "sample2.txt",
              "key": "folder3/sample2.txt",
              "folder": "folder3",
              "size": 256,
              "s3_url": "https://storage-bucket.s3.ap-south-1.amazonaws.com/folder3/sample2.txt",
              "s3_uri": "s3://storage-bucket/folder3/sample2.txt"
          }
      ]
  }
  ```

- **Example Error Responses**:
  - **400 Bad Request** (Invalid file format or missing file):
    ```json
    {
        "status": "error",
        "message": "Invalid file extension. Only '.txt' files are allowed."
    }
    ```
  - **413 Payload Too Large** (File size > 10MB):
    ```json
    {
        "status": "error",
        "message": "File size exceeds the maximum limit of 10MB."
    }
    ```
  - **500 Internal Server Error** (AWS credentials missing):
    ```json
    {
        "status": "error",
        "message": "AWS credentials not found. S3 client authentication failed."
    }
    ```

---

### 2. Endpoint: `POST /create-folder`
Creates an explicit directory marker object in Amazon S3 (e.g., `folder1/`) so the AWS S3 Management Console displays the folder with an interactive folder icon.

- **Request Content Type**: `application/x-www-form-urlencoded` or `multipart/form-data`
- **Body parameters**:
  - `folder`: The target folder name (e.g., `folder1`, `folder2`, `folder3`).
- **Success Response (200 OK)**:
  ```json
  {
      "status": "success",
      "message": "Folder 'folder1' created in S3 bucket.",
      "folder": "folder1",
      "key": "folder1/",
      "s3_uri": "s3://storage-bucket/folder1/"
  }
  ```

---

### 3. Endpoint: `GET /`
- **Description**: Backend health check.
- **Response Type**: `text/plain`
- **Response**: `Server Running`

---

## 📸 Screenshots

### Home Page
![Home Page](screenshots/home.png)

---

### Upload Progress
![Upload Progress](screenshots/upload.png)

---

### Amazon S3 Bucket Console
![Amazon S3](screenshots/s3.png)

---

### AWS Lambda Function
![AWS Lambda](screenshots/lambda.png)

---

### SNS Email Notification
![Email Notification](screenshots/email.png)

---

## ✅ Verification & Testing

1. **Verify Backend Status**:
   - Access `http://127.0.0.1:8000/`. It should display a running message or access the Swagger API docs at `http://127.0.0.1:8000/docs`.
2. **Testing File Upload Restrictions**:
   - Attempt uploading a `.png` or `.pdf` file. The frontend drop-zone displays a validation error instantly.
   - Attempt uploading a text file exceeding `10 MB`. The frontend rejects it client-side.
3. **AWS Error Handlers**:
   - Run the server with empty/invalid `.env` credentials. Upload will gracefully fail with a descriptive message: `AWS credentials not found. S3 client authentication failed.`
   - Run the system with a non-existent bucket configuration. Upload will fail with: `The configured S3 bucket does not exist. Check S3_BUCKET_NAME config.`
4. **Successful Pipeline Run**:
   - Upload a valid `.txt` file.
   - The UI shows real-time upload progress, transitions to a success notification, and appends a record in the local history.
   - S3 Input bucket registers the original `.txt` file.
   - S3 Event notification triggers the Lambda function.
   - Lambda processes the file, saves a matching `processed_[filename].json` report containing metrics (word/character counts) back into the S3 bucket, and sends an email status update using SNS.

---

## 🚀 Future Enhancements
- **Multipart Chunking**: Enable chunked uploads for files exceeding 100MB to S3 directly via pre-signed URLs.
- **DynamoDB Telemetry**: Store upload audit logging and execution results in DynamoDB database tables.
- **Cognito Integration**: Secure the portal with Amazon Cognito User Pools for user sign-in and authorization.
- **Real-Time WebSockets**: Use WebSockets in FastAPI to stream Lambda execution progress directly back to the user interface.
- **OCR Integration**: Extract textual context from PDFs or images using Amazon Textract.

---

## 👨‍💻 Author

**Vishal Lavare**  
*Cloud & DevOps Engineer*

- AWS Cloud & Serverless Architectures
- Containerization & Orchestration (Docker, Kubernetes)
- CI/CD Pipelines (GitHub Actions, GitLab CI)
- Backend Development (FastAPI, Python)

---

### ⭐ If you found this project useful, don't forget to Star this repository!
