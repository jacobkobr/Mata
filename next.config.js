/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  distDir: './out',
  images: {
    unoptimized: true,
  },
  reactStrictMode: true,
  swcMinify: true,
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
  experimental: {
    optimizeCss: true
  }
}

module.exports = nextConfig 