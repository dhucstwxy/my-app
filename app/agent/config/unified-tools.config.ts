import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { runCalculator } from '@/app/agent/tools/calculator';
import { getCurrentTime } from '@/app/agent/tools/current-time';

export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  icon?: string;
  enabled: boolean;
  schema: z.ZodSchema;
  handler: (input: Record<string, unknown>) => Promise<string> | string;
}

export interface ToolOption {
  id: string;
  name: string;
  description: string;
  icon?: string;
}

export const toolDefinitions: ToolDefinition[] = [
  {
    id: 'current_time',
    name: 'current_time',
    description: '获取当前上海时区时间',
    icon: '🕒',
    enabled: true,
    schema: z.object({
      request: z.string().describe('用户关于时间的提问，例如 现在几点了'),
    }),
    handler: async () => `当前时间: ${getCurrentTime()}`,
  },
  {
    id: 'calculator',
    name: 'calculator',
    description: '计算数学表达式，例如 2 + 3 * 4',
    icon: '∑',
    enabled: true,
    schema: z.object({
      expression: z.string().describe('要计算的数学表达式'),
    }),
    handler: async (input) => runCalculator(String(input.expression || '')),
  },
];

export function getAvailableToolOptions(): ToolOption[] {
  return toolDefinitions
    .filter((tool) => tool.enabled)
    .map(({ id, name, description, icon }) => ({ id, name, description, icon }));
}

export function createLangChainTools(toolIds?: string[]) {
  const selectedIds = new Set(toolIds ?? getAvailableToolOptions().map((tool) => tool.id));

  return toolDefinitions
    .filter((tool) => tool.enabled && selectedIds.has(tool.id))
    .map(
      (tool) =>
        new DynamicStructuredTool({
          name: tool.name,
          description: tool.description,
          schema: tool.schema,
          func: async (input) => tool.handler(input as Record<string, unknown>),
        })
    );
}
