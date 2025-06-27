import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  env: {
    baseURL: `${process.env.NEXT_PUBLIC_BASE_URL}`,
  },
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    })

    return config
  },
}

export default nextConfig
