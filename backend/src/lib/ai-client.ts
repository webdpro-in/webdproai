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
      // In production, this would be the AI service API Gateway URL
      // For now, we'll use direct function calls as fallback
      this.baseUrl = process.env.AI_SERVICE_URL || 'http://localhost:3002';
   }

   async generateWebsite(request: AIGenerationRequest): Promise<AIGenerationResponse> {
      try {
         // Try HTTP call first
         if (this.baseUrl !== 'http://localhost:3002') {
            const response = await fetch(`${this.baseUrl}/ai/generate`, {
               method: 'POST',
               headers: {
                  'Content-Type': 'application/json',
               },
               body: JSON.stringify(request),
            });

            if (!response.ok) {
               throw new Error(`AI service returned ${response.status}`);
            }

            return await response.json();
         }

         // Fallback to direct import (for development)
         const { orchestrateSiteGeneration } = await import('../../ai_services/src/orchestrator');
         
         const result = await orchestrateSiteGeneration(
            request.input,
            request.tenantId,
            request.storeId
         );

         return {
            success: true,
            data: result
         };

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