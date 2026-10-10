import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  // The bank is runtime data, explicitly packaged for each route that reads it.
  outputFileTracingIncludes: {
    "/api/item": ["./content/qbank.json"],
    "/api/grade": ["./content/qbank.json"],
    "/api/qbank": ["./content/qbank.json"],
    "/api/qbank/grade": ["./content/qbank.json"],
  },
  // The Cline SDK is a Node package: load it from node_modules instead of bundling it (its browser build lacks server exports).
  serverExternalPackages: ["@cline/sdk", "@cline/core", "@cline/agents", "@cline/llms", "@cline/shared"],
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
