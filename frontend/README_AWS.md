# Deploying WebDPro to AWS (with CI/CD)

The infrastructure includes a fully automated **CodePipeline**.

## 🚀 Initial Setup (One Time)

1.  **Open CloudShell** in [AWS Console (eu-north-1)](https://eu-north-1.console.aws.amazon.com).
2.  **Upload & Deploy Terraform:**
    ```bash
    unzip webdproAI.zip
    cd webdproAI/aws
    terraform init
    terraform apply -auto-approve
    ```
    *Copy the `codecommit_repo_clone_url` and `load_balancer_url` from the output.*

## 🔄 How to Push Updates (The Workflow)

You do NOT need to run docker commands manually anymore.

1.  **Push to CodeCommit:**
    In your local project folder (or CloudShell):
    ```bash
    # (If using CloudShell, the code is already there, just init git)
    cd ~/webdproAI
    git init
    git add .
    git commit -m "Initial commit"
    
    # Configure Helper (CloudShell has this built-in)
    git config --global credential.helper '!aws codecommit credential-helper $@'
    git config --global credential.UseHttpPath true

    # Push to AWS
    git remote add aws <your_codecommit_repo_clone_url>
    git push aws main
    ```

2.  **Watch It Deploy:**
    *   Go to **AWS CodePipeline** console.
    *   You will see the pipeline start: **Source** (Green) -> **Build_and_Deploy** (Green).
    *   Once green, your website at `load_balancer_url` is updated!

## ✅ Architecture
*   **Git Push** -> **AWS CodeCommit**
*   **CodeCommit** -> **CodePipeline**
*   **CodePipeline** -> **CodeBuild** (Docker Build & Push)
*   **CodeBuild** -> **ECS Fargate** (Live Update)

---

# 📚 Appendix: CloudShell & CLI Cheatsheet

Helpful commands for managing your environment directly from AWS CloudShell.

## 📂 File Transfer (CloudShell)
**Method 1: Direct Upload**
1. Click **Actions** -> **Upload file**.
2. Select your zip file.

**Method 2: Via S3 (For large files)**
```bash
aws s3 cp s3://your-bucket-name/your-file.zip ./
```

**Extracting:**
```bash
unzip your-file.zip -d extracted-folder
cd extracted-folder
```

## 🛠️ Common Service Commands (eu-north-1)

**ECS Fargate:**
```bash
# List Clusters
aws ecs list-clusters --region eu-north-1
# List Services
aws ecs list-services --cluster webdpro-cluster --region eu-north-1
```

**ECR (Docker Registry):**
```bash
# List Repos
aws ecr describe-repositories --region eu-north-1
# Docker Login
aws ecr get-login-password --region eu-north-1 | docker login --username AWS --password-stdin <your-account-id>.dkr.ecr.eu-north-1.amazonaws.com
```

### 4. Build & Push Docker Image
> **Support Tip:** If you do not have Docker installed on your local computer, please use **AWS CloudShell** for this step. It has Docker pre-installed.

Go back to the root folder and build the image:
```bash
cd ..
# Replace with your actual ECR Repo URL
export ECR_REPO_URL=941172143855.dkr.ecr.eu-north-1.amazonaws.com/webdpro-repo

aws ecr get-login-password --region eu-north-1 | docker login --username AWS --password-stdin $ECR_REPO_URL

docker build -t webdpro-app .
docker tag webdpro-app:latest $ECR_REPO_URL:latest
docker push $ECR_REPO_URL:latest
```

**Networking:**
```bash
# List Load Balancers
aws elbv2 describe-load-balancers --region eu-north-1
```

**AWS Bedrock (AI):**
```bash
# List Available Models
aws bedrock list-foundation-models --region eu-north-1
```

**Debugging (CloudWatch Logs):**
```bash
# Verify Log Group exists
aws logs describe-log-groups --region eu-north-1
# (Best viewed in AWS Console UI for readability)
```

> **Note:** CloudShell provides 1GB of persistent storage. The environment includes AWS CLI, Docker, and Python pre-installed.
