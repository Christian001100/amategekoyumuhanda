import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  // Note: If hosting at https://<username>.github.io/<repo-name>/,
  // uncomment and set your repository name below:
  // basePath: "/<repo-name>",
};

export default nextConfig;
