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
   private maxRetries: number = 3;
   private retryDelay: number = 1000;

   constructor() {
      // Use the deployed AI service URL
      this.baseUrl = process.env.AI_SERVICE_URL || 'https://l0wi495th5.execute-api.eu-north-1.amazonaws.com/dev';
   }

   async generateWebsite(request: AIGenerationRequest): Promise<AIGenerationResponse> {
      let lastError: Error | null = null;

      for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
         try {
            console.log(
               `[AI Client] Attempt ${attempt}/${this.maxRetries}: ` +
               `Calling ${this.baseUrl}/ai/generate`
            );

            const response = await fetch(`${this.baseUrl}/ai/generate`, {
               method: 'POST',
               headers: {
                  'Content-Type': 'application/json',
               },
               body: JSON.stringify(request),
            });

            const responseText = await response.text();

            if (!response.ok) {
               throw new Error(
                  `AI service returned ${response.status}: ${responseText}`
               );
            }

            const result = JSON.parse(responseText);
            console.log('[AI Client] Generation successful');
            return result;

         } catch (error) {
            lastError = error instanceof Error ? error : new Error('Unknown error');
            console.error(
               `[AI Client] Attempt ${attempt} failed:`,
               lastError.message
            );

            if (attempt < this.maxRetries) {
               const delay = this.retryDelay * attempt;
               console.log(`[AI Client] Retrying in ${delay}ms...`);
               await new Promise(resolve => setTimeout(resolve, delay));
            }
         }
      }

      console.error('[AI Client] All retry attempts failed');
      return {
         success: false,
         error: 'AI generation failed after retries',
         details: lastError?.message || 'Unknown error',
      };
   }
}

export const aiClient = new AIServiceClient();