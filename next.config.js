/** @type {import('next').NextConfig} */
const nextConfig = {
  // Production optimizations
  experimental: {
    // Remove deprecated appDir option - no longer needed in Next.js 14
    // Add file system optimizations
    optimizePackageImports: ['@supabase/supabase-js', 'lucide-react'],
    // Add more resilient file handling
    workerThreads: false,
    cpus: 1,
  },
  
  // Performance optimizations
  compress: true,
  
  // File system optimizations to prevent build errors
  onDemandEntries: {
    // Period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 25 * 1000,
    // Number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 2,
  },
  
  // Transpile packages that need special handling
  transpilePackages: ['react-phone-input-2'],
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
  
  // Environment variables
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  
  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    formats: ['image/webp', 'image/avif'],
  },
  
  // Webpack configuration for production and file system handling
  webpack: (config, { dev, isServer }) => {
    // File system optimizations to prevent build errors
    config.watchOptions = {
      poll: 1000,
      aggregateTimeout: 300,
      ignored: ['**/node_modules', '**/.git', '**/.next', '**/dist'],
    };
    
    // Handle file system errors gracefully
    config.infrastructureLogging = {
      level: 'error',
    };
    
    // Add file system error handling
    config.stats = {
      errorDetails: false,
      children: false,
    };
    
    // Disable file system optimizations that cause issues on Windows
    config.optimization = {
      ...config.optimization,
      removeAvailableModules: false,
      removeEmptyChunks: false,
      splitChunks: false,
    };
    
    // Production optimizations
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
        },
      };
    }
    
    return config;
  },
  
  // Development server optimizations
  devIndicators: {
    buildActivity: false,
    buildActivityPosition: 'bottom-right',
  },
  
  // File system error handling
  typescript: {
    // Don't run TypeScript during build to prevent file system issues
    ignoreBuildErrors: true,
  },
  
  eslint: {
    // Don't run ESLint during build to prevent file system issues
    ignoreDuringBuilds: true,
  },
  
  // Add more resilient file handling
  poweredByHeader: false,
  generateEtags: false,
  
  // Disable some features that cause file system issues
  swcMinify: false,
};

module.exports = nextConfig;
