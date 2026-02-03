const { exec } = require('child_process');
const fs = require('fs');

const stacks = [
   'webdpro-ai-services-dev',
   'webdpro-inventory-dev',
   'webdpro-payments-dev'
];

async function getStackOutputs(stackName) {
   return new Promise((resolve) => {
      exec(`aws cloudformation describe-stacks --stack-name ${stackName} --region eu-north-1`, (error, stdout, stderr) => {
         if (error) {
            // console.error(`Error describing stack ${stackName}: ${stderr}`);
            resolve(null);
            return;
         }
         try {
            const data = JSON.parse(stdout);
            if (data.Stacks && data.Stacks[0] && data.Stacks[0].Outputs) {
               resolve(data.Stacks[0].Outputs);
            } else {
               resolve([]);
            }
         } catch (e) {
            resolve(null);
         }
      });
   });
}

async function run() {
   const results = {};
   for (const stack of stacks) {
      const outputs = await getStackOutputs(stack);
      if (outputs) {
         const endpoint = outputs.find(o => o.OutputKey === 'HttpApiUrl' || o.OutputKey === 'ServiceEndpoint');
         if (endpoint) {
            results[stack] = endpoint.OutputValue;
         }
         // Also look for CloudFront domain or other useful info
         const cf = outputs.find(o => o.OutputKey === 'CloudFrontDomain');
         if (cf) results[stack + '-cf'] = cf.OutputValue;
      }
   }
   console.log(JSON.stringify(results, null, 2));
}

run();
