/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    optimizePackageImports: [],
  },
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig