import { BedrockRuntimeClient, InvokeModelCommand, InvokeModelWithResponseStreamCommand } from '@aws-sdk/client-bedrock-runtime';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

/**
 * Cross-Region Bedrock Client
 * AI Models: us-east-1 (N. Virginia)
 * Storage: eu-north-1 (Stockholm)
 */
export class CrossRegionBedrockClient {
  private bedrockClient: BedrockRuntimeClient;
  private s3Client: S3Client;
  
  // Configuration from environment variables
  private readonly config = {
    bedrock: {
      region: process.env.AWS_BEDROCK_REGION || 'us-east-1',
      models: {
        primary: process.env.AWS_BEDROCK_MODEL_PRIMARY || 'anthropic.claude-3-5-sonnet-20241022-v2:0',
        fallback1: process.env.AWS_BEDROCK_MODEL_FALLBACK_1 || 'anthropic.claude-3-haiku-20240307-v1:0',
        fallback2: process.env.AWS_BEDROCK_MODEL_FALLBACK_2 || 'amazon.titan-text-express-v1',
        image: process.env.AWS_BEDROCK_MODEL_IMAGE || 'amazon.titan-image-generator-v1',
        fallback3: process.env.AWS_BEDROCK_MODEL_FALLBACK_3 || 'meta.llama3-70b-instruct-v1:0'
      }
    },
    s3: {
      region: process.env.AWS_S3_REGION || 'eu-north-1',
      buckets: {
        storage: process.env.AWS_S3_BUCKET || 'webdpro-ai-storage',
        websites: process.env.AWS_S3_BUCKET_WEBSITES || 'webdpro-websites',
        assets: process.env.AWS_S3_BUCKET_ASSETS || 'webdpro-assets'
      }
    }
  };

  constructor() {
    // Bedrock client for AI operations in us-east-1
    this.bedrockClient = new BedrockRuntimeClient({
      region: this.config.bedrock.region,
      maxAttempts: 3,
      retryMode: 'adaptive'
    });

    // S3 client for storage operations in eu-north-1
    this.s3Client = new S3Client({
      region: this.config.s3.region,
      maxAttempts: 3,
      retryMode: 'adaptive'
    });

    console.log(`🌍 Cross-Region Setup: Bedrock (${this.config.bedrock.region}) + S3 (${this.config.s3.region})`);
  }

  /**
   * 5-Level AI Fallback System with Cross-Region Support
   */
  async generateWithFallback(prompt: string, options: GenerationOptions = {}): Promise<GenerationResult> {
    const fallbackChain = [
      { 
        name: 'claude-3.5-sonnet',
        modelId: this.config.bedrock.models.primary,
        cost: 0.003,
        timeout: 120000,
        quality: 'premium'
      },
      {
        name: 'claude-3-haiku',
        modelId: this.config.bedrock.models.fallback1,
        cost: 0.00025,
        timeout: 60000,
        quality: 'fast'
      },
      {
        name: 'amazon-titan-express',
        modelId: this.config.bedrock.models.fallback2,
        cost: 0.0008,
        timeout: 90000,
        quality: 'balanced'
      },
      {
        name: 'meta-llama3-70b',
        modelId: this.config.bedrock.models.fallback3,
        cost: 0.00195,
        timeout: 180000,
        quality: 'open-source'
      },
      {
        name: 'rule-based-template',
        modelId: 'internal-templates',
        cost: 0,
        timeout: 5000,
        quality: 'guaranteed'
      }
    ];

    const startTime = Date.now();
    let lastError: Error | null = null;

    for (let i = 0; i < fallbackChain.length; i++) {
      const level = fallbackChain[i];
      
      try {
        console.log(`🤖 Trying Level ${i + 1}: ${level.name} (${level.modelId})`);
        
        if (level.name === 'rule-based-template') {
          return await this.generateFromTemplate(prompt, options);
        }
        
        const result = await this.invokeBedrockModel(level.modelId, prompt, options, level.timeout);
        
        console.log(`✅ Success with Level ${i + 1}: ${level.name} (${Date.now() - startTime}ms)`);
        
        return {
          ...result,
          metadata: {
            levelUsed: i + 1,
            modelName: level.name,
            modelId: level.modelId,
            cost: level.cost,
            generationTime: Date.now() - startTime,
            region: this.config.bedrock.region
          }
        };
        
      } catch (error) {
        lastError = error as Error;
        console.log(`❌ Level ${i + 1} (${level.name}) failed: ${error.message}`);
        
        // If this is the last level, it should never fail (rule-based)
        if (i === fallbackChain.length - 1) {
          throw new Error(`All AI levels failed. Last error: ${error.message}`);
        }
        
        continue;
      }
    }

    throw lastError || new Error('All AI generation levels failed');
  }

