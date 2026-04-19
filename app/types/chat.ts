// 先用一个非常小的角色集合定义课程里的消息类型，
// 随着课程推进，再逐步补充工具消息、系统消息等更复杂角色。
export type ChatRole = 'user' | 'assistant';

// 前后端共享这份消息结构，保证页面状态、API 请求和 Agent 输入保持一致。
export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
}
