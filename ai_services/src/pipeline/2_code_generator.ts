/**
 * Step 2: Code Generator
 * Role: Coding (Structure)
 * Model: Claude 3 Sonnet (via Bedrock)
 */

import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { SiteSpec } from "../schemas";

const client = new BedrockRuntimeClient({ region: process.env.AWS_BEDROCK_REGION || "us-east-1" });

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
    5. Include proper meta tags, viewport settings, and semantic HTML5 elements.
    6. Ensure all HTML is valid and properly closed.
    7. IMPORTANT: For every section, you MUST add a 'data-section-id' attribute matching the section ID from the JSON (e.g., <section data-section-id="hero">).
    8. Return ONLY the full HTML code. No explaining.
  `;

   try {
      const response = await client.send(new InvokeModelCommand({
         modelId: process.env.AWS_BEDROCK_MODEL_PRIMARY || "anthropic.claude-3-5-sonnet-20241022-v2:0",
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

      // Extract HTML if model wrapped it in backticks or code blocks
      let cleanHtml = html;

      // Remove markdown code blocks
      cleanHtml = cleanHtml.replace(/```html\n?/g, '').replace(/```\n?/g, '');

      // Extract HTML document
      const htmlMatch = cleanHtml.match(/<!DOCTYPE html>[\s\S]*<\/html>/) || cleanHtml.match(/<html[\s\S]*<\/html>/);
      if (htmlMatch) {
         cleanHtml = htmlMatch[0];
      }

      // Validate HTML structure
      if (!cleanHtml.includes('<!DOCTYPE html>')) {
         console.warn('Missing DOCTYPE, adding...');
         cleanHtml = '<!DOCTYPE html>\n' + cleanHtml;
      }

      if (!cleanHtml.includes('</html>')) {
         throw new Error('Invalid HTML: missing closing </html> tag');
      }

      // Basic security: ensure no script tags with external sources (except Tailwind CDN)
      const scriptMatches = cleanHtml.match(/<script[^>]*src=["']([^"']+)["'][^>]*>/g);
      if (scriptMatches) {
         for (const script of scriptMatches) {
            if (!script.includes('cdn.tailwindcss.com') && !script.includes('tailwind.config')) {
               console.warn('Removing potentially unsafe external script:', script);
               cleanHtml = cleanHtml.replace(script, '');
            }
         }
      }

      // Validate required elements
      const requiredElements = ['<head>', '<body>', '<title>'];
      for (const element of requiredElements) {
         if (!cleanHtml.includes(element)) {
            console.warn(`Missing required element: ${element}`);
         }
      }

      console.log('✓ HTML validation passed');
      console.log(`  - Size: ${cleanHtml.length} bytes`);
      console.log(`  - Image placeholders: ${(cleanHtml.match(/{{IMAGE_URL_[a-zA-Z0-9_]+}}/g) || []).length}`);

      return {
         html: cleanHtml,
         css: "" // Inlining Tailwind via CDN, but could separate custom CSS here
      };

   } catch (error) {
      console.error("Code generation failed:", error);

      // Fallback: Generate basic HTML template
      console.log("Using fallback HTML template...");
      return {
         html: generateFallbackHTML(spec),
         css: ""
      };
   }
}

// Fallback HTML generator
function generateFallbackHTML(spec: SiteSpec): string {
   return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${spec.meta.title}</title>
    <meta name="description" content="${spec.meta.description}">
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        primary: '${spec.meta.theme_color}'
                    }
                }
            }
        }
    </script>
</head>
<body class="bg-gray-50">
    <header class="bg-white shadow">
        <nav class="container mx-auto px-6 py-4">
            <h1 class="text-2xl font-bold text-gray-800">${spec.meta.title}</h1>
        </nav>
    </header>
    
    <main class="container mx-auto px-6 py-12">
        ${spec.sections.map(section => `
        <section id="${section.id}" class="mb-16">
            <h2 class="text-3xl font-bold mb-4">${section.title}</h2>
            <p class="text-gray-600 mb-6">${section.subtitle}</p>
            ${section.imagePrompt ? `<img src="{{IMAGE_URL_${section.id}}}" alt="${section.title}" class="w-full rounded-lg shadow-lg">` : ''}
        </section>
        `).join('\n')}
    </main>
    
    <footer class="bg-gray-800 text-white py-8 mt-16">
        <div class="container mx-auto px-6 text-center">
            <p>&copy; ${new Date().getFullYear()} ${spec.meta.title}. All rights reserved.</p>
        </div>
    </footer>
</body>
</html>`;
}
