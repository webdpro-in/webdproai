const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
   output: "standalone",
   outputFileTracingRoot: path.join(__dirname),
   images: {
      domains: ['localhost'],
      remotePatterns: [
         {
            protocol: 'https',
            hostname: '**',
         },
      ],
   },
   experimental: {
      serverActions: {
         bodySizeLimit: '2mb',
      },
   },
   eslint: {
      ignoreDuringBuilds: true,
   },
   typescript: {
      ignoreBuildErrors: true,
   },
};

module.exports = nextConfig;
