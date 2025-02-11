/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  distDir: './out',
  images: {
    unoptimized: true,
  },
  reactStrictMode: true,
  swcMinify: true,
  basePath: '',
  assetPrefix: process.env.NODE_ENV === 'production' ? 'http://localhost' : '',
  webpack: (config) => {
    config.resolve.fallback = { fs: false, path: false };
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': './src',
    };
    return config;
  },
  optimizeFonts: true,
  typescript: {
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig 