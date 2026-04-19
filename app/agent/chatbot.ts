import { HumanMessage } from '@langchain/core/messages';
import { END, MemorySaver, MessagesAnnotation, START, StateGraph } from '@langchain/langgraph';
import { createModel } from '@/app/agent/utils/models';

const checkpointer = new MemorySaver();

const workflow = new StateGraph(MessagesAnnotation)
  .addNode('chatbot', async (state) => {
    const model = createModel();
    const response = await model.invoke(state.messages);
    return { messages: [response] };
  })
  .addEdge(START, 'chatbot')
  .addEdge('chatbot', END);

const app = workflow.compile({ checkpointer });

export function getChatApp() {
  return app;
}

export async function* streamChat(message: string, threadId: string) {
  for await (const event of app.streamEvents(
    { messages: [new HumanMessage(message)] },
    { version: 'v2', configurable: { thread_id: threadId } }
  )) {
    if (event.event !== 'on_chat_model_stream') continue;
    const chunk = event.data?.chunk;
    if (!chunk?.content) continue;
    if (typeof chunk.content === 'string') {
      yield chunk.content;
      continue;
    }
    for (const item of chunk.content) {
      if (item.type === 'text' && item.text) {
        yield item.text;
      }
    }
  }
}
