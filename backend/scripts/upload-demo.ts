import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import * as fs from "fs";
import * as path from "path";

const s3 = new S3Client({ region: process.env.AWS_REGION || "eu-north-1" });
const BUCKET = "webdpro-ai-storage-dev"; // Hardcoded for dev as per env
const DEMO_PATH = "demo-sites/default-store";

const filesToUpload = [
   { name: "index.html", path: "../../demo_template/index.html", type: "text/html" },
];

async function upload() {
   console.log("Uploading demo template...");
   for (const file of filesToUpload) {
      const filePath = path.resolve(__dirname, file.path);
      if (!fs.existsSync(filePath)) {
         console.error(`File not found: ${filePath}`);
         continue;
      }
      const content = fs.readFileSync(filePath);
      const key = `${DEMO_PATH}/${file.name}`;
      await s3.send(new PutObjectCommand({
         Bucket: BUCKET,
         Key: key,
         Body: content,
         ContentType: file.type
      }));
      console.log(`Uploaded ${key}`);
   }
   console.log("Done.");
}

upload();
