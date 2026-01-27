/**
 * AI Services - Individual Pipeline Step Handlers
 * For testing and debugging individual steps
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { generateSpec as generateSpecPipeline } from '../pipeline/1_spec_generator';
import { generateCode as generateCodePipeline } from '../pipeline/2_code_generator';
import { generateImages as generateImagesPipeline } from '../pipeline/3_image_generator';
import { UserInput, SiteSpec } from '../schemas';

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
 * POST /ai/spec
 * Generate site specification only
 */
export const generateSpec = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
   try {
      const body = JSON.parse(event.body || '{}');
      const { input } = body;

      if (!input) {
         return response(400, { error: 'Missing input field' });
      }

      const userInput: UserInput = {
         businessName: input.businessName || 'My Business',
         businessType: input.businessType || 'general',
         location: input.location || 'India',
         description: input.description || '',
         language: input.language || 'en',
         themePreference: input.themePreference
      };

      const spec = await generateSpecPipeline(userInput);

      return response(200, {
         success: true,
         data: spec
      });

   } catch (error) {
      console.error('[AI Spec] Error:', error);
      return response(500, {
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
   try {
      const body = JSON.parse(event.body || '{}');
      const { spec } = body;

      if (!spec) {
         return response(400, { error: 'Missing spec field' });
      }

      const siteSpec: SiteSpec = spec;
      const code = await generateCodePipeline(siteSpec);

      return response(200, {
         success: true,
         data: code
      });

   } catch (error) {
      console.error('[AI Code] Error:', error);
      return response(500, {
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
   try {
      const body = JSON.parse(event.body || '{}');
      const { spec, tenantId, storeId } = body;

      if (!spec || !tenantId || !storeId) {
         return response(400, { error: 'Missing required fields: spec, tenantId, storeId' });
      }

      const siteSpec: SiteSpec = spec;
      const images = await generateImagesPipeline(siteSpec, tenantId, storeId);

      return response(200, {
         success: true,
         data: images
      });

   } catch (error) {
      console.error('[AI Images] Error:', error);
      return response(500, {
         error: 'Image generation failed',
         details: error instanceof Error ? error.message : 'Unknown error'
      });
   }
};