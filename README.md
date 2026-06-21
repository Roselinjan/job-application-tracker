# 📋 Job Application Tracker

[![Live Demo](https://img.shields.io/badge/Live%20Demo-CloudFront-orange?style=for-the-badge&logo=amazon-aws)](https://djf9rktrofe90.cloudfront.net)
[![AWS](https://img.shields.io/badge/AWS-Serverless-yellow?style=for-the-badge&logo=amazon-aws)](https://aws.amazon.com/)
[![Step Functions](https://img.shields.io/badge/Step%20Functions-Workflow-pink?style=for-the-badge&logo=amazon-aws)](https://aws.amazon.com/step-functions/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

> A production-ready, fully serverless job application tracking system built on AWS. Submit your job application details, receive an instant confirmation email, and get an automatic follow-up reminder after your chosen number of days — powered by AWS Step Functions workflow orchestration.

🔗 **Live Demo:** [https://djf9rktrofe90.cloudfront.net](https://djf9rktrofe90.cloudfront.net)

---

## 📌 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [AWS Services Used](#aws-services-used)
- [Features](#features)
- [How It Works](#how-it-works)
- [Project Structure](#project-structure)
- [Setup & Deployment](#setup--deployment)
- [Security](#security)
- [Monitoring](#monitoring)
- [Future Improvements](#future-improvements)
- [Author](#author)

---

## Overview

Job Application Tracker solves a real problem — when actively job hunting you apply to dozens of companies and lose track of applications, forget to follow up, and miss opportunities.

This tool lets you:
- Log every job application in one place
- Receive an instant confirmation email with all details
- Get an automatic follow-up reminder after your chosen number of days (3, 5, 7, 14, or 30)
- Store all applications permanently in DynamoDB for future reference

### The Real Problem it Solves:
```
Without this tool:
Applied to 30 companies → forgot to follow up → missed opportunities ❌

With this tool:
Applied to Google → confirmation email immediately ✅
                 → 7 day reminder automatically ✅
                 → "Time to follow up!" ✅
```

---

## Architecture

User → CloudFront → S3
         ↓
    API Gateway
         ↓
      Lambda 1
      ↓      ↓
 DynamoDB   SES
         ↓
   Step Functions
         ↓
      Lambda 2
         ↓
        SES

## AWS Services Used

| Service | Purpose |
|---------|---------|
| **Amazon CloudFront** | Global CDN + HTTPS + Origin Access Control |
| **Amazon S3** | Private static website hosting |
| **Amazon API Gateway** | REST API with CORS — Regional endpoint |
| **AWS Lambda** (x2) | Serverless business logic |
| **Amazon DynamoDB** | NoSQL database — stores all applications |
| **Amazon SES** | Transactional email notifications |
| **AWS Step Functions** | Workflow orchestration — wait + reminder |
| **Amazon CloudWatch** | Logs and monitoring |
| **AWS IAM** | Roles and least privilege policies |

---

## Features

- ✅ **Fully Serverless** — no servers to manage
- ✅ **Global CDN** — fast loading via CloudFront
- ✅ **Private S3 + OAC** — S3 only accessible via CloudFront
- ✅ **Instant Confirmation Email** — HTML formatted with job details
- ✅ **Dynamic Follow Up Reminder** — user chooses 3/5/7/14/30 days
- ✅ **Step Functions Orchestration** — manages multi-step workflow
- ✅ **HTML Emails** — professional formatted emails with clickable job URL
- ✅ **Two Layer Validation** — frontend JS + Lambda backend
- ✅ **Environment Variables** — no hardcoded credentials
- ✅ **IAM Least Privilege** — only required permissions per Lambda
- ✅ **Retry Logic** — Step Functions retries failed states automatically
- ✅ **Error Handling** — graceful failure with WorkflowFailed state
- ✅ **CloudWatch Logging** — all Lambda executions logged automatically
- ✅ **Responsive Design** — works on mobile and desktop

---

## How It Works

### Step 1: User Fills the Form
```
User enters:
- Company Name
- Job Role
- Email
- Date Applied
- Job Posting URL
- Application Status
- Follow Up Reminder Days (3/5/7/14/30)
- Notes (optional)
```

### Step 2: Frontend Validation
```
JavaScript validates:
- All required fields filled
- Valid email format
- Valid URL format
→ If invalid → inline error messages shown
→ If valid → POST request sent to API Gateway
```

### Step 3: Lambda Processes Request
```
jobtracker-save Lambda:
1. Parses request body
2. Backend validation (second layer)
3. Generates UUID for application ID
4. Saves to DynamoDB
5. Sends HTML confirmation email via SES
6. Calculates waitSeconds from reminderDays
7. Triggers Step Functions with application data
8. Returns 200 success to frontend
```

### Step 4: Step Functions Workflow
```
State 1: Wait N days (SecondsPath: $.waitSeconds)
State 2: jobtracker-reminder Lambda → Send HTML reminder email
→ If Lambda fails → retry 3 times with exponential backoff
→ If all retries fail → WorkflowFailed state
```

### Step 5: Follow Up Reminder
```
After N days:
jobtracker-reminder Lambda:
- Receives application data from Step Functions
- Sends HTML reminder email with:
  - Application details
  - Clickable "View Job Posting" button
  - Follow up tips
```

---

## Project Structure

```
job-application-tracker/
├── index.html          # Frontend — form + validation + UI
└── README.md           # Project documentation
```

### Lambda Functions (in AWS):

```
jobtracker-save (Node.js 24.x)
├── DynamoDB PutItem
├── SES SendEmail (confirmation)
└── Step Functions StartExecution

jobtracker-reminder (Node.js 24.x)
└── SES SendEmail (follow up reminder)
```

### Step Functions State Machine:

```json
{
  "StartAt": "WaitNDays",
  "States": {
    "WaitNDays": {
      "Type": "Wait",
      "SecondsPath": "$.waitSeconds"
    },
    "SendFollowUpReminder": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:...",
      "Retry": [{ "MaxAttempts": 3, "BackoffRate": 2 }]
    },
    "WorkflowFailed": {
      "Type": "Fail"
    }
  }
}
```

---

## Setup & Deployment

### Prerequisites
- AWS Account
- AWS CLI configured (`aws configure`)
- Node.js 18+
- Git

### Phase 1: Host Static Website

```bash
# Clone the repo
git clone https://github.com/Roselinjan/job-application-tracker.git
cd job-application-tracker

# Create S3 bucket
aws s3 mb s3://your-bucket-name --region ap-south-1

# Upload index.html
aws s3 cp index.html s3://your-bucket-name/
```

**Configure CloudFront:**
- Create distribution pointing to S3 bucket
- Enable Origin Access Control (OAC)
- Set Default root object: `index.html`
- Redirect HTTP to HTTPS
- Update S3 bucket policy with OAC policy

---

### Phase 2: Set Up Backend

**1. Verify email in Amazon SES (ap-south-1)**

**2. Create DynamoDB table:**
```bash
aws dynamodb create-table \
  --table-name job-application \
  --attribute-definitions AttributeName=id,AttributeType=S \
  --key-schema AttributeName=id,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region ap-south-1
```

**3. Create Lambda functions with environment variables:**

`jobtracker-save`:
| Key | Value |
|-----|-------|
| `TABLE_NAME` | `job-application` |
| `MY_EMAIL` | `your@email.com` |
| `STATE_MACHINE_ARN` | `arn:aws:states:...` |

`jobtracker-reminder`:
| Key | Value |
|-----|-------|
| `MY_EMAIL` | `your@email.com` |

**4. Create IAM inline policies:**

`jobtracker-save` needs:
```json
{
  "Statement": [
    { "Action": ["dynamodb:PutItem"], "Effect": "Allow", "Resource": "*" },
    { "Action": ["ses:SendEmail", "ses:SendRawEmail"], "Effect": "Allow", "Resource": "*" },
    { "Action": ["states:StartExecution"], "Effect": "Allow", "Resource": "*" }
  ]
}
```

`jobtracker-reminder` needs:
```json
{
  "Statement": [
    { "Action": ["ses:SendEmail", "ses:SendRawEmail"], "Effect": "Allow", "Resource": "*" }
  ]
}
```

**5. Create Step Functions State Machine:**
- Type: Standard
- Use SecondsPath for dynamic wait time
- Add Retry with exponential backoff
- Add Catch for graceful error handling

**6. Create API Gateway:**
- Type: REST API — Regional
- Resource: `/applications`
- Method: POST → Lambda integration
- Enable CORS
- Deploy to `prod` stage

**7. Update index.html with API Gateway URL:**
```javascript
const API_URL = 'https://your-api-id.execute-api.ap-south-1.amazonaws.com/prod/applications';
```

**8. Upload updated index.html to S3 and invalidate CloudFront cache**

---

## Security

| Feature | Implementation |
|---------|---------------|
| Private S3 bucket | OAC — only CloudFront can access S3 |
| No hardcoded secrets | All values in Lambda environment variables |
| Input validation | Frontend JS + Lambda double validation |
| IAM least privilege | Each Lambda has only required permissions |
| HTTPS enforced | CloudFront redirects HTTP → HTTPS |
| CORS configured | Only required headers and methods allowed |

---

## Monitoring

CloudWatch automatically captures:
- Every Lambda invocation log
- Execution duration and memory
- Error logs with stack traces
- Step Functions state transitions

To view logs:
1. AWS Console → CloudWatch → Log groups
2. `/aws/lambda/jobtracker-save`
3. `/aws/lambda/jobtracker-reminder`

---

## Future Improvements

- [ ] Dashboard to view all applications with status counts
- [ ] Update application status (Applied → Interview → Offered/Rejected)
- [ ] Delete application
- [ ] Filter applications by status
- [ ] Move SES out of sandbox for user confirmation emails
- [ ] Google reCAPTCHA to prevent spam
- [ ] API Gateway rate limiting
- [ ] CloudFront WAF for DDoS protection
- [ ] Custom domain via Route 53
- [ ] AWS CDK for Infrastructure as Code
- [ ] DynamoDB GSI for efficient status queries

---

## Author

**RoselinJanice**
- GitHub: [@Roselinjan](https://github.com/Roselinjan)
- Live Demo: [https://djf9rktrofe90.cloudfront.net](https://djf9rktrofe90.cloudfront.net)

---

⭐ If you found this project helpful, please give it a star on GitHub!
