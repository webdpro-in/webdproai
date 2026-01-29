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
   /** 'fallback' = template-only, fast, no Bedrock. Omit to try Bedrock then fallback. */
   mode?: 'fallback';
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

const AI_REQUEST_TIMEOUT_MS = 25_000;

export class AIServiceClient {
   private baseUrl: string;
   private maxRetries: number = 2;
   private retryDelay: number = 1000;

   constructor() {
      this.baseUrl = process.env.AI_SERVICE_URL || 'https://l0wi495th5.execute-api.eu-north-1.amazonaws.com/dev';
   }

   async generateWebsite(request: AIGenerationRequest): Promise<AIGenerationResponse> {
      const useFallback = request.mode === 'fallback';
      const payload = { ...request, mode: useFallback ? 'fallback' : undefined };
      let lastError: Error | null = null;

      for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
         const ac = new AbortController();
         const timeout = setTimeout(() => ac.abort(), AI_REQUEST_TIMEOUT_MS);

         try {
            console.log(
               `[AI Client] Attempt ${attempt}/${this.maxRetries} ` +
               `(${useFallback ? 'fallback' : 'bedrock+fallback'}): ${this.baseUrl}/ai/generate`
            );

            const response = await fetch(`${this.baseUrl}/ai/generate`, {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify(payload),
               signal: ac.signal,
            });

            clearTimeout(timeout);
            const responseText = await response.text();

            if (!response.ok) {
               throw new Error(`AI service returned ${response.status}: ${responseText.slice(0, 500)}`);
            }

            const result = JSON.parse(responseText);
            console.log('[AI Client] Generation successful');
            return result;
         } catch (error) {
            clearTimeout(timeout);
            lastError = error instanceof Error ? error : new Error('Unknown error');
            const isAbort = lastError.name === 'AbortError';
            console.error(`[AI Client] Attempt ${attempt} failed:`, isAbort ? 'timeout' : lastError.message);

            if (attempt < this.maxRetries) {
               const delay = this.retryDelay * attempt;
               console.log(`[AI Client] Retrying in ${delay}ms...`);
               await new Promise((r) => setTimeout(r, delay));
            }
         }
      }

      console.error('[AI Client] All retry attempts failed');
      return {
         success: false,
         error: lastError?.name === 'AbortError'
            ? 'AI service request timed out. Try again.'
            : 'AI generation failed after retries',
         details: lastError?.message || 'Unknown error',
      };
   }
}

export const aiClient = new AIServiceClient();