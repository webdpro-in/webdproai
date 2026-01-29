/**
 * AI Services - Main Generation Handler
 * Exposes the orchestrator as a Lambda function
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { orchestrateSiteGeneration } from '../orchestrator';
import { orchestrateSiteGenerationFallback } from '../fallback-orchestrator';
import { UserInput } from '../schemas';

// Helper: Create standardized response with CORS headers
const createResponse = (statusCode: number, body: any): APIGatewayProxyResult => ({
   statusCode,
   headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
      'Access-Control-Allow-Credentials': 'true',
   },
   body: JSON.stringify(body),
});

// Handle OPTIONS preflight requests
const handleOptions = (): APIGatewayProxyResult => {
   return createResponse(200, { message: 'CORS preflight successful' });
};

/**
 * POST /ai/generate
 * Generate complete website from user input
 */
export const generateWebsite = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
   // Handle OPTIONS preflight
   if (event.httpMethod === 'OPTIONS') {
      return handleOptions();
   }

   try {
      console.log('[Generate Website] Request received', {
         method: event.httpMethod,
         path: event.path,
         headers: event.headers,
      });

      // Parse and validate request body
      let body: any;
      try {
         body = JSON.parse(event.body || '{}');
      } catch (parseError) {
         console.error('[Generate Website] JSON parse error:', parseError);
         return createResponse(400, {
            error: 'Invalid JSON in request body',
         });
      }

      const { input, tenantId, storeId, mode } = body;

      // Validate required fields
      if (!input) {
         return createResponse(400, {
            error: 'Missing required field: input',
         });
      }

      if (!tenantId) {
         return createResponse(400, {
            error: 'Missing required field: tenantId',
         });
      }

      if (!storeId) {
         return createResponse(400, {
            error: 'Missing required field: storeId',
         });
      }

      // Construct UserInput with defaults
      const userInput: UserInput = {
         businessName: input.businessName || 'My Business',
         businessType: input.businessType || 'general',
         location: input.location || 'India',
         description: input.description || input.prompt || '',
         language: input.language || 'en',
         themePreference: input.themePreference,
      };

      const useFallbackOnly = mode === 'fallback';
      console.log('[Generate Website] Processing generation', {
         businessName: userInput.businessName,
         businessType: userInput.businessType,
         tenantId,
         storeId,
         mode: useFallbackOnly ? 'fallback' : 'bedrock-then-fallback',
      });

      const startTime = Date.now();
      let result;

      if (useFallbackOnly) {
         console.log('[Generate Website] Using fallback (fast) generation only.');
         result = await orchestrateSiteGenerationFallback(userInput, tenantId, storeId);
      } else {
         try {
            console.log('[Generate Website] Attempting Bedrock generation...');
            result = await orchestrateSiteGeneration(userInput, tenantId, storeId);
         } catch (bedrockError) {
            console.log('[Generate Website] Bedrock failed, using fallback generation...');
            const errorMessage = bedrockError instanceof Error ? bedrockError.message : 'Unknown error';
            console.log('[Generate Website] Fallback reason:', errorMessage);
            result = await orchestrateSiteGenerationFallback(userInput, tenantId, storeId);
         }
      }

      const duration = Date.now() - startTime;

      console.log('[Generate Website] Generation successful', {
         duration,
         websiteUrl: result.websiteUrl,
         sectionsGenerated: result.metadata?.sectionsGenerated,
         imagesGenerated: result.metadata?.imagesGenerated,
      });

      return createResponse(200, {
         success: true,
         data: result,
      });

   } catch (error) {
      console.error('[Generate Website] Error:', {
         error: error instanceof Error ? error.message : 'Unknown error',
         stack: error instanceof Error ? error.stack : undefined,
      });

      return createResponse(500, {
         error: 'Website generation failed',
         details: error instanceof Error ? error.message : 'Unknown error',
      });
   }
};