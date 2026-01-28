/**
 * Local Test Script for Website Generation
 * Tests the fallback orchestrator without AWS deployment
 */

const { orchestrateSiteGenerationFallback } = require('./ai_services/dist/fallback-orchestrator');

async function testGeneration() {
   console.log('🧪 Testing Website Generation (Fallback Mode)...\n');

   const input = {
      businessName: 'Fresh Veggies Mumbai',
      businessType: 'grocery',
      location: 'Mumbai, India',
      description: 'Organic vegetables delivered fresh to your door',
      language: 'en'
   };

   const tenantId = 'test-tenant-123';
   const storeId = 'test-store-456';

   try {
      console.log('📝 Input:', JSON.stringify(input, null, 2));
      console.log('\n⏳ Generating website...\n');

      const result = await orchestrateSiteGenerationFallback(input, tenantId, storeId);

      console.log('✅ Generation Successful!\n');
      console.log('📊 Metadata:', JSON.stringify(result.metadata, null, 2));
      console.log('\n📄 HTML Length:', result.html.length, 'characters');
      console.log('🎨 CSS Length:', result.css.length, 'characters');
      console.log('🖼️  Images:', Object.keys(result.images).length);
      console.log('\n🔗 Image URLs:');
      Object.entries(result.images).forEach(([key, url]) => {
         console.log(`   ${key}: ${url}`);
      });

      console.log('\n💾 Saving HTML to test-output.html...');
      const fs = require('fs');
      fs.writeFileSync('test-output.html', result.html);
      console.log('✅ Saved! Open test-output.html in your browser to see the result.\n');

      return result;
   } catch (error) {
      console.error('❌ Generation Failed:', error.message);
      console.error(error.stack);
      process.exit(1);
   }
}

// Run test
testGeneration()
   .then(() => {
      console.log('🎉 Test completed successfully!');
      process.exit(0);
   })
   .catch((error) => {
      console.error('💥 Test failed:', error);
      process.exit(1);
   });
