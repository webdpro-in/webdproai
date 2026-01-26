/**
 * Step 2: Code Generator
 * Role: Coding (Structure)
 * Model: Claude 3 Sonnet (via Bedrock)
 */

import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { SiteSpec } from "../schemas";

const client = new BedrockRuntimeClient({ region: process.env.AWS_REGION || "eu-north-1" });

export interface GeneratedCode {
   html: string;
   css: string;
}

export async function generateCode(spec: SiteSpec): Promise<GeneratedCode> {
   const sectionStructure = JSON.stringify(spec.sections, null, 2);

   const prompt = `
    You are a Senior Frontend Developer expert in Tailwind CSS and HTML5.
    
    Generate a single HTML file containing a modern, responsive website based on this specification:
    
    Theme Color: ${spec.meta.theme_color}
    Sections: ${sectionStructure}
    
    Requirements:
    1. Use Tailwind CSS via CDN (<script src="https://cdn.tailwindcss.com"></script>).
    2. Configure Tailwind colors to match the theme:
       <script>
         tailwind.config = { theme: { extend: { colors: { primary: '${spec.meta.theme_color}' } } } }
       </script>
    3. For images, use placeholders: '{{IMAGE_URL_SECTIONID}}' (e.g., {{IMAGE_URL_hero}}).
    4. Make it look premium, using glassmorphism, nice padding, and modern typography (Inter font).
    5. Return ONLY the full HTML code. No explaining.
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
      const html = responseBody.content[0].text;

      // Extract HTML if model wrapped it in backticks
      const htmlMatch = html.match(/<!DOCTYPE html>[\s\S]*<\/html>/) || html.match(/<html[\s\S]*<\/html>/);
      const cleanHtml = htmlMatch ? htmlMatch[0] : html;

      return {
         html: cleanHtml,
         css: "" // Inlining Tailwind via CDN, but could separate custom CSS here
      };

   } catch (error) {
      console.error("Code generation failed:", error);
      throw new Error("Failed to generate code from spec");
   }
}
