import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: [
      'rtusxocdzaooupebkxfx.supabase.co',
      // add other domains as needed
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
