export interface ModelOption {
    id: string;
    provider: 'google' | 'openai';
    name: string;
    description: string;
  }
  
  export const modelOptions: ModelOption[] = [
    {
      id: 'openai:qwen3.5-plus',
      provider: 'openai',
      name: 'Qwen 3.5 Plus',
      description: '更强的 Qwen OpenAI 兼容模型选项',
    },
    {
      id: 'openai:qwen3.5-flash',
      provider: 'openai',
      name: 'Qwen 3.5 Flash',
      description: '更快的 Qwen 3.5 OpenAI 兼容模型选项',
    },
    {
      id: 'google:gemini-3.1-pro-preview',
      provider: 'google',
      name: 'Gemini 3.1 Pro Preview',
      description: '官方当前可用的 Gemini 3 Pro 预览模型',
    },
  ];
  
  export function resolveModel(modelId?: string) {
    return modelOptions.find((option) => option.id === modelId) ?? modelOptions[0];
  }
  