/**
 * Free Tier Fallback AI Service Orchestrator
 * Works without Bedrock approval using templates and free services
 */

import { UserInput, GeneratedAsset } from "./schemas";

export async function orchestrateSiteGenerationFallback(
   input: UserInput,
   tenantId: string,
   storeId: string
): Promise<GeneratedAsset> {

   console.log(`[Fallback Orchestrator] Starting free tier generation for ${input.businessName}...`);
   console.log(`[Mode] Template-based generation (no Bedrock required)`);

   const startTime = Date.now();

   try {
      // Step 1: Generate spec using templates
      const spec = generateSpecFallback(input);

      // Step 2: Generate code using templates
      const code = generateCodeFallback(spec);

      // Step 3: Use placeholder images
      const imageUrls = generateImagesFallback(spec);

      // Step 4: Assembly
      let finalHtml = code.html;

      // Replace placeholders with free placeholder images
      for (const [sectionId, url] of Object.entries(imageUrls)) {
         finalHtml = finalHtml.replace(new RegExp(`{{IMAGE_URL_${sectionId}}}`, 'g'), url);
      }

      // Clean up any remaining placeholders
      finalHtml = finalHtml.replace(/{{IMAGE_URL_[a-zA-Z0-9_]+}}/g, "https://placehold.co/1200x600?text=Image");

      const generationTime = Date.now() - startTime;
      console.log(`[Success] Fallback generation completed in ${generationTime}ms`);

      return {
         html: finalHtml,
         css: code.css,
         images: imageUrls,
         config: spec,
         websiteUrl: `data:text/html;base64,${Buffer.from(finalHtml).toString('base64')}`,
         metadata: {
            generationTime,
            mode: 'fallback',
            tenantId,
            storeId,
            bedrockRegion: 'none',
            storageRegion: 'local'
         }
      };

   } catch (error) {
      console.error(`[Error] Fallback generation failed:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Website generation failed: ${errorMessage}`);
   }
}

function generateSpecFallback(input: UserInput): any {
   const businessType = input.businessType || 'general';
   const location = input.location || 'Local Area';
   
   return {
      meta: {
         title: input.businessName,
         description: input.description || `${input.businessName} - Your trusted ${businessType} store`,
         keywords: [businessType, location, 'online store'],
         theme_color: getColorsForBusiness(businessType).primary
      },
      navigation: [
         { label: 'Home', sectionId: 'hero' },
         { label: 'Products', sectionId: 'products' },
         { label: 'About', sectionId: 'about' },
         { label: 'Contact', sectionId: 'contact' }
      ],
      sections: [
         { 
            id: 'hero', 
            title: 'Welcome', 
            type: 'hero' as const,
            content: { businessName: input.businessName, location },
            imagePrompt: `Hero image for ${input.businessName}`
         },
         { 
            id: 'products', 
            title: 'Our Products', 
            type: 'products' as const,
            content: { description: 'Quality products for your needs' }
         },
         { 
            id: 'about', 
            title: 'About Us', 
            type: 'about' as const,
            content: { description: input.description || 'We are committed to quality' }
         },
         { 
            id: 'contact', 
            title: 'Contact', 
            type: 'contact' as const,
            content: { location }
         }
      ],
      businessName: input.businessName,
      businessType,
      location,
      theme: getThemeForBusiness(businessType),
      colors: getColorsForBusiness(businessType)
   };
}

function generateCodeFallback(spec: any) {
   const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${spec.businessName}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; line-height: 1.6; }
        .hero { background: ${spec.colors.primary}; color: white; padding: 4rem 2rem; text-align: center; }
        .hero h1 { font-size: 3rem; margin-bottom: 1rem; }
        .hero p { font-size: 1.2rem; margin-bottom: 2rem; }
        .section { padding: 3rem 2rem; max-width: 1200px; margin: 0 auto; }
        .products { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; }
        .product { border: 1px solid #ddd; padding: 1rem; border-radius: 8px; }
        .contact { background: #f4f4f4; }
        .btn { background: ${spec.colors.secondary}; color: white; padding: 1rem 2rem; border: none; border-radius: 5px; cursor: pointer; }
    </style>
</head>
<body>
    <section class="hero">
        <h1>${spec.businessName}</h1>
        <p>Your trusted ${spec.businessType} store in ${spec.location}</p>
        <img src="{{IMAGE_URL_hero}}" alt="Hero Image" style="max-width: 100%; height: 300px; object-fit: cover; border-radius: 10px; margin-top: 2rem;">
    </section>
    
    <section class="section">
        <h2>Our Products</h2>
        <div class="products">
            <div class="product">
                <img src="{{IMAGE_URL_product1}}" alt="Product 1" style="width: 100%; height: 200px; object-fit: cover;">
                <h3>Premium Quality</h3>
                <p>Fresh and high-quality products for your needs.</p>
            </div>
            <div class="product">
                <img src="{{IMAGE_URL_product2}}" alt="Product 2" style="width: 100%; height: 200px; object-fit: cover;">
                <h3>Best Prices</h3>
                <p>Competitive pricing with excellent value.</p>
            </div>
        </div>
    </section>
    
    <section class="section contact">
        <h2>Contact Us</h2>
        <p>Visit us in ${spec.location} or call us for orders!</p>
        <button class="btn">Order Now</button>
    </section>
</body>
</html>`;

   return {
      html,
      css: '', // CSS is inline for simplicity
      js: ''
   };
}

function generateImagesFallback(spec: any) {
   const businessType = spec.businessType;
   const colors = spec.colors.primary.replace('#', '');
   
   return {
      hero: `https://placehold.co/1200x400/${colors}/ffffff?text=${encodeURIComponent(spec.businessName)}`,
      product1: `https://placehold.co/400x300/4CAF50/ffffff?text=${encodeURIComponent(businessType + ' Product 1')}`,
      product2: `https://placehold.co/400x300/2196F3/ffffff?text=${encodeURIComponent(businessType + ' Product 2')}`
   };
}

function getThemeForBusiness(businessType: string): string {
   const themes: Record<string, string> = {
      grocery: 'fresh-green',
      restaurant: 'warm-orange',
      clothing: 'elegant-purple',
      electronics: 'tech-blue',
      default: 'modern-blue'
   };
   return themes[businessType] || themes.default;
}

function getColorsForBusiness(businessType: string): { primary: string; secondary: string } {
   const colorSchemes: Record<string, { primary: string; secondary: string }> = {
      grocery: { primary: '#4CAF50', secondary: '#8BC34A' },
      restaurant: { primary: '#FF5722', secondary: '#FF9800' },
      clothing: { primary: '#9C27B0', secondary: '#E91E63' },
      electronics: { primary: '#2196F3', secondary: '#03A9F4' },
      default: { primary: '#1976D2', secondary: '#42A5F5' }
   };
   return colorSchemes[businessType] || colorSchemes.default;
}