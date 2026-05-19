/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  reactStrictMode: true,
  turbopack: {
    root: __dirname,
  },
};

module.exports = nextConfig;
