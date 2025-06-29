import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  env: {
    baseURL: `${process.env.NEXT_PUBLIC_BASE_URL}`,
  },
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '8000',
        pathname: '/media/**',
      },
    ],
  },
}

export default nextConfig
