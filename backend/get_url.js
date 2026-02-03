const fs = require('fs');
const path = require('path');

try {
   const statePath = path.join(__dirname, '.serverless', 'serverless-state.json');
   if (!fs.existsSync(statePath)) {
      console.error('State file not found at:', statePath);
      process.exit(1);
   }

   const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));

   // Try to find CloudFormation outputs
   const outputs = state.service.provider.compiledCloudFormationTemplate.Outputs;

   if (outputs) {
      console.log(JSON.stringify(outputs, null, 2));
   } else {
      console.log('No Outputs found in state file.');
   }

} catch (error) {
   console.error('Error reading state:', error);
}
