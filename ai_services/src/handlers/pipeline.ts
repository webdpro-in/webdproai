/**
 * AI Services - Individual Pipeline Step Handlers
 * For testing and debugging individual steps
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { generateSpec as generateSpecPipeline } from '../pipeline/1_spec_generator';
import { generateCode as generateCodePipeline } from '../pipeline/2_code_generator';
import { generateImages as generateImagesPipeline } from '../pipeline/3_image_generator';
import { UserInput, SiteSpec } from '../schemas';

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
 * POST /ai/spec
 * Generate site specification only
 */
export const generateSpec = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
   // Handle OPTIONS preflight
   if (event.httpMethod === 'OPTIONS') {
      return handleOptions();
   }

   try {
      console.log('[Generate Spec] Request received');

      // Parse and validate request body
      let body: any;
      try {
         body = JSON.parse(event.body || '{}');
      } catch (parseError) {
         console.error('[Generate Spec] JSON parse error:', parseError);
         return createResponse(400, {
            error: 'Invalid JSON in request body',
         });
      }

      const { input } = body;

      if (!input) {
         return createResponse(400, { error: 'Missing required field: input' });
      }

      const userInput: UserInput = {
         businessName: input.businessName || 'My Business',
         businessType: input.businessType || 'general',
         location: input.location || 'India',
         description: input.description || '',
         language: input.language || 'en',
         themePreference: input.themePreference
      };

      console.log('[Generate Spec] Processing:', userInput.businessName);

      const spec = await generateSpecPipeline(userInput);

      console.log('[Generate Spec] Generation successful');

      return createResponse(200, {
         success: true,
         data: spec
      });

   } catch (error) {
      console.error('[Generate Spec] Error:', {
         error: error instanceof Error ? error.message : 'Unknown error',
         stack: error instanceof Error ? error.stack : undefined,
      });
      return createResponse(500, {
         error: 'Spec generation failed',
         details: error instanceof Error ? error.message : 'Unknown error'
      });
   }
};

/**
 * POST /ai/code
 * Generate HTML/CSS from specification
 */
export const generateCode = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
   // Handle OPTIONS preflight
   if (event.httpMethod === 'OPTIONS') {
      return handleOptions();
   }

   try {
      console.log('[Generate Code] Request received');

      // Parse and validate request body
      let body: any;
      try {
         body = JSON.parse(event.body || '{}');
      } catch (parseError) {
         console.error('[Generate Code] JSON parse error:', parseError);
         return createResponse(400, {
            error: 'Invalid JSON in request body',
         });
      }

      const { spec } = body;

      if (!spec) {
         return createResponse(400, { error: 'Missing required field: spec' });
      }

      console.log('[Generate Code] Processing code generation');

      const siteSpec: SiteSpec = spec;
      const code = await generateCodePipeline(siteSpec);

      console.log('[Generate Code] Generation successful');

      return createResponse(200, {
         success: true,
         data: code
      });

   } catch (error) {
      console.error('[Generate Code] Error:', {
         error: error instanceof Error ? error.message : 'Unknown error',
         stack: error instanceof Error ? error.stack : undefined,
      });
      return createResponse(500, {
         error: 'Code generation failed',
         details: error instanceof Error ? error.message : 'Unknown error'
      });
   }
};

/**
 * POST /ai/images
 * Generate images from specification
 */
export const generateImages = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
   // Handle OPTIONS preflight
   if (event.httpMethod === 'OPTIONS') {
      return handleOptions();
   }

   try {
      console.log('[Generate Images] Request received');

      // Parse and validate request body
      let body: any;
      try {
         body = JSON.parse(event.body || '{}');
      } catch (parseError) {
         console.error('[Generate Images] JSON parse error:', parseError);
         return createResponse(400, {
            error: 'Invalid JSON in request body',
         });
      }

      const { spec, tenantId, storeId } = body;

      if (!spec || !tenantId || !storeId) {
         return createResponse(400, { 
            error: 'Missing required fields: spec, tenantId, storeId' 
         });
      }

      console.log('[Generate Images] Processing image generation', {
         tenantId,
         storeId,
      });

      const siteSpec: SiteSpec = spec;
      const images = await generateImagesPipeline(siteSpec, tenantId, storeId);

      console.log('[Generate Images] Generation successful');

      return createResponse(200, {
         success: true,
         data: images
      });

   } catch (error) {
      console.error('[Generate Images] Error:', {
         error: error instanceof Error ? error.message : 'Unknown error',
         stack: error instanceof Error ? error.stack : undefined,
      });
      return createResponse(500, {
         error: 'Image generation failed',
         details: error instanceof Error ? error.message : 'Unknown error'
      });
   }
};