# Serverless File Processing System

A complete production-ready Serverless File Upload & Processing application using a **FastAPI** backend in Python, a modern **HTML5 / CSS3 / JavaScript (Bootstrap 5)** web client interface, and integrated AWS serverless infrastructure (Amazon S3, AWS Lambda, Amazon SNS).

---

## Architecture Diagram

The system follows a fully decoupled, reactive event-driven model:

```
+--------------------------------------------------------------------------------+
|                                    BROWSER                                     |
|  +------------------+                   +-----------------------------------+  |
|  |   HTML5 Canvas   |  <=============>  | JavaScript (Vanilla, Local Hist)  |  |
|  +------------------+                   +-----------------------------------+  |
+--------------------------------------------------------------------------------+
                                           |
                                           | HTTP POST (multipart/form-data)
                                           v
+--------------------------------------------------------------------------------+
|                                FASTAPI BACKEND                                 |
|  +-------------------+                  +-----------------------------------+  |
|  |   app.py (CORS)   |  ------------->  | routes.py (Validators, Endpoints) |  |
|  +-------------------+                  +-----------------------------------+  |
|                                                          |                     |
|                                                          | boto3 SDK           |
|                                                          v                     |
|                                         +-----------------------------------+  |
|                                         |  s3_service.py (Object Upload)    |  |
|                                         +-----------------------------------+  |
+--------------------------------------------------------------------------------+
                                                           |
                                                           | HTTPS (s3.upload_fileobj)
                                                           v
+--------------------------------------------------------------------------------+
|                             AWS CLOUD SERVICES                                 |
|  +--------------------+                                                        |
|  |     Amazon S3      | (Input Bucket)                                         |
|  +--------------------+                                                        |
|            |                                                                   |
|            | Object Created Event Trigger                                      |
|            v                                                                   |
|  +--------------------+                                                        |
|  |     AWS Lambda     | (Processes Text: e.g., counts words, averages)         |
|  +--------------------+                                                        |
|       /            \                                                           |
|      /              \ Stores processed output                                  |
|     /                v                                                         |
|    /         +--------------------+                                            |
|   /          |     Amazon S3      | (Output Bucket)                            |
|  /           +--------------------+                                            |
| v                                                                              |
|  +--------------------+                                                        |
|  |     Amazon SNS     | =====> Sends Email Notification                        |
|  +--------------------+                                                        |
+--------------------------------------------------------------------------------+
```

---

## Key Features

### Frontend Features
- **Aesthetic Cloud Dashboard**: Modern custom layout with rich blue radial gradients, CSS transitions, and glassmorphism styling.
- **Dark Mode Support**: Seamless dynamic dark/light mode toggle with state persistence in `localStorage`.
- **Drag & Drop Upload**: Interactive drag-over zones that light up and accept file payloads.
- **Client-Side Validations**: Enforces `.txt` extension limit and `< 10 MB` size threshold instantly before sending to backend.
- **Real-Time Preview**: Displays text file content within an interactive scroll panel prior to upload.
- **Upload Progress Tracker**: Uses `XMLHttpRequest` progress metrics to drive a Bootstrap progress bar and percentage display.
- **Recent Uploads History**: A client-side log (stored in `localStorage`) displaying the status, size, and timestamp of recent attempts.
- **Interactive Toasts**: Clean toast alerts that announce results in color-coded overlays.

### Backend Features
- **FastAPI Engine**: Asynchronous architecture providing rapid processing.
- **Robust S3 Integration**: Native `boto3` streams upload file buffers straight into S3 without loading them into memory unnecessarily.
- **AWS Exception Parser**: Automatically intercepts boto3 runtime exceptions (like missing IAM keys, bad bucket configurations, network outages) and converts them into structured HTTP responses.
- **Unified Logging**: Outputs application telemetry (such as initialization details, upload start, size checkpoints, completions, and exceptions) cleanly using standard python logging.
- **CORS Enabled**: Out-of-the-box configuration allowing cross-origin requests from the static HTML frontend.

---

## Folder Structure

```
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
├── frontend/
│   ├── index.html          # Dashboard HTML structure
│   ├── style.css           # Layouts, themes, animations, & variables
│   └── script.js           # Client actions, requests, & theme toggle
│
└── screenshots/            # Directory containing UI presentation captures
```

---

