import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

// 锁定为本包目录，避免选用上级目录的 package-lock 导致 Turbopack 监视范围过大、内存飙升
const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: {
    root: projectRoot,
  },
  // 服务端路由里用到的 LangChain 包体积大、依赖多；标成 external 可减少开发时打包/追踪图规模，降低内存与卡顿风险
  serverExternalPackages: [
    "@langchain/core",
    "@langchain/langgraph",
    "@langchain/openai",
    "@langchain/google-genai",
  ],
};

export default nextConfig;
