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
import { crossRegionBedrockClient } from "./bedrock";

export async function orchestrateSiteGeneration(
   input: UserInput,
   tenantId: string,
   storeId: string
): Promise<GeneratedAsset> {

   console.log(`[Cross-Region Orchestrator] Starting generation for ${input.businessName}...`);
   console.log(`[Architecture] AI: us-east-1 (Bedrock) + Storage: eu-north-1 (S3)`);

   const startTime = Date.now();

   try {
      // Step 1: Intelligence (Logic) - AI in us-east-1
      console.log(`[Step 1] Generating Spec using Bedrock (us-east-1)...`);
      const spec = await generateSpec(input);

      // Step 2: Coding (Structure) - AI in us-east-1
      console.log(`[Step 2] Generating Code using Bedrock (us-east-1)...`);
      const code = await generateCode(spec);

      // Step 3: Visuals (Creative) - AI in us-east-1, Storage in eu-north-1
      console.log(`[Step 3] Generating Images using Bedrock (us-east-1) -> S3 (eu-north-1)...`);
      const imageUrls = await generateImages(spec, tenantId, storeId);

      // Step 4: Assembly (Replacement) - Local processing
      console.log(`[Step 4] Assembling Assets...`);
      let finalHtml = code.html;

      // Replace placeholders {{IMAGE_URL_hero}} with actual S3 URLs
      for (const [sectionId, url] of Object.entries(imageUrls)) {
         finalHtml = finalHtml.replace(new RegExp(`{{IMAGE_URL_${sectionId}}}`, 'g'), url);
      }

      // Clean up any remaining placeholders
      finalHtml = finalHtml.replace(/{{IMAGE_URL_[a-zA-Z0-9_]+}}/g, "https://placehold.co/1200x600?text=Image");

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
      console.log(`[Success] Cross-region generation completed in ${generationTime}ms`);

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
            storeId
         }
      };

   } catch (error: any) {
      console.error(`[Error] Cross-region generation failed:`, error);
      throw new Error(`Website generation failed: ${error.message}`);
   }
}
