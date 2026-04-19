import { AIMessage, BaseMessage, HumanMessage } from '@langchain/core/messages';
import { END, MessagesAnnotation, START, StateGraph } from '@langchain/langgraph';
import type { ChatMessage } from '@/app/types/chat';

// 这里沿用第二课的消息转换，说明“同步 / 流式”变化发生在传输层，不在消息模型层。
function toLangChainMessages(messages: ChatMessage[]): BaseMessage[] {
  return messages.map((message) => {
    if (message.role === 'assistant') {
      return new AIMessage(message.content);
    }
    return new HumanMessage(message.content);
  });
}

function buildResponse(userInput: string, historyCount: number): string {
  const trimmed = userInput.trim();
  const shortPrompt = trimmed.length > 120 ? `${trimmed.slice(0, 120)}...` : trimmed;

  return [
    '这是 lesson-03 的流式输出版本。',
    `当前问题：${shortPrompt}`,
    historyCount > 1
      ? `请求中已经包含 ${historyCount} 条历史消息，所以前端现在不仅能显示回复，还能边收边渲染。`
      : '这一课的重点不是回答质量，而是把“完整回复一次返回”改造成“分片逐步抵达”。',
    '完整项目后面会继续在这条流上叠加工具调用事件、Artifact 事件和更复杂的模型输出。',
  ].join('\n\n');
}

const workflow = new StateGraph(MessagesAnnotation)
  .addNode('chatbot', async (state) => {
    const history = state.messages;
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

export async function runChat(messages: ChatMessage[]): Promise<string> {
  const initialMessages = toLangChainMessages(messages);
  const result = await workflow.invoke({ messages: initialMessages });
  const lastMessage = result.messages[result.messages.length - 1];
  return typeof lastMessage.content === 'string' ? lastMessage.content : JSON.stringify(lastMessage.content);
}

export async function* streamChat(messages: ChatMessage[]): AsyncGenerator<string> {
  const response = await runChat(messages);
  // 为了做教学演示，把完整文本按空白切成多个 chunk，
  // 模拟真实模型的分段输出效果。
  const chunks = response.split(/(\s+)/).filter(Boolean);

  for (const chunk of chunks) {
    // 人为增加一点延迟，让流式效果在界面上可观察。
    await new Promise((resolve) => setTimeout(resolve, 18));
    yield chunk;
  }
}
