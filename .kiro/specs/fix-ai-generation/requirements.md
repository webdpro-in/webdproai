# Requirements Document: Fix AI Generation Functionality

## Introduction

The WebDPro system has deployed Lambda functions for AI generation in eu-north-1, but they are not functioning when called from the frontend. The API Gateway endpoint exists at https://l0wi495th5.execute-api.eu-north-1.amazonaws.com/dev, but Lambda functions are not being invoked, and there are multiple configuration issues preventing successful AI generation requests.

This specification addresses the complete fix for the AI generation pipeline, including IAM permissions, API Gateway configuration, Lambda handler implementation, CORS setup, and frontend integration.

## Glossary

- **Lambda_Function**: AWS Lambda serverless compute function that executes the AI generation code
- **API_Gateway**: AWS API Gateway service that provides HTTP endpoints for Lambda functions
- **Bedrock**: AWS Bedrock service providing foundation model APIs for AI generation
- **IAM_Role**: AWS Identity and Access Management role that grants permissions to Lambda functions
- **CORS**: Cross-Origin Resource Sharing, HTTP headers that allow frontend to call backend APIs
- **Cognito**: AWS Cognito service for user authentication and authorization
- **CloudWatch**: AWS CloudWatch service for logging and monitoring
- **Frontend**: Next.js web application that users interact with
- **Backend**: Core API service that orchestrates store generation
- **AI_Service**: Dedicated Lambda service for AI generation using Bedrock
- **Response_Format**: Standard API Gateway Lambda proxy integration response structure

## Requirements

### Requirement 1: IAM Permissions for Bedrock Access

**User Story:** As a Lambda function, I want to invoke Bedrock models, so that I can generate AI content for websites.

#### Acceptance Criteria

