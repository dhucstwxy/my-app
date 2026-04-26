import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { ChatOpenAI } from '@langchain/openai';

function requireEnv(name: 'GOOGLE_API_KEY' | 'OPENAI_API_KEY') {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} 未配置，无法调用真实大模型 API`);
  }
  return value;
}

export function createModel(modelId?: string): ChatGoogleGenerativeAI | ChatOpenAI {
  const fullId = modelId || `openai:${process.env.OPENAI_MODEL_NAME || 'qwen-plus'}`;
  const [provider, modelName] = fullId.includes(':') ? fullId.split(':', 2) : ['openai', fullId];

  if (provider === 'openai') {
    return new ChatOpenAI({
      model: modelName,
      apiKey: requireEnv('OPENAI_API_KEY'),
      configuration: {
        baseURL: process.env.OPENAI_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      },
      temperature: 0.7,
    });
  }

  return new ChatGoogleGenerativeAI({
    model: modelName,
    apiKey: requireEnv('GOOGLE_API_KEY'),
    temperature: 0.7,
  });
}
