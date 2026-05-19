// D:\trimly\apps\web\next.config.ts
import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname, "../.."),
  },
  reactCompiler: true,
  images: {
    dangerouslyAllowSVG: false,
    unoptimized: process.env.NODE_ENV === "development",
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "4000",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "trimly-production-5acc.up.railway.app",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;