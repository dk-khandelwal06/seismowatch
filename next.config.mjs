/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  eslint: {
    // Warning only during builds
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
