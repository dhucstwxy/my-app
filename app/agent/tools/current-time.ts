import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';

function getCurrentTime() {
  return new Date().toLocaleString('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    weekday: 'long',
  });
}

export const currentTimeTool = new DynamicStructuredTool({
  name: 'current_time',
  description: '获取当前上海时区时间',
  schema: z.object({}),
  func: async () => `当前时间: ${getCurrentTime()}`,
});
