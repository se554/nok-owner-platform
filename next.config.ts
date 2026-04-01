import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.breezeway.io' },
      { protocol: 'https', hostname: '**.hostify.com' },
    ],
  },
}

export default nextConfig
