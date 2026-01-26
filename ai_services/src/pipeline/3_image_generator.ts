/**
 * Step 3: Image Generator
 * Role: Visuals (Creative)
 * Model: Amazon Titan Image Generator G1 (via Bedrock)
 */

import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { SiteSpec } from "../schemas";

const bedrock = new BedrockRuntimeClient({ region: process.env.AWS_REGION || "eu-north-1" });
const s3 = new S3Client({ region: process.env.AWS_REGION || "eu-north-1" });
const S3_BUCKET = process.env.S3_BUCKET || "webdpro-ai";

export async function generateImages(spec: SiteSpec, tenantId: string, storeId: string): Promise<Record<string, string>> {
   const imageUrls: Record<string, string> = {};

   // Identify sections needing images
   const sectionsWithImages = spec.sections.filter(s => s.imagePrompt);

   console.log(`Generating images for ${sectionsWithImages.length} sections...`);

   await Promise.all(sectionsWithImages.map(async (section) => {
      if (!section.imagePrompt) return;

      try {
         const prompt = `${section.imagePrompt}, high quality, photorealistic, 4k`;
         const base64Image = await invokeTitanImage(prompt);

         // Upload to S3
         const imageKey = `stores/${storeId}/images/${section.id}.png`;
         const buffer = Buffer.from(base64Image, 'base64');

         await s3.send(new PutObjectCommand({
            Bucket: S3_BUCKET,
            Key: imageKey,
            Body: buffer,
            ContentType: 'image/png'
         }));

         // Generate Public URL
         const url = `https://${S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${imageKey}`;
         imageUrls[section.id] = url;

      } catch (error) {
         console.error(`Failed to generate image for section ${section.id}:`, error);
         // Fallback to placeholder service or default asset
         imageUrls[section.id] = `https://placehold.co/1200x600?text=${encodeURIComponent(section.title || 'Image')}`;
      }
   }));

   return imageUrls;
}

async function invokeTitanImage(prompt: string): Promise<string> {
   // Amazon Titan Image Generator G1 payload
   const payload = {
      taskType: "TEXT_IMAGE",
      textToImageParams: {
         text: prompt
      },
      imageGenerationConfig: {
         numberOfImages: 1,
         quality: "standard",
         height: 768,
         width: 1280,
         cfgScale: 8.0,
         seed: Math.floor(Math.random() * 2147483647)
      }
   };

   try {
      const response = await bedrock.send(new InvokeModelCommand({
         modelId: "amazon.titan-image-generator-v1",
         contentType: "application/json",
         accept: "application/json",
         body: JSON.stringify(payload)
      }));

      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      return responseBody.images[0]; // Base64 string

   } catch (error) {
      // Retry or fallback logic could go here
      throw error;
   }
}
