// SSE 编码被抽到独立工具函数后，route/service 都不用再重复手写拼接格式。
export function formatSse(event: string, data: unknown) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}
