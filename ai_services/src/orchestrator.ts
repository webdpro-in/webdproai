/**
 * Cross-Region AI Service Orchestrator
 * Coordinates the 4-Step Pipeline: Spec -> Code -> Images -> Assembly
 * AI Processing: us-east-1 (Bedrock)
 * Storage: eu-north-1 (S3)
 */

import { UserInput, GeneratedAsset } from "./schemas";
import { generateSpec } from "./pipeline/1_spec_generator";
import { generateCode } from "./pipeline/2_code_generator";
import { generateImages } from "./pipeline/3_image_generator";
import { publishWebsite } from "./pipeline/4_website_generator";

export async function orchestrateSiteGeneration(
   input: UserInput,
   tenantId: string,
   storeId: string
): Promise<GeneratedAsset> {

   console.log(`[Cross-Region Orchestrator] Starting generation for ${input.businessName}...`);
   console.log(`[Architecture] AI: us-east-1 (Bedrock) + Storage: eu-north-1 (S3)`);

   const startTime = Date.now();
   let spec, code, finalHtml;
   let imageUrls: Record<string, string> = {};

   try {
      // Step 1: Intelligence (Logic) - AI in us-east-1 with retry
      console.log(`[Step 1] Generating Spec using Bedrock (us-east-1)...`);
      try {
         spec = await generateSpec(input);
         console.log(`[Step 1] ✓ Spec generated successfully`);
      } catch (error) {
         console.error(`[Step 1] ✗ Spec generation failed, using fallback:`, error);
         // Fallback is handled inside generateSpec
         spec = await generateSpec(input);
      }

      // Validate spec
      if (!spec || !spec.sections || spec.sections.length === 0) {
         throw new Error('Invalid spec generated - no sections found');
      }

      // Step 2: Coding (Structure) - AI in us-east-1 with validation
      console.log(`[Step 2] Generating Code using Bedrock (us-east-1)...`);
      try {
         code = await generateCode(spec);
         console.log(`[Step 2] ✓ Code generated successfully`);
         
         // Validate HTML
         if (!code.html || !code.html.includes('<!DOCTYPE html>')) {
            throw new Error('Invalid HTML generated');
         }
      } catch (error) {
         console.error(`[Step 2] ✗ Code generation failed:`, error);
         throw new Error(`Code generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // Step 3: Visuals (Creative) - AI in us-east-1, Storage in eu-north-1
      console.log(`[Step 3] Generating Images using Bedrock (us-east-1) -> S3 (eu-north-1)...`);
      try {
         imageUrls = await generateImages(spec, tenantId, storeId);
         console.log(`[Step 3] ✓ Generated ${Object.keys(imageUrls).length} images`);
      } catch (error) {
         console.error(`[Step 3] ⚠ Image generation failed, using placeholders:`, error);
         // Use placeholders for all sections
         imageUrls = {};
         spec.sections.forEach(section => {
            if (section.imagePrompt) {
               imageUrls[section.id] = `https://placehold.co/1200x600?text=${encodeURIComponent(section.title || 'Image')}`;
            }
         });
      }

      // Step 4: Assembly (Replacement) - Local processing with validation
      console.log(`[Step 4] Assembling Assets...`);
      finalHtml = code.html;

      // Replace placeholders {{IMAGE_URL_hero}} with actual S3 URLs
      let replacementCount = 0;
      for (const [sectionId, url] of Object.entries(imageUrls)) {
         const regex = new RegExp(`{{IMAGE_URL_${sectionId}}}`, 'g');
         const matches = finalHtml.match(regex);
         if (matches) {
            finalHtml = finalHtml.replace(regex, url);
            replacementCount += matches.length;
         }
      }
      console.log(`[Step 4] ✓ Replaced ${replacementCount} image placeholders`);

      // Clean up any remaining placeholders
      const remainingPlaceholders = finalHtml.match(/{{IMAGE_URL_[a-zA-Z0-9_]+}}/g);
      if (remainingPlaceholders) {
         console.log(`[Step 4] ⚠ Cleaning up ${remainingPlaceholders.length} remaining placeholders`);
         finalHtml = finalHtml.replace(/{{IMAGE_URL_[a-zA-Z0-9_]+}}/g, "https://placehold.co/1200x600?text=Image");
      }

      // Validate final HTML
      if (!finalHtml.includes('<!DOCTYPE html>') || !finalHtml.includes('</html>')) {
         throw new Error('Final HTML validation failed - incomplete document');
      }

      // Step 5: Store final website in S3 (eu-north-1) & Update Registry
      console.log(`[Step 5] Publishing website & Updating Registry...`);
      const publishResult = await publishWebsite(
         spec,
         { html: finalHtml, images: imageUrls },
         tenantId,
         storeId
      );

      const websiteUrl = publishResult.url;
      const generationTime = Date.now() - startTime;
      
      console.log(`[Success] ✓ Cross-region generation completed in ${(generationTime / 1000).toFixed(2)}s`);
      console.log(`[Success] ✓ Website URL: ${websiteUrl}`);

      return {
         html: finalHtml,
         css: code.css,
         images: imageUrls,
         config: spec,
         websiteUrl,
         metadata: {
            generationTime,
            bedrockRegion: 'us-east-1',
            storageRegion: 'eu-north-1',
            tenantId,
            storeId,
            sectionsGenerated: spec?.sections?.length || 0,
            imagesGenerated: Object.keys(imageUrls).length,
            htmlSize: finalHtml.length
         }
      };

   } catch (error: any) {
      const generationTime = Date.now() - startTime;
      console.error(`[Error] ✗ Cross-region generation failed after ${(generationTime / 1000).toFixed(2)}s:`, error);
      
      // Log detailed error information
      console.error(`[Error Details]`, {
         step: spec ? (code ? (imageUrls ? 'publishing' : 'images') : 'code') : 'spec',
         tenantId,
         storeId,
         businessName: input.businessName,
         error: error.message,
         stack: error.stack
      });
      
      throw new Error(`Website generation failed: ${error.message}`);
   }
}