1. WHEN the Lambda execution role is created, THE System SHALL grant bedrock:InvokeModel permission for all foundation models in us-east-1
2. WHEN the Lambda execution role is created, THE System SHALL grant bedrock:InvokeModelWithResponseStream permission for streaming responses
3. WHEN the Lambda function attempts to call Bedrock, THE System SHALL allow the request without permission errors
4. THE IAM_Role SHALL specify the correct resource ARN format: arn:aws:bedrock:us-east-1::foundation-model/*

### Requirement 2: API Gateway Route Configuration

**User Story:** As a frontend developer, I want to call the correct API endpoints, so that my requests reach the appropriate Lambda functions.

#### Acceptance Criteria

1. WHEN a POST request is sent to /ai/generate, THE API_Gateway SHALL route it to the generateWebsite Lambda function
2. WHEN a POST request is sent to /ai/code, THE API_Gateway SHALL route it to the generateCode Lambda function
3. WHEN a POST request is sent to /ai/images, THE API_Gateway SHALL route it to the generateImages Lambda function
4. WHEN an OPTIONS request is sent to any /ai/* route, THE API_Gateway SHALL return CORS preflight headers
5. THE API_Gateway SHALL use Lambda proxy integration for all routes

### Requirement 3: CORS Configuration

**User Story:** As a frontend application, I want to make cross-origin requests to the AI service, so that I can generate websites from the browser.

#### Acceptance Criteria

1. WHEN an OPTIONS preflight request is received, THE Lambda_Function SHALL return status code 200 with appropriate CORS headers
2. WHEN any response is returned, THE System SHALL include Access-Control-Allow-Origin header set to '*'
3. WHEN any response is returned, THE System SHALL include Access-Control-Allow-Methods header with GET,POST,PUT,DELETE,OPTIONS
4. WHEN any response is returned, THE System SHALL include Access-Control-Allow-Headers header with Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token
5. WHEN any response is returned, THE System SHALL include Access-Control-Allow-Credentials header set to true

### Requirement 4: Lambda Response Format

**User Story:** As an API Gateway, I want Lambda functions to return properly formatted responses, so that I can send valid HTTP responses to clients.

#### Acceptance Criteria

1. WHEN a Lambda function completes successfully, THE Lambda_Function SHALL return an object with statusCode, headers, and body properties
2. WHEN a Lambda function completes successfully, THE Lambda_Function SHALL set statusCode to an appropriate HTTP status code (200, 201, 400, 500, etc.)
3. WHEN a Lambda function returns data, THE Lambda_Function SHALL stringify the body property as JSON
4. WHEN a Lambda function encounters an error, THE Lambda_Function SHALL return statusCode 500 with error details in the body
5. THE Response_Format SHALL include all required CORS headers in the headers property

### Requirement 5: Request Body Parsing

**User Story:** As a Lambda function, I want to correctly parse incoming request data, so that I can process user inputs for AI generation.

#### Acceptance Criteria

1. WHEN a request is received, THE Lambda_Function SHALL parse the event.body as JSON
2. WHEN parsing fails, THE Lambda_Function SHALL return statusCode 400 with an error message
3. WHEN required fields are missing, THE Lambda_Function SHALL return statusCode 400 with a descriptive error message
4. THE Lambda_Function SHALL validate that input, tenantId, and storeId fields are present
5. THE Lambda_Function SHALL extract nested input properties (businessName, businessType, description, etc.)

### Requirement 6: Error Handling and Logging

**User Story:** As a developer, I want comprehensive error logging, so that I can debug issues when AI generation fails.

#### Acceptance Criteria

1. WHEN any error occurs, THE Lambda_Function SHALL log the error to CloudWatch with full stack trace
2. WHEN a request is received, THE Lambda_Function SHALL log the request details (excluding sensitive data)
3. WHEN Bedrock API calls fail, THE Lambda_Function SHALL log the specific error message and model used
4. WHEN generation completes successfully, THE Lambda_Function SHALL log success metrics (generation time, sections created, images generated)
5. THE Lambda_Function SHALL use structured logging with consistent log prefixes for filtering

### Requirement 7: Bedrock API Integration

**User Story:** As a Lambda function, I want to correctly invoke Bedrock models, so that I can generate AI content.

#### Acceptance Criteria

1. WHEN invoking Bedrock, THE Lambda_Function SHALL use the correct region (us-east-1)
2. WHEN invoking Bedrock, THE Lambda_Function SHALL use the BedrockRuntimeClient from AWS SDK v3
3. WHEN a primary model fails, THE Lambda_Function SHALL attempt fallback models in order
4. WHEN all models fail, THE Lambda_Function SHALL return a descriptive error to the caller
5. THE Lambda_Function SHALL handle both streaming and non-streaming Bedrock responses

### Requirement 8: Frontend API Integration

**User Story:** As a frontend application, I want to call the AI service with proper authentication, so that I can generate websites for authenticated users.

#### Acceptance Criteria

1. WHEN making an API request, THE Frontend SHALL include the Authorization header with the Cognito JWT token
2. WHEN making an API request, THE Frontend SHALL send the request to the correct AI_Service endpoint URL
3. WHEN the API returns an error, THE Frontend SHALL display a user-friendly error message
4. WHEN the API returns success, THE Frontend SHALL extract the website URL from the response
5. THE Frontend SHALL handle loading states during the generation process

### Requirement 9: Authentication and Authorization

**User Story:** As a system, I want to verify user identity, so that only authenticated users can generate websites.

#### Acceptance Criteria

1. WHERE Cognito authorizer is configured, WHEN a request is received, THE API_Gateway SHALL validate the JWT token
2. WHERE Cognito authorizer is configured, WHEN token validation fails, THE API_Gateway SHALL return statusCode 401
3. WHEN a valid token is provided, THE Lambda_Function SHALL extract the tenant ID from the token claims
4. WHEN no valid token is provided, THE Lambda_Function SHALL return statusCode 401 with an error message
5. THE Lambda_Function SHALL use the tenant ID for all data operations

### Requirement 10: CloudWatch Monitoring

**User Story:** As a DevOps engineer, I want to monitor Lambda function execution, so that I can identify and resolve issues quickly.

#### Acceptance Criteria

1. WHEN a Lambda function is invoked, THE System SHALL create a CloudWatch log stream
2. WHEN errors occur, THE System SHALL log error metrics to CloudWatch
3. WHEN generation completes, THE System SHALL log duration and success metrics
4. THE Lambda_Function SHALL use console.log for all logging (automatically sent to CloudWatch)
5. THE System SHALL retain logs for at least 7 days for debugging purposes
