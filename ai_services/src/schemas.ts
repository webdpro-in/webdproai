/**
 * WebDPro AI Schemas
 * Definitions for the 4-Step Generation Pipeline
 */

export interface UserInput {
   businessName: string;
   businessType: string;
   location?: string;
   description?: string;
   language?: string; // 'en' | 'hi' | 'es' etc.
   themePreference?: string;
}

export interface SiteSpec {
   meta: {
      title: string;
      description: string;
      keywords: string[];
      theme_color: string;
   };
   navigation: {
      label: string;
      sectionId: string;
   }[];
   sections: SiteSection[];
}

export interface SiteSection {
   id: string;
   type: 'hero' | 'features' | 'products' | 'contact' | 'about' | 'gallery';
   title?: string;
   subtitle?: string;
   content: Record<string, any>; // Flexible content based on type
   imagePrompt?: string; // For Step 3
}

export interface GeneratedAsset {
   html: string;
   css: string;
   images: Record<string, string>; // prompt_id -> url
   config: SiteSpec;
   websiteUrl?: string;
   metadata?: {
      generationTime: number;
      bedrockRegion: string;
      storageRegion: string;
      tenantId: string;
      storeId: string;
   };
}
