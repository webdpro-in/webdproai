/**
 * Step 1: Spec Generator
 * Role: Intelligence (Logic)
 * Model: Claude 3 Sonnet (via Bedrock)
 */

import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { UserInput, SiteSpec } from "../schemas";

const client = new BedrockRuntimeClient({ region: process.env.AWS_REGION || "eu-north-1" });

export async function generateSpec(input: UserInput): Promise<SiteSpec> {
   const prompt = `
    You are an expert website architect. Create a detailed specialized website specification for:
    
    Business: ${input.businessName}
    Type: ${input.businessType}
    Location: ${input.location || 'Global'}
    Description: ${input.description || 'N/A'}
    
    Return a strictly valid JSON object adhering to this TypeScript interface:
    
    interface SiteSpec {
      meta: { title: string; description: string; keywords: string[]; theme_color: string; };
      navigation: { label: string; sectionId: string; }[];
      sections: {
        id: string;
        type: 'hero' | 'features' | 'products' | 'contact' | 'about';
        title: string;
        subtitle: string;
        content: any; // Key-value pairs of text content
        imagePrompt: string; // Detailed prompt for Stable Diffusion describing the image needed for this section
      }[];
    }
    
    Ensure the "imagePrompt" is highly descriptive, photorealistic, and matches the business theme.
    The output must be ONLY the JSON object. No markdown, no "Here is the JSON".
  `;

   try {
      const response = await client.send(new InvokeModelCommand({
         modelId: "anthropic.claude-3-sonnet-20240229-v1:0",
         contentType: "application/json",
         accept: "application/json",
         body: JSON.stringify({
            anthropic_version: "bedrock-2023-05-31",
            max_tokens: 4096,
            messages: [{ role: "user", content: prompt }]
         })
      }));

      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      const text = responseBody.content[0].text;

      // Extract JSON
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found in response");

      return JSON.parse(jsonMatch[0]);

   } catch (error) {
      console.warn("Spec generation failed, using fallback:", error);
      return getFallbackSpec(input);
   }
}

// Fallback logic for off-line or error cases
function getFallbackSpec(input: UserInput): SiteSpec {
   return {
      meta: {
         title: `${input.businessName} - Best ${input.businessType}`,
         description: `Welcome to ${input.businessName}`,
         keywords: [input.businessType, input.businessName],
         theme_color: "#4F46E5"
      },
      navigation: [
         { label: "Home", sectionId: "hero" },
         { label: "Services", sectionId: "features" },
         { label: "Contact", sectionId: "contact" }
      ],
      sections: [
         {
            id: "hero",
            type: "hero",
            title: `Welcome to ${input.businessName}`,
            subtitle: "We provide the best services in town.",
            content: { cta: "Get Started" },
            imagePrompt: "Professional office environment, modern, bright lighting"
         }
      ]
   };
}
