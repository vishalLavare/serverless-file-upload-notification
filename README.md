# ☁️ Serverless File Processing System

<p align="center">

![Python](https://img.shields.io/badge/Python-3.12-blue?style=for-the-badge&logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-green?style=for-the-badge&logo=fastapi)
![AWS](https://img.shields.io/badge/AWS-Serverless-orange?style=for-the-badge&logo=amazonaws)
![Lambda](https://img.shields.io/badge/AWS-Lambda-yellow?style=for-the-badge)
![S3](https://img.shields.io/badge/Amazon-S3-red?style=for-the-badge)
![SNS](https://img.shields.io/badge/Amazon-SNS-blue?style=for-the-badge)

</p>

---

## 📖 Project Overview

The **Serverless File Processing System** is an AWS-powered application that enables users to upload text files through a web interface. The uploaded files are automatically processed using AWS Lambda, stored in Amazon S3, and users receive an email notification through Amazon SNS.

The project demonstrates a complete **event-driven serverless architecture** using AWS cloud services with a FastAPI backend and modern responsive frontend.

---

# 🚀 Features

- 📂 Upload `.txt` files through a web interface
- ☁️ Store files securely in Amazon S3
- ⚡ Automatic AWS Lambda execution on upload
- 📊 Count words and characters
- 📄 Generate processed JSON report
- 📥 Store processed report back to S3
- 📧 Email notification using Amazon SNS
- 📈 Upload progress bar
- 🌙 Dark Mode support
- 📱 Responsive UI
- 🔒 IAM-based security
- 📋 CloudWatch logging
- ❌ Error handling and validation

---

# 🏗️ Architecture

```text
                  User
                    │
                    ▼
        HTML • CSS • JavaScript
                    │
                    ▼
             FastAPI Backend
                    │
                    ▼
               Amazon S3 Bucket
                    │
         ObjectCreated Event
                    │
                    ▼
               AWS Lambda
                    │
      ┌─────────────┴──────────────┐
      │                            │
      ▼                            ▼
Processed JSON              Amazon SNS
Saved to S3                      │
                                 ▼
                         Email Notification
```

---

# 🛠️ Technology Stack

| Category | Technology |
|----------|------------|
| Frontend | HTML5, CSS3, JavaScript, Bootstrap 5 |
| Backend | FastAPI |
| Cloud | AWS |
| Storage | Amazon S3 |
| Compute | AWS Lambda |
| Notification | Amazon SNS |
| SDK | boto3 |
| Language | Python |

---

# 📂 Project Structure

```text
Serverless File Processing System

├── backend/
│   ├── app.py
│   ├── routes.py
│   ├── config.py
│   ├── s3_service.py
│   ├── utils.py
│   ├── requirements.txt
│   └── .env
│
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── script.js
│
├── lambda/
│   └── lambda_function.py
│
├── screenshots/
│   ├── home.png
│   ├── upload.png
│   ├── lambda.png
│   ├── s3.png
│   └── email.png
│
└── README.md
```

---

# ⚙️ Installation

## Clone Repository

```bash
git clone https://github.com/yourusername/serverless-file-processing-system.git

cd serverless-file-processing-system
```

---

## Backend Setup

```bash
cd backend

python -m venv venv

# Windows
venv\Scripts\activate

# Linux/macOS
source venv/bin/activate
```

Install dependencies

```bash
pip install -r requirements.txt
```

Run FastAPI

```bash
uvicorn app:app --reload
```

Open

```
http://localhost:8000/docs
```

---

# 🌐 Frontend

Simply open

```
frontend/index.html
```

or

```bash
python -m http.server
```

---

# ☁️ AWS Configuration

## Amazon S3

Create a bucket

```
serverless-file-processing-system
```

Enable

- Object Created Event

---

## AWS Lambda

Runtime

```
Python 3.12
```

Trigger

```
Amazon S3
```

Permissions

```
AmazonS3FullAccess
AmazonSNSFullAccess
AWSLambdaBasicExecutionRole
```

---

## Amazon SNS

Create Topic

```
serverless-SNS
```

Create Email Subscription

Confirm subscription from Gmail.

---

# 🔐 IAM Permissions

Example policy

```json
{
  "Version":"2012-10-17",
  "Statement":[
    {
      "Effect":"Allow",
      "Action":[
        "s3:GetObject",
        "s3:PutObject",
        "s3:ListBucket"
      ],
      "Resource":[
        "arn:aws:s3:::serverless-file-processing-system",
        "arn:aws:s3:::serverless-file-processing-system/*"
      ]
    },
    {
      "Effect":"Allow",
      "Action":[
        "sns:Publish"
      ],
      "Resource":"arn:aws:sns:*:*:*"
    },
    {
      "Effect":"Allow",
      "Action":[
        "logs:*"
      ],
      "Resource":"*"
    }
  ]
}
```

---

# 🔄 Workflow

```
Upload File

↓

FastAPI

↓

Amazon S3

↓

S3 Event

↓

AWS Lambda

↓

Read File

↓

Count Words

↓

Generate JSON Report

↓

Store JSON in S3

↓

Publish SNS

↓

Email Notification
```

---

# 📊 API

## Upload File

```
POST /upload
```

Request

```
multipart/form-data

file=text.txt
```

Response

```json
{
    "message":"File uploaded successfully"
}
```

---

# 📸 Screenshots

## Home Page

```
screenshots/home.png
```

---

## Upload Progress

```
screenshots/upload.png
```

---

## Amazon S3

```
screenshots/s3.png
```

---

## AWS Lambda

```
screenshots/lambda.png
```

---

## Email Notification

```
screenshots/email.png
```

---

# ✅ Testing

✔ Upload valid `.txt` file

✔ Lambda automatically triggered

✔ JSON report generated

✔ Report stored in S3

✔ Email notification received

✔ CloudWatch logs verified

---

# 🚀 Future Enhancements

- OCR using Amazon Textract
- PDF Processing
- Virus Scanning
- AI Document Summarization
- DynamoDB Integration
- Amazon EventBridge
- AWS Step Functions
- Amazon Cognito Authentication
- CloudFront CDN
- Multi-file Upload

---

# 👨‍💻 Author

**Vishal Lavare**

Cloud & DevOps Engineer

- AWS Cloud
- Docker
- Kubernetes
- CI/CD
- Python
- FastAPI

---

# ⭐ If you found this project useful, don't forget to Star this repository!