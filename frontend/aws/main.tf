terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "eu-north-1"
}

# 1. ECR Repository (to store Docker Images)
resource "aws_ecr_repository" "webdpro_repo" {
  name = "webdpro-repo"
  force_delete = true
}

# 2. VPC & Networking (Serverless Config)
resource "aws_default_vpc" "default" {}
resource "aws_default_subnet" "default_a" {
  availability_zone = "eu-north-1a"
}
resource "aws_default_subnet" "default_b" {
  availability_zone = "eu-north-1b"
}

resource "aws_security_group" "lb_sg" {
  name        = "webdpro-lb-sg"
  description = "Allow HTTP inbound"
  vpc_id      = aws_default_vpc.default.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "ecs_sg" {
  name        = "webdpro-ecs-sg"
  vpc_id      = aws_default_vpc.default.id

  ingress {
    from_port       = 3000
    to_port         = 3000
    protocol        = "tcp"
    security_groups = [aws_security_group.lb_sg.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# 3. ECS Cluster & Fargate Service
resource "aws_ecs_cluster" "webdpro_cluster" {
  name = "webdpro-cluster"
}

# IAM Role for Task Execution (Pull Request, Logs)
resource "aws_iam_role" "ecs_execution_role" {
  name = "webdpro-execution-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = { Service = "ecs-tasks.amazonaws.com" }
    }]
  })
}
resource "aws_iam_role_policy_attachment" "ecs_execution_attach" {
  role       = aws_iam_role.ecs_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# IAM Role for the App Code (Access Bedrock)
resource "aws_iam_role" "ecs_task_role" {
  name = "webdpro-task-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = { Service = "ecs-tasks.amazonaws.com" }
    }]
  })
}

# Policy: Allow Bedrock Invoke
resource "aws_iam_role_policy" "bedrock_access" {
  name = "bedrock_access"
  role = aws_iam_role.ecs_task_role.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = ["bedrock:InvokeModel", "bedrock:ListFoundationModels"]
        Resource = "*"
      }
    ]
  })
}

resource "aws_cloudwatch_log_group" "webdpro_logs" {
  name = "/ecs/webdpro"
}

resource "aws_ecs_task_definition" "app" {
  family                   = "webdpro-task"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "512"
  memory                   = "1024"
  execution_role_arn       = aws_iam_role.ecs_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_task_role.arn

  container_definitions = jsonencode([{
    name  = "webdpro-app"
    image = "${aws_ecr_repository.webdpro_repo.repository_url}:latest"
    essential = true
    portMappings = [{ containerPort = 3000, hostPort = 3000 }]
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = "/ecs/webdpro"
        "awslogs-region"        = "eu-north-1"
        "awslogs-stream-prefix" = "ecs"
      }
    }
    environment = [
      { name = "AWS_REGION", value = "eu-north-1" }
    ]
  }])
}

# 4. Load Balancer
resource "aws_lb" "main" {
  name               = "webdpro-lb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.lb_sg.id]
  subnets            = [aws_default_subnet.default_a.id, aws_default_subnet.default_b.id]
}

resource "aws_lb_target_group" "app" {
  name        = "webdpro-tg"
  port        = 3000
  protocol    = "HTTP"
  vpc_id      = aws_default_vpc.default.id
  target_type = "ip"
  health_check {
    path = "/" 
  }
}

resource "aws_lb_listener" "front_end" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app.arn
  }
}

resource "aws_ecs_service" "main" {
  name            = "webdpro-service"
  cluster         = aws_ecs_cluster.webdpro_cluster.id
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = [aws_default_subnet.default_a.id, aws_default_subnet.default_b.id]
    security_groups  = [aws_security_group.ecs_sg.id]
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.app.arn
    container_name   = "webdpro-app"
    container_port   = 3000
  }

  depends_on = [aws_lb_listener.front_end]
}

output "load_balancer_url" {
  value = aws_lb.main.dns_name
}

# 5. CI/CD Pipeline (Automated Deployment)

# A. Code Repository
resource "aws_codecommit_repository" "repo" {
  name        = "webdpro-repo"
  description = "WebDPro Source Code"
}

# B. Artifact Bucket
resource "aws_s3_bucket" "pipeline_bucket" {
  bucket_prefix = "webdpro-pipeline-"
  force_destroy = true
}

# C. IAM Roles (Permissions)
resource "aws_iam_role" "codepipeline_role" {
  name = "webdpro-pipeline-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = { Service = "codepipeline.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy" "codepipeline_policy" {
  name = "codepipeline-policy"
  role = aws_iam_role.codepipeline_role.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = ["s3:*", "codecommit:*", "codebuild:*", "ecs:*", "iam:PassRole"]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role" "codebuild_role" {
  name = "webdpro-codebuild-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = { Service = "codebuild.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy" "codebuild_policy" {
  name = "codebuild-policy"
  role = aws_iam_role.codebuild_role.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:*",
          "s3:*",
          "ecr:*",
          "ecs:*",
          "iam:PassRole"
        ]
        Resource = "*"
      }
    ]
  })
}

# D. CodeBuild Project
resource "aws_codebuild_project" "build" {
  name          = "webdpro-build"
  service_role  = aws_iam_role.codebuild_role.arn
  build_timeout = "10"

  artifacts {
    type = "CODEPIPELINE"
  }

  environment {
    compute_type                = "BUILD_GENERAL1_SMALL"
    image                       = "aws/codebuild/standard:7.0"
    type                        = "LINUX_CONTAINER"
    image_pull_credentials_type = "CODEBUILD"
    privileged_mode             = true # Required for Docker

    environment_variable {
      name  = "ECR_REPO_URL"
      value = aws_ecr_repository.webdpro_repo.repository_url
    }
    environment_variable {
      name  = "AWS_DEFAULT_REGION"
      value = "eu-north-1"
    }
  }

  source {
    type      = "CODEPIPELINE"
    buildspec = "aws/buildspec.yml"
  }
}

# E. CodePipeline
resource "aws_codepipeline" "pipeline" {
  name     = "webdpro-pipeline"
  role_arn = aws_iam_role.codepipeline_role.arn

  artifact_store {
    location = aws_s3_bucket.pipeline_bucket.bucket
    type     = "S3"
  }

  stage {
    name = "Source"
    action {
      name             = "Source"
      category         = "Source"
      owner            = "AWS"
      provider         = "CodeCommit"
      version          = "1"
      output_artifacts = ["source_output"]
      configuration = {
        RepositoryName = aws_codecommit_repository.repo.name
        BranchName     = "main"
      }
    }
  }

  stage {
    name = "Build_and_Deploy"
    action {
      name             = "Build"
      category         = "Build"
      owner            = "AWS"
      provider         = "CodeBuild"
      input_artifacts  = ["source_output"]
      output_artifacts = ["build_output"] // Not used but required
      version          = "1"
      configuration = {
        ProjectName = aws_codebuild_project.build.name
      }
    }
  }
}

output "codecommit_repo_clone_url" {
  value = aws_codecommit_repository.repo.clone_url_http
}

