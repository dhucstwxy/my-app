import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { generateImageWithGoogle } from '@/app/agent/tools/google-image-generation';
import { runCalculator } from '@/app/agent/tools/calculator';
import { getCurrentTime } from '@/app/agent/tools/current-time';
import type { ToolCallRecord } from '@/app/types/chat';

export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  icon?: string;
  enabled: boolean;
  schema: z.ZodSchema;
  handler: (input: Record<string, unknown>) => Promise<Partial<ToolCallRecord> | string> | Partial<ToolCallRecord> | string;
}

export interface ToolOption {
  id: string;
  name: string;
  description: string;
  icon?: string;
}

const capabilityOptions: ToolOption[] = [
  {
    id: 'canvas',
    name: 'canvas',
    description: '启用 Canvas 组件生成功能',
    icon: '🧩',
  },
];

export const toolDefinitions: ToolDefinition[] = [
  {
    id: 'google_image_generation',
    name: 'google_image_generation',
    description: '生成图片',
    icon: '🖼️',
    enabled: true,
    schema: z.object({
      prompt: z.string().describe('要生成图片的描述'),
      aspectRatio: z.enum(['1:1', '16:9', '9:16', '4:3', '3:4']).optional().default('1:1').describe('图片宽高比'),
      imageSize: z.enum(['1K', '2K', '4K']).optional().default('1K').describe('图片分辨率'),
    }),
    handler: async (input) =>
      generateImageWithGoogle({
        prompt: String(input.prompt || 'Generated image'),
        aspectRatio: input.aspectRatio as '1:1' | '16:9' | '9:16' | '4:3' | '3:4' | undefined,
        imageSize: input.imageSize as '1K' | '2K' | '4K' | undefined,
      }),
  },
  {
    id: 'calculator',
    name: 'calculator',
    description: '计算数学表达式',
    icon: '∑',
    enabled: true,
    schema: z.object({
      expression: z.string().describe('要计算的数学表达式'),
    }),
    handler: async (input) => ({ output: runCalculator(String(input.expression || '')) }),
  },
  {
    id: 'current_time',
    name: 'current_time',
    description: '获取当前时间',
    icon: '🕒',
    enabled: true,
    schema: z.object({
      request: z.string().describe('用户关于时间的提问，例如 现在几点了'),
    }),
    handler: async () => ({ output: `当前时间: ${getCurrentTime()}` }),
  },
];

export function getAvailableToolOptions(): ToolOption[] {
  return [
    ...capabilityOptions,
    ...toolDefinitions
      .filter((tool) => tool.enabled)
      .map(({ id, name, description, icon }) => ({ id, name, description, icon })),
  ];
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
          func: async (input) => {
            const result = await tool.handler(input as Record<string, unknown>);
            return typeof result === 'string' ? result : JSON.stringify(result);
          },
        })
    );
}
