/**
 * AI Services - Main Generation Handler
 * Exposes the orchestrator as a Lambda function
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { orchestrateSiteGeneration } from '../orchestrator';
import { orchestrateSiteGenerationFallback } from '../fallback-orchestrator';
import { UserInput } from '../schemas';

// Helper: Create response
const response = (statusCode: number, body: any): APIGatewayProxyResult => ({
   statusCode,
   headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
   },
   body: JSON.stringify(body),
});

/**
 * POST /ai/generate
 * Generate complete website from user input
 */
export const generateWebsite = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
   try {
      console.log('[AI Generate] Starting website generation...');
      
      const body = JSON.parse(event.body || '{}');
      const { input, tenantId, storeId } = body;

      if (!input || !tenantId || !storeId) {
         return response(400, { 
            error: 'Missing required fields: input, tenantId, storeId' 
         });
      }

      // Validate input structure
      const userInput: UserInput = {
         businessName: input.businessName || 'My Business',
         businessType: input.businessType || 'general',
         location: input.location || 'India',
         description: input.description || input.prompt || '',
         language: input.language || 'en',
         themePreference: input.themePreference
      };

      console.log(`[AI Generate] Processing: ${userInput.businessName} (${userInput.businessType})`);

      // Try Bedrock first, fallback to template-based generation
      let result;
      try {
         console.log('[AI Generate] Attempting Bedrock generation...');
         result = await orchestrateSiteGeneration(userInput, tenantId, storeId);
      } catch (bedrockError) {
         console.log('[AI Generate] Bedrock failed, using fallback generation...');
         console.log('[Fallback Reason]', bedrockError.message);
         result = await orchestrateSiteGenerationFallback(userInput, tenantId, storeId);
      }

      console.log('[AI Generate] Generation completed successfully');

      return response(200, {
         success: true,
         data: result
      });

   } catch (error) {
      console.error('[AI Generate] Error:', error);
      
      return response(500, {
         error: 'Website generation failed',
         details: error instanceof Error ? error.message : 'Unknown error'
      });
   }
};