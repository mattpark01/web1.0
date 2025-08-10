import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-icons",
      "framer-motion",
      "recharts"
    ],
  },
  webpack: (config: any) => {
    // Ignore monaco editor warnings
    config.ignoreWarnings = [
      { module: /node_modules\/monaco-editor/ },
    ];
    
    return config;
  },
  transpilePackages: ['monaco-editor', '@monaco-editor/react'],
};

export default nextConfig;