  /**
   * Invoke Bedrock model in us-east-1
   */
  private async invokeBedrockModel(
    modelId: string, 
    prompt: string, 
    options: GenerationOptions,
    timeout: number
  ): Promise<GenerationResult> {
    
    const body = this.prepareModelInput(modelId, prompt, options);
    
    const command = new InvokeModelCommand({
      modelId,
      body: JSON.stringify(body),
      contentType: 'application/json',
      accept: 'application/json'
    });

    // Add timeout wrapper
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Model ${modelId} timeout after ${timeout}ms`)), timeout);
    });

    const response = await Promise.race([
      this.bedrockClient.send(command),
      timeoutPromise
    ]) as any;

    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    
    return this.parseModelResponse(modelId, responseBody);
  }

  /**
   * Prepare input for different model types
   */
  private prepareModelInput(modelId: string, prompt: string, options: GenerationOptions): any {
    if (modelId.includes('claude')) {
      return {
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: options.maxTokens || 4000,
        temperature: options.temperature || 0.7,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ]
      };
    }
    
    if (modelId.includes('titan')) {
      return {
        inputText: prompt,
        textGenerationConfig: {
          maxTokenCount: options.maxTokens || 4000,
          temperature: options.temperature || 0.7,
          topP: 0.9
        }
      };
    }
    
    if (modelId.includes('llama')) {
      return {
        prompt,
        max_gen_len: options.maxTokens || 4000,
        temperature: options.temperature || 0.7,
        top_p: 0.9
      };
    }

    // Default format
    return { prompt, max_tokens: options.maxTokens || 4000 };
  }

  /**
   * Parse response from different model types
   */
  private parseModelResponse(modelId: string, responseBody: any): GenerationResult {
    let content = '';
    
    if (modelId.includes('claude')) {
      content = responseBody.content?.[0]?.text || '';
    } else if (modelId.includes('titan')) {
      content = responseBody.results?.[0]?.outputText || '';
    } else if (modelId.includes('llama')) {
      content = responseBody.generation || '';
    } else {
      content = responseBody.text || responseBody.content || '';
    }

    return {
      content,
      usage: responseBody.usage || {},
      model: modelId
    };
  }

  /**
   * Rule-based template generation (never fails)
   */
  private async generateFromTemplate(prompt: string, options: GenerationOptions): Promise<GenerationResult> {
    console.log('🔧 Using rule-based template generation');
    
    // Simple template-based generation
    const businessType = this.detectBusinessType(prompt);
    const template = this.getTemplate(businessType);
    
    return {
      content: template,
      usage: { input_tokens: 0, output_tokens: template.length },
      model: 'rule-based-template',
      metadata: {
        levelUsed: 5,
        modelName: 'rule-based-template',
        modelId: 'internal-templates',
        cost: 0,
        generationTime: 100,
        region: 'local'
      }
    };
  }

  /**
   * Store generated content in S3 (eu-north-1)
   */
  async storeInS3(content: string, key: string, bucket?: string): Promise<string> {
    const targetBucket = bucket || this.config.s3.buckets.storage;
    
    const command = new PutObjectCommand({
      Bucket: targetBucket,
      Key: key,
      Body: content,
      ContentType: 'text/html',
      CacheControl: 'max-age=31536000' // 1 year cache
    });

    await this.s3Client.send(command);
    
    const url = `https://${targetBucket}.s3.${this.config.s3.region}.amazonaws.com/${key}`;
    console.log(`💾 Stored in S3 (${this.config.s3.region}): ${url}`);
    
    return url;
  }

  /**
   * Generate images using Bedrock in us-east-1, store in S3 eu-north-1
   */
  async generateImage(prompt: string, options: ImageGenerationOptions = {}): Promise<string> {
    const body = {
      taskType: "TEXT_IMAGE",
      textToImageParams: {
        text: prompt,
        negativeText: options.negativePrompt || "blurry, low quality, distorted",
      },
      imageGenerationConfig: {
        numberOfImages: 1,
        height: options.height || 1024,
        width: options.width || 1024,
        cfgScale: options.cfgScale || 8.0,
        seed: options.seed || Math.floor(Math.random() * 1000000)
      }
    };

    const command = new InvokeModelCommand({
      modelId: this.config.bedrock.models.image,
      body: JSON.stringify(body),
      contentType: 'application/json',
      accept: 'application/json'
    });

    const response = await this.bedrockClient.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    
    // Extract base64 image
    const base64Image = responseBody.images[0];
    const imageBuffer = Buffer.from(base64Image, 'base64');
    
    // Store in S3
    const imageKey = `images/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.png`;
    
    const putCommand = new PutObjectCommand({
      Bucket: this.config.s3.buckets.assets,
      Key: imageKey,
      Body: imageBuffer,
      ContentType: 'image/png',
      CacheControl: 'max-age=31536000'
    });

    await this.s3Client.send(putCommand);
    
    const imageUrl = `https://${this.config.s3.buckets.assets}.s3.${this.config.s3.region}.amazonaws.com/${imageKey}`;
    console.log(`🖼️ Image generated (${this.config.bedrock.region}) and stored (${this.config.s3.region}): ${imageUrl}`);
    
    return imageUrl;
  }

