import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

// 锁定为本包目录，避免选用上级目录的 package-lock 导致 Turbopack 监视范围过大、内存飙升
const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: {
    root: projectRoot,
  },
};

export default nextConfig;
