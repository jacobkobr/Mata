const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  distDir: './out',
  images: {
    unoptimized: true,
  },
  reactStrictMode: true,
  // Minification and font optimization are on by default as of Next 15;
  // the explicit flags for both were removed and now just warn.
  outputFileTracingRoot: path.join(__dirname),
  webpack: (config) => {
    config.resolve.fallback = { fs: false, path: false };
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': './src',
    };
    return config;
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    optimizeCss: true
  }
}

module.exports = nextConfig 