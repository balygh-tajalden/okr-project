import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // السماح بنطاقات المعاينة الفرعية بإعادة تحميل أصول _next/* في وضع التطوير.
  // يحل مشكلة "Cross origin request detected" التي تمنع ظهور المعاينة في الـ iframe.
  allowedDevOrigins: [
    "*.space-z.ai",
    "*.chatglm.cn",
    "*.z.ai",
    "localhost",
    "127.0.0.1",
  ],
};

export default nextConfig;
