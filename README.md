# LangGraph 多模态聊天（Next.js）

基于 **Next.js App Router** 与 **LangGraph / LangChain** 的前端 + 服务端一体化示例：多轮对话、**SSE 流式输出**、**可配置工具**、**Canvas 协议化组件**、**Supabase** 会话与图状态持久化，并集成 **Supabase Auth**。

---

## 技术栈

| 领域 | 选型 |
|------|------|
| 框架 | Next.js 16（Turbopack 开发，可选 `dev:webpack`） |
| UI | React 19、Tailwind CSS 4、lucide-react |
| 智能体 / LLM | LangGraph、@langchain/core、OpenAI 兼容面 / Google GenAI |
| 持久化与认证 | Supabase（数据库、Storage、Checkpointer、Auth） |
| 流式 | 服务端 `ReadableStream` + SSE 约定（`app/utils/sse.ts`） |
| 富文本 | react-markdown、remark-gfm、rehype-raw（含自定义标签渲染） |
| 校验 | zod |

---

## 主要能力

- **流式聊天**：`POST /api/chat` 返回 `text/event-stream`，按事件推送 `session.start`、`message.delta`、`message.end`、`tool.call` 等；前端在 `app/page.tsx` 中消费。
- **多模型**：通过 `app/agent/config/models.config.ts` 配置可选模型，运行时由 `app/agent/utils/models.ts` 创建 `ChatOpenAI` 或 `ChatGoogleGenerativeAI`。
- **工具与 Canvas**：`app/agent/config/unified-tools.config.ts` 统一定义工具与前端可选能力；启用 **canvas** 时注入 Canvas 系统提示，模型可输出约定好的 `<canvasArtifact>…</canvasCode>…` 等标签；`app/canvas/parse-canvas-artifacts.ts` 从助手消息中解析为 **Canvas 工件**。
- **会话与图状态**：`app/services/memory.service.ts` + `app/database/chat.repository.ts` 管会话；LangGraph 使用 **SupabaseSaver**（`@skroyc/langgraph-supabase-checkpointer`）做 checkpoint，需在 Supabase 中执行该包随附的 **`migrations.sql`**（并配置 Storage 等，详见包说明）。
- **鉴权**：`app/contexts/AuthContext.tsx` 与 `app/api/auth/*`，依赖 Supabase 项目与公钥/回调配置。
- **产物与Artifacts API**：`app/api/artifacts` 等用于工件列表与单条查看，与 `app/artifact/[id]/` 页面配合。

---

## 环境变量

在项目根目录创建 `.env` 或 `.env.local`（勿提交密钥）。**至少**需满足：

| 变量 | 说明 |
|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 项目 URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` | Supabase 公钥（anon / publishable） |
| `OPENAI_API_KEY` | 使用 OpenAI 兼容通道（如 DashScope Qwen）时必填 |
| `GOOGLE_API_KEY` | 选用 Google 模型时必填 |

可选（见 `app/agent/utils/models.ts` 等）：

- `OPENAI_BASE_URL`：默认可为阿里云 DashScope 兼容端点
- `OPENAI_MODEL_NAME`：默认 `qwen-plus` 等

缺少关键变量时，部分模块在加载时会**直接抛错**（例如 `app/database/supabase.ts`、模型创建），请对照终端与浏览器中 SSE `error` 事件排查。

---

## 本地运行

```bash
pnpm install
pnpm dev
```

浏览器访问 [http://localhost:3000](http://localhost:3000)。若本机使用 **pnpm** 且 Turbopack 在开发中占用异常高内存，可尝试：

```bash
pnpm run dev:webpack
```

`next.config.ts` 中已设置 `turbopack.root` 与 `serverExternalPackages`，以减轻在存在多个 **lockfile** 时误判工程根、以及 LangChain 在开发模式下打包压力过大的问题。建议仓库内**只保留一种**包管理器锁文件，避免与上级目录的 `package-lock.json` 冲突。

```bash
pnpm run build
pnpm start
```

---

## 目录结构（节选）

```text
app/
  agent/            # LangGraph 图、工具实现、模型与统一工具配置
  api/              # chat、auth、artifacts 等 Route Handlers
  canvas/           # Canvas 类型、解析、提示词
  components/       # 聊天、Markdown、工具面板、Canvas 面板等
  contexts/         # Auth 等
  database/         # Supabase 客户端、会话与 artifacts 数据访问
  hooks/            # 如 useCanvasArtifacts / canvasStore
  services/         # 聊天、内存、存储等业务编排
  types/            # 消息、附件、工具调用等类型
  page.tsx          # 主聊天页
public/
```

---

## 相关文档

- [Next.js](https://nextjs.org/docs) · [Turbopack 根目录](https://nextjs.org/docs/app/api-reference/config/next-config-js/turbopack)
- [LangGraph JS](https://langchain-ai.github.io/langgraphjs/) · [Supabase](https://supabase.com/docs)
- Checkpointer 数据库脚本：`node_modules/@skroyc/langgraph-supabase-checkpointer/migrations.sql`（安装该依赖后存在）

---

## 许可

与上游依赖及课程用途一致；若需对外分发请自行补充 LICENSE。
