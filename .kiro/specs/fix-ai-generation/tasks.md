# Implementation Plan: Fix AI Generation Functionality

## Overview

This implementation plan fixes the WebDPro AI generation functionality by addressing IAM permissions, API Gateway configuration, Lambda handler response formats, CORS setup, error handling, and frontend integration. The tasks are organized to fix the most critical issues first (IAM and response format), then routing and CORS, followed by error handling improvements, and finally testing.

## Tasks

- [x] 1. Fix IAM permissions for Bedrock access
  - Update ai_services/serverless.yml to add Bedrock permissions to Lambda execution role
  - Add bedrock:InvokeModel permission for arn:aws:bedrock:us-east-1::foundation-model/*
  - Add bedrock:InvokeModelWithResponseStream permission for streaming responses
  - Verify IAM role configuration in CloudFormation template after deployment
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [-] 2. Fix Lambda handler response format and OPTIONS handling
  - [x] 2.1 Update generateWebsite handler in ai_services/src/handlers/generate.ts
    - Add handleOptions helper function that returns proper CORS response
    - Add OPTIONS method check at start of handler
    - Improve error handling with try-catch for JSON parsing
    - Add validation for required fields (input, tenantId, storeId)
    - Ensure all responses use createResponse helper with proper CORS headers
    - Add structured logging with consistent prefixes
    - _Requirements: 3.1, 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3, 5.4, 5.5, 6.2, 6.5_

  - [ ] 2.2 Write property test for response structure validity
    - **Property 3: Response Structure Validity**
    - **Validates: Requirements 4.1**

  - [ ] 2.3 Write property test for CORS headers
    - **Property 2: CORS Headers on All Responses**
    - **Validates: Requirements 3.2, 3.3, 3.4, 3.5, 4.5**

  - [ ] 2.4 Write property test for OPTIONS handling
    - **Property 1: OPTIONS Request Handling**
    - **Validates: Requirements 2.4, 3.1**

  - [x] 2.5 Update generateCode handler with same improvements
    - Add OPTIONS handling
    - Improve error handling and validation
    - Add structured logging
    - _Requirements: 3.1, 4.1, 4.2, 4.3, 4.4, 5.1, 5.2_

  - [x] 2.6 Update generateImages handler with same improvements
    - Add OPTIONS handling
    - Improve error handling and validation
    - Add structured logging
    - _Requirements: 3.1, 4.1, 4.2, 4.3, 4.4, 5.1, 5.2_

- [x] 3. Fix API Gateway route configuration
  - Update ai_services/serverless.yml functions section
  - Ensure /ai/generate routes to generateWebsite handler
  - Ensure /ai/code routes to generateCode handler (if not already correct)
  - Ensure /ai/images routes to generateImages handler (if not already correct)
  - Simplify CORS configuration to use `cors: true` for all routes
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [-] 4. Enhance error handling and logging
  - [x] 4.1 Add comprehensive error logging to orchestrator
    - Log all Bedrock API calls with model ID and parameters
    - Log errors with full context (tenantId, storeId, step, model)
    - Log success metrics (duration, sections, images, HTML size)
    - _Requirements: 6.1, 6.3, 6.4_

  - [ ] 4.2 Write property test for error response format
    - **Property 6: Error Response Format**
    - **Validates: Requirements 4.4**

  - [ ] 4.3 Write property test for JSON parsing robustness
    - **Property 7: JSON Parsing Robustness**
    - **Validates: Requirements 5.1, 5.2**

  - [ ] 4.4 Write property test for required field validation
    - **Property 8: Required Field Validation**
    - **Validates: Requirements 5.3, 5.4**

- [-] 5. Improve Bedrock integration and retry logic
  - [x] 5.1 Verify Bedrock client configuration
    - Ensure BedrockRuntimeClient uses us-east-1 region
    - Verify model IDs are correct in environment variables
    - Add logging for Bedrock client initialization
    - _Requirements: 7.1, 7.2_

  - [x] 5.2 Enhance fallback model retry logic
    - Ensure orchestrator tries fallback models in sequence
    - Add logging for each retry attempt
    - Return descriptive error when all models fail
    - _Requirements: 7.3, 7.4_

  - [ ] 5.3 Write property test for Bedrock fallback retry
    - **Property 11: Bedrock Fallback Retry**
    - **Validates: Requirements 7.3**

  - [ ] 5.4 Write unit tests for Bedrock error handling
    - Test primary model failure triggers fallback
    - Test all models failing returns error
    - Test streaming and non-streaming responses
    - _Requirements: 7.3, 7.4, 7.5_

- [x] 6. Enhance Backend AI client with retry logic
  - Update backend/src/lib/ai-client.ts
  - Add retry logic with exponential backoff (3 attempts)
  - Improve error logging with attempt numbers
  - Add timeout handling for long-running requests
  - _Requirements: 6.1_

- [x] 7. Verify frontend integration (no changes needed)
  - Review frontend/lib/api.ts to confirm it's correct
  - Verify Authorization header is included in fetchAPI helper
  - Verify error handling displays user-friendly messages
  - Note: Frontend calls Backend, which calls AI Service (indirect integration)
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 8. Add integration tests
  - [ ] 8.1 Write integration test for API Gateway routing
    - Test POST /ai/generate reaches generateWebsite handler
    - Test POST /ai/code reaches generateCode handler
    - Test POST /ai/images reaches generateImages handler
    - _Requirements: 2.1, 2.2, 2.3_

  - [ ] 8.2 Write integration test for Bedrock permissions
    - Test Lambda can invoke Bedrock without permission errors
    - _Requirements: 1.3_

  - [ ] 8.3 Write integration test for authentication
    - Test valid Cognito token allows request
    - Test invalid token returns 401
    - Test missing token returns 401
    - _Requirements: 9.1, 9.2, 9.4_

- [x] 9. Deploy and verify
  - Deploy ai_services using serverless deploy
  - Check CloudFormation stack for IAM role permissions
  - Verify API Gateway routes in AWS console
  - Test OPTIONS request returns CORS headers
  - Test POST request with valid data succeeds
  - Check CloudWatch logs for Lambda invocations
  - Verify Bedrock API calls appear in logs
  - _Requirements: All_

- [ ] 10. Checkpoint - Ensure all tests pass and deployment is successful
  - Run all unit tests and property tests
  - Verify integration tests pass
  - Check CloudWatch logs for any errors
  - Test end-to-end flow from frontend
  - Ask the user if questions arise

## Notes

- Each task references specific requirements for traceability
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Integration tests verify cross-component interactions
- The fix prioritizes critical issues (IAM, response format) before enhancements (retry logic, comprehensive testing)
