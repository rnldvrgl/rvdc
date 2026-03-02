import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.svg": {
        loaders: ["@svgr/webpack"],
        as: "*.js",
      },
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "8000",
        pathname: "/media/**",
      },
      {
        protocol: "http",
        hostname: "188.166.230.203",
        port: "8000",
        pathname: "/media/**",
      },
      {
        protocol: "http",
        hostname: "152.42.229.230",
        port: "8000",
        pathname: "/media/**",
      },
      {
        protocol: "https",
        hostname: "api-rvdcrefandaircon.duckdns.org",
        pathname: "/media/**",
      },
    ],
  },
}

export default nextConfig
