import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';

export function runCalculator(expression: string) {
  try {
    const result = Function(`"use strict"; return (${expression})`)();
    return `计算结果: ${expression} = ${result}`;
  } catch {
    return `计算错误: 无法计算表达式 "${expression}"`;
  }
}

export const calculatorTool = new DynamicStructuredTool({
  name: 'calculator',
  description: '计算数学表达式，例如 2 + 3 * 4',
  schema: z.object({
    expression: z.string().describe('要计算的数学表达式'),
  }),
  func: async ({ expression }) => runCalculator(expression),
});