  private detectBusinessType(prompt: string): string {
    const lowerPrompt = prompt.toLowerCase();
    
    if (lowerPrompt.includes('vegetable') || lowerPrompt.includes('grocery') || lowerPrompt.includes('kirana')) {
      return 'grocery';
    }
    if (lowerPrompt.includes('restaurant') || lowerPrompt.includes('food') || lowerPrompt.includes('cafe')) {
      return 'restaurant';
    }
    if (lowerPrompt.includes('clinic') || lowerPrompt.includes('doctor') || lowerPrompt.includes('medical')) {
      return 'clinic';
    }
    if (lowerPrompt.includes('fashion') || lowerPrompt.includes('clothing') || lowerPrompt.includes('boutique')) {
      return 'fashion';
    }
    
    return 'general';
  }

  private getTemplate(businessType: string): string {
    const templates = {
      grocery: `<!DOCTYPE html>
<html><head><title>Fresh Vegetables Store</title></head>
<body><h1>Welcome to Our Fresh Vegetable Store</h1>
<p>Farm-fresh vegetables delivered to your door!</p></body></html>`,
      
      restaurant: `<!DOCTYPE html>
<html><head><title>Delicious Restaurant</title></head>
<body><h1>Welcome to Our Restaurant</h1>
<p>Authentic flavors, fresh ingredients!</p></body></html>`,
      
      clinic: `<!DOCTYPE html>
<html><head><title>Healthcare Clinic</title></head>
<body><h1>Professional Healthcare Services</h1>
<p>Your health is our priority.</p></body></html>`,
      
      fashion: `<!DOCTYPE html>
<html><head><title>Fashion Boutique</title></head>
<body><h1>Latest Fashion Trends</h1>
<p>Style that speaks to you.</p></body></html>`,
      
      general: `<!DOCTYPE html>
<html><head><title>Online Store</title></head>
<body><h1>Welcome to Our Store</h1>
<p>Quality products, great service!</p></body></html>`
    };

    return templates[businessType] || templates.general;
  }
}

// Type definitions
export interface GenerationOptions {
  maxTokens?: number;
  temperature?: number;
  sector?: string;
  language?: string;
}

export interface ImageGenerationOptions {
  width?: number;
  height?: number;
  cfgScale?: number;
  seed?: number;
  negativePrompt?: string;
}

export interface GenerationResult {
  content: string;
  usage: any;
  model: string;
  metadata?: {
    levelUsed: number;
    modelName: string;
    modelId: string;
    cost: number;
    generationTime: number;
    region: string;
  };
}

// Export singleton instance
export const crossRegionBedrockClient = new CrossRegionBedrockClient();

/**
 * Legacy/Client Export wrapper
 * Maintains backward compatibility while pointing to new Cross-Region Orchestrator
 */

import { orchestrateSiteGeneration } from "./orchestrator";
import { UserInput, GeneratedAsset } from "./schemas";

// Re-export specific pipeline functions if needed by specific handlers (unit testing)
export { generateSpec } from "./pipeline/1_spec_generator";
export { generateCode } from "./pipeline/2_code_generator";
export { generateImages } from "./pipeline/3_image_generator";

/**
 * Main Entry Point for Backend Handlers - Now with Cross-Region Support
 */
export async function generateFullWebsite(
   prompt: string,
   storeType: string = 'general',
   tenantId: string = 'demo', // Backwards compat default
   storeId: string = 'demo'
): Promise<GeneratedAsset> {

   // Parse legacy string prompt into UserInput structure
   // In a real scenario, the handler should pass the full object
   const input: UserInput = {
      businessName: extractBusinessName(prompt),
      businessType: storeType,
      description: prompt,
      location: "India", // Default context
      language: "en"
   };

   return orchestrateSiteGeneration(input, tenantId, storeId);
}

// Helper to guess business name from prompt if not provided explicitly
function extractBusinessName(prompt: string): string {
   const match = prompt.match(/for ([\w\s]+)/i);
   return match ? match[1] : "My Business";
}
