const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const BUCKET_NAME = 'webdpro-ai';
const PREFIX = 'webdproAI/';
const ROOT_DIR = path.resolve(__dirname, '..');
const REGION = 'eu-north-1';

console.log(`Initializing S3 Client in region ${REGION}...`);
const s3Client = new S3Client({ region: REGION });

const EXCLUDED_DIRS = [
   'node_modules',
   'docs',
   '.git',
   '.serverless',
   '.next',
   'dist',
   'coverage',
   '.gemini',
   '.agent'
];
const EXCLUDED_EXTENSIONS = ['.md'];
const INCLUDED_FILES = ['README.md', 'Link.txt']; // Link.txt often useful, keeping it just in case, but adhering to user rule primarily.

// User rule: "without other md files except 1 readme.md"
// User rule: "dont push the docs folder also node_modules folder"

async function uploadFile(filePath, key) {
   try {
      const fileContent = fs.readFileSync(filePath);
      const command = new PutObjectCommand({
         Bucket: BUCKET_NAME,
         Key: key,
         Body: fileContent
      });
      await s3Client.send(command);
      console.log(`[OK] Uploaded: ${key}`);
   } catch (err) {
      console.error(`[ERR] Failed to upload ${key}:`, err.message);
   }
}

async function walkAndUpload(dir, relativeDir = '') {
   let files;
   try {
      files = fs.readdirSync(dir);
   } catch (e) {
      console.error(`Could not read dir ${dir}: ${e.message}`);
      return;
   }

   for (const file of files) {
      const fullPath = path.join(dir, file);
      let stat;
      try {
         stat = fs.statSync(fullPath);
      } catch (e) {
         continue;
      }

      // Fix path separators for S3
      const relativePath = path.join(relativeDir, file).replace(/\\/g, '/');

      if (stat.isDirectory()) {
         if (EXCLUDED_DIRS.includes(file)) continue;
         // Also invoke strict check for node_modules in any depth?
         // "dont push the docs folder also node_modules folder as well"
         // Usually implies root docs and any node_modules.
         if (file === 'node_modules') continue;
         if (file === 'docs') continue;

         await walkAndUpload(fullPath, relativePath);
      } else {
         const ext = path.extname(file).toLowerCase();
         const fileName = path.basename(file); // Case sensitive check or not? README.md

         // Check exclusions
         if (fileName.toLowerCase() === 'readme.md') {
            // Include
         } else if (EXCLUDED_EXTENSIONS.includes(ext)) {
            // Exclude other *.md
            continue;
         }

         // Upload
         await uploadFile(fullPath, PREFIX + relativePath);
      }
   }
}

console.log(`Starting upload from ${ROOT_DIR} to s3://${BUCKET_NAME}/${PREFIX}`);
walkAndUpload(ROOT_DIR)
   .then(() => console.log('Upload complete.'))
   .catch(err => console.error('Upload failed:', err));
