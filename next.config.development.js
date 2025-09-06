/** @type {import('next').NextConfig} */
const nextConfig = {
  // Development-specific configuration
  compress: false, // Disable compression in development for faster builds
  poweredByHeader: false,
  generateEtags: false,
  output: 'standalone',
  trailingSlash: false,
  
  // Development performance optimizations
  reactStrictMode: true,
  swcMinify: false, // Disable minification in development
  
  // Image optimization (development-friendly)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 0, // No caching in development
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  // Minimal security headers for development
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'X-Development-Mode',
          value: 'true',
        },
      ],
    },
  ],
  
  // TypeScript and ESLint configuration
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  
  // Environment variables
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
    NODE_ENV: 'development',
  },
  
  // Development webpack configuration
  webpack: (config, { dev, isServer }) => {
    // Enable source maps in development
    if (dev) {
      config.devtool = 'eval-source-map';
    }
    
    return config;
  },
};

module.exports = nextConfig;
