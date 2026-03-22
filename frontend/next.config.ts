import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // 상위 폴더(SCM)의 package-lock과 구분 — 빌드/트레이싱 루트를 frontend로 고정
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