## Installation & Setup

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
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_REGION=ap-south-1
S3_BUCKET_NAME=serverless-input-yourname
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

Since the frontend is built using standard Vanilla JavaScript, HTML5, and CSS3, it does not require an installation step.

#### Running the Frontend
You can open `frontend/index.html` in your web browser:
- **Option A (Simple)**: Double-click the `frontend/index.html` file to open it directly (`file://` protocol).
- **Option B (Recommended)**: Serve the files using a local HTTP server:
  ```bash
  # Using Python (from the frontend directory):
  cd frontend
  python -m http.server 5500
  ```
  Open `http://127.0.0.1:5500` in your browser.

---

## AWS Configuration & Deployment (Reference)

To complete the serverless loop on AWS:

1. **S3 Input Bucket**:
   - Create the bucket configured in your `.env` (e.g. `serverless-input-yourname`).
   - Block public access and assign appropriate IAM policies to the user access keys.

2. **AWS Lambda Setup**:
   - Create a Lambda function using the **Python 3.12** runtime.
   - Attach policies allowing Lambda to read from your input bucket, write to your output bucket, and publish to SNS.
   - Sample Lambda Handler code (`lambda_function.py`):
     ```python
     import json
     import boto3
     import os
     
     s3 = boto3.client('s3')
     sns = boto3.client('sns')
     
     OUTPUT_BUCKET = "serverless-output-yourname"
     SNS_TOPIC_ARN = os.environ.get("SNS_TOPIC_ARN")
     
     def lambda_handler(event, context):
         # Extract bucket and file name from the event
         bucket = event['Records'][0]['s3']['bucket']['name']
         key = event['Records'][0]['s3']['object']['key']
         
         # Read file from input S3
         response = s3.get_object(Bucket=bucket, Key=key)
         text = response['Body'].read().decode('utf-8')
         
         # Process: Count words
         word_count = len(text.split())
         char_count = len(text)
         
         report = {
             "filename": key,
             "word_count": word_count,
             "char_count": char_count,
             "status": "Processed"
         }
         
         # Save report to Output Bucket
         output_key = f"processed_{key}.json"
         s3.put_object(
             Bucket=OUTPUT_BUCKET,
             Key=output_key,
             Body=json.dumps(report, indent=4),
             ContentType='application/json'
         )
         
         # Send SNS Email Notification
         message = f"File processed: {key}\nWord Count: {word_count}\nSaved to: {output_key}"
         sns.publish(
             TopicArn=SNS_TOPIC_ARN,
             Subject="File Processing Complete",
             Message=message
         )
         
         return {
             'statusCode': 200,
             'body': json.dumps('File processed successfully')
         }
     ```

3. **S3 Event Notification**:
   - Go to your input S3 bucket -> Properties -> Event notifications.
   - Create a notification for `All object create events` and route it to your Lambda function.

4. **Amazon SNS**:
   - Create an SNS Topic (Standard).
   - Create an Email subscription for your topic and confirm it from your inbox.

---

## Testing Verification

1. **Verify Backend Status**:
   - Access `http://127.0.0.1:8000/`. It should display `Server Running`.
2. **Testing File Upload Restrictions**:
   - Try uploading a `.png` or `.pdf` file. The frontend drop-zone will display a validation error instantly.
   - Try uploading a text file exceeding `10 MB`. It will be rejected client-side.
3. **AWS Error Handlers**:
   - Run the system with empty `.env` credentials -> Upload will fail with: `AWS credentials not found. S3 client authentication failed.`
   - Run the system with a non-existent bucket name -> Upload will fail with: `The configured S3 bucket does not exist. Check S3_BUCKET_NAME config.`
4. **Successful Pipeline**:
   - Perform a valid `.txt` upload. The UI will show a real-time progress bar, a success alert, and record the file in the "Recent Uploads" list.

---

## Future Enhancements
- **Multipart Chunking**: Enable chunked uploads for files exceeding 100MB to S3 directly via pre-signed URLs.
- **DynamoDB Telemetry**: Store upload audit logging and execution results in DynamoDB database tables.
- **Cognito Integration**: Secure the portal with Amazon Cognito User Pools for user sign-in and authorization.
- **Real-Time WebSockets**: Use WebSockets in FastAPI to stream Lambda execution progress directly back to the user interface.
