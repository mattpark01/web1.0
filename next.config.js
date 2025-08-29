/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,

  // Proxy API requests to avoid CORS in development
  async rewrites() {
    // Only proxy in development
    if (process.env.NODE_ENV !== 'development') {
      return [];
    }

    // Check if we should use proxy (when no local agent runtime URL is set)
    const useProxy = !process.env.NEXT_PUBLIC_AGENT_RUNTIME_URL;
    
    if (!useProxy) {
      return [];
    }

    return [
      {
        source: '/api/agent-runtime/:path*',
        destination: 'https://agent-runtime-565753126849.us-east1.run.app/:path*',
      },
    ];
  },

  // Configure allowed domains for images, if needed
  images: {
    domains: ['agent-runtime-565753126849.us-east1.run.app'],
  },

  // Webpack configuration
  webpack: (config, { isServer }) => {
    // Fixes npm packages that depend on `fs` module
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },

  // Headers for security and CORS handling
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' }, // Configure appropriately
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;