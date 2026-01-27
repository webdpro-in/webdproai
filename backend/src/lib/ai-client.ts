/**
 * AI Service Client
 * HTTP client for calling AI generation service
 */

interface AIGenerationRequest {
   input: {
      businessName: string;
      businessType: string;
      location?: string;
      description?: string;
      language?: string;
      themePreference?: string;
   };
   tenantId: string;
   storeId: string;
}

interface AIGenerationResponse {
   success: boolean;
   data?: {
      html: string;
      css: string;
      images: Record<string, string>;
      config: any;
   };
   error?: string;
   details?: string;
}

export class AIServiceClient {
   private baseUrl: string;

   constructor() {
      // Use the deployed AI service URL
      this.baseUrl = process.env.AI_SERVICE_URL || 'https://l0wi495th5.execute-api.eu-north-1.amazonaws.com/dev';
   }

   async generateWebsite(request: AIGenerationRequest): Promise<AIGenerationResponse> {
      try {
         console.log(`[AI Client] Calling ${this.baseUrl}/ai/generate`);
         
         const response = await fetch(`${this.baseUrl}/ai/generate`, {
            method: 'POST',
            headers: {
               'Content-Type': 'application/json',
            },
            body: JSON.stringify(request),
         });

         if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`AI service returned ${response.status}: ${errorText}`);
         }

         const result = await response.json();
         console.log('[AI Client] Generation successful');
         return result;

      } catch (error) {
         console.error('AI service call failed:', error);
         return {
            success: false,
            error: 'AI generation failed',
            details: error instanceof Error ? error.message : 'Unknown error'
         };
      }
   }
}

export const aiClient = new AIServiceClient();