/**
 * WebDPro Inventory - AI Stock Predictions
 * Uses AWS Bedrock to predict low stock and suggest reorders
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'eu-north-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const bedrockClient = new BedrockRuntimeClient({ region: process.env.AWS_REGION || 'eu-north-1' });

const TABLE_NAME = `${process.env.DYNAMODB_TABLE_PREFIX}-products`;
const PREDICTIONS_TABLE = `${process.env.DYNAMODB_TABLE_PREFIX}-predictions`;

interface StockPrediction {
   product_id: string;
   store_id: string;
   predicted_days_until_stockout: number;
   recommended_reorder_quantity: number;
   confidence: number;
   reason: string;
}

/**
 * Scheduled function - runs every 5 minutes
 * Analyzes stock patterns and predicts low stock
 */
export const predictStock = async () => {
   console.log('Starting stock prediction scan...');

   try {
      // 1. Get all products with low or declining stock
      const result = await docClient.send(new ScanCommand({
         TableName: TABLE_NAME,
         FilterExpression: 'is_active = :active AND stock_quantity <= (low_stock_threshold * :multiplier)',
         ExpressionAttributeValues: {
            ':active': true,
            ':multiplier': 2, // Alert when stock is at 2x threshold
         },
      }));

      const products = result.Items || [];
      console.log(`Found ${products.length} products for prediction analysis`);

      if (products.length === 0) {
         return { message: 'No products require prediction' };
      }

      // 2. Group products by store for batch AI processing
      const storeProducts: Record<string, any[]> = {};
      for (const product of products) {
         const storeId = product.store_id;
         if (!storeProducts[storeId]) {
            storeProducts[storeId] = [];
         }
         storeProducts[storeId].push(product);
      }

      // 3. Generate predictions using Bedrock AI
      const predictions: StockPrediction[] = [];

      for (const [storeId, storeProds] of Object.entries(storeProducts)) {
         try {
            const prediction = await generatePredictionWithAI(storeId, storeProds);
            predictions.push(...prediction);
         } catch (error) {
            console.error(`AI prediction failed for store ${storeId}:`, error);
            // Fallback to rule-based prediction
            const fallbackPredictions = generateFallbackPredictions(storeId, storeProds);
            predictions.push(...fallbackPredictions);
         }
      }

      // 4. Save predictions and update alerts
      for (const prediction of predictions) {
         await savePrediction(prediction);
      }

      console.log(`Generated ${predictions.length} predictions`);
      return {
         success: true,
         predictions_count: predictions.length,
      };
   } catch (error) {
      console.error('Stock prediction failed:', error);
      return { error: 'Prediction scan failed' };
   }
};

/**
 * Use AWS Bedrock (Claude) to analyze stock patterns
 */
async function generatePredictionWithAI(storeId: string, products: any[]): Promise<StockPrediction[]> {
   const productSummary = products.map(p => ({
      id: p.product_id,
      name: p.name,
      stock: p.stock_quantity,
      threshold: p.low_stock_threshold,
      category: p.category,
   }));

   const prompt = `Analyze inventory data and predict reorder needs:

Products:
${JSON.stringify(productSummary, null, 2)}

For each product, provide:
1. Days until stockout (estimate based on typical patterns)
2. Recommended reorder quantity
3. Confidence level (0-1)
4. Brief reason

Return JSON array format:
[{"product_id": "...", "days_until_stockout": N, "reorder_qty": N, "confidence": 0.X, "reason": "..."}]`;

   const response = await bedrockClient.send(new InvokeModelCommand({
      modelId: 'anthropic.claude-3-haiku-20240307-v1:0',
      body: JSON.stringify({
         anthropic_version: 'bedrock-2023-05-31',
         max_tokens: 1024,
         messages: [{
            role: 'user',
            content: prompt,
         }],
      }),
   }));

   const responseBody = JSON.parse(new TextDecoder().decode(response.body));
   const content = responseBody.content[0].text;

   // Parse AI response
   const jsonMatch = content.match(/\[[\s\S]*\]/);
   if (!jsonMatch) {
      throw new Error('Invalid AI response format');
   }

   const aiPredictions = JSON.parse(jsonMatch[0]);

   return aiPredictions.map((p: any) => ({
      product_id: p.product_id,
      store_id: storeId,
      predicted_days_until_stockout: p.days_until_stockout,
      recommended_reorder_quantity: p.reorder_qty,
      confidence: p.confidence,
      reason: p.reason,
   }));
}

/**
 * Fallback: Rule-based prediction when AI is unavailable
 */
function generateFallbackPredictions(storeId: string, products: any[]): StockPrediction[] {
   return products.map(product => {
      const stock = product.stock_quantity;
      const threshold = product.low_stock_threshold;

      // Simple heuristic
      const daysUntilStockout = Math.max(1, Math.floor(stock / 3)); // Assume ~3 units sold per day
      const reorderQty = Math.max(threshold * 2, 20);

      let urgency = 'low';
      let confidence = 0.6;

      if (stock === 0) {
         urgency = 'critical';
         confidence = 1.0;
      } else if (stock <= threshold) {
         urgency = 'high';
         confidence = 0.8;
      }

      return {
         product_id: product.product_id,
         store_id: storeId,
         predicted_days_until_stockout: daysUntilStockout,
         recommended_reorder_quantity: reorderQty,
         confidence,
         reason: `Stock at ${stock} units (threshold: ${threshold}). Urgency: ${urgency}`,
      };
   });
}

/**
 * Save prediction to DynamoDB and flag product for alert
 */
async function savePrediction(prediction: StockPrediction): Promise<void> {
   // Save prediction
   await docClient.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { store_id: prediction.store_id, product_id: prediction.product_id },
      UpdateExpression: 'SET prediction = :pred, prediction_at = :time',
      ExpressionAttributeValues: {
         ':pred': {
            days_until_stockout: prediction.predicted_days_until_stockout,
            reorder_qty: prediction.recommended_reorder_quantity,
            confidence: prediction.confidence,
            reason: prediction.reason,
         },
         ':time': new Date().toISOString(),
      },
   }));
}
