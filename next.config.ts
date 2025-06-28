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
}

export default nextConfig
