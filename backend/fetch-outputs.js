const { CloudFormationClient, DescribeStacksCommand } = require("@aws-sdk/client-cloudformation");

const client = new CloudFormationClient({ region: "eu-north-1" });

async function run() {
   try {
      const command = new DescribeStacksCommand({ StackName: "webdpro-backend-dev" });
      const response = await client.send(command);
      console.log(JSON.stringify(response.Stacks[0].Outputs, null, 2));
   } catch (err) {
      console.error(err);
   }
}

run();
