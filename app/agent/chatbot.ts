import { AIMessage, BaseMessage, HumanMessage } from '@langchain/core/messages';
import { END, MessagesAnnotation, START, StateGraph } from '@langchain/langgraph';
import type { ChatMessage } from '@/app/types/chat';

// 页面和 API 使用的是课程自定义的消息结构，
// LangGraph 工作流使用的是 LangChain 消息对象。
// 这一步转换展示了“UI 协议”和“Agent 协议”之间如何对接。
function toLangChainMessages(messages: ChatMessage[]): BaseMessage[] {
  return messages.map((message) => {
    if (message.role === 'assistant') {
      return new AIMessage(message.content);
    }
    return new HumanMessage(message.content);
  });
}

// 这里先不用真实模型调用，而是构造一个足够说明流程的固定回复。
// 这样可以先专注理解工作流本身，而不是被模型配置打断。
function buildResponse(userInput: string, historyCount: number): string {
  const trimmed = userInput.trim();
  const shortPrompt = trimmed.length > 120 ? `${trimmed.slice(0, 120)}...` : trimmed;

  return [
    '这是 lesson-02 的核心对话流。',
    `我已经通过 LangGraph 工作流接收到你的问题：${shortPrompt}`,
    historyCount > 1
      ? `当前请求里已经带上了 ${historyCount} 条历史消息，后续课程会继续把它演进成真正的会话记忆。`
      : '当前还是最小闭环，只保证“前端输入 -> API -> Agent -> 回复 -> 页面渲染”这条链路成立。',
    '这一课先保持同步返回，第三课再把同一条链路改造成流式输出。',
  ].join('\n\n');
}

// 这是课程里第一次创建真正的 LangGraph 工作流。
// 工作流目前只有一个 `chatbot` 节点，但结构上已经和更复杂的图一致，
// 便于后续课程自然扩展更多节点、工具和状态。
const workflow = new StateGraph(MessagesAnnotation)
  .addNode('chatbot', async (state) => {
    // `state.messages` 是当前工作流上下文里的全部消息。
    const history = state.messages;
    // 取出最近一条 human message，作为这一轮回复的输入依据。
    const lastHuman = [...history].reverse().find((message) => message._getType() === 'human');
    const prompt = typeof lastHuman?.content === 'string' ? lastHuman.content : '你好';
    const response = buildResponse(prompt, history.length);
    return {
      messages: [new AIMessage(response)],
    };
  })
  .addEdge(START, 'chatbot')
  .addEdge('chatbot', END)
  .compile();

// `runChat` 是给路由层调用的稳定入口。
// 路由不需要知道内部图结构，只需要把消息列表传进来并拿到最终回复文本。
export async function runChat(messages: ChatMessage[]): Promise<string> {
  const initialMessages = toLangChainMessages(messages);
  const result = await workflow.invoke({ messages: initialMessages });
  // 在这个最小示例里，只取最后一条消息作为 assistant 最终输出。
  const lastMessage = result.messages[result.messages.length - 1];
  return typeof lastMessage.content === 'string' ? lastMessage.content : JSON.stringify(lastMessage.content);
}