import { GoogleGenAI } from '@google/genai';
import { storageService } from '@/app/services/storage.service';

const SUPPORTED_ASPECT_RATIOS = ['1:1', '16:9', '9:16', '4:3', '3:4'] as const;
const SUPPORTED_IMAGE_SIZES = ['1K', '2K', '4K'] as const;

export type SupportedAspectRatio = (typeof SUPPORTED_ASPECT_RATIOS)[number];
export type SupportedImageSize = (typeof SUPPORTED_IMAGE_SIZES)[number];

export interface GoogleImageGenerationParams {
  prompt: string;
  aspectRatio?: SupportedAspectRatio;
  imageSize?: SupportedImageSize;
}

export async function generateImageWithGoogle({
  prompt,
  aspectRatio = '1:1',
  imageSize = '1K',
}: GoogleImageGenerationParams) {
  const startedAt = Date.now();
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error('未配置 GOOGLE_API_KEY，无法调用真实图片生成 API');
  }

  console.log('[lesson-13][google_image_generation] start', {
    prompt,
    aspectRatio,
    imageSize,
  });

  const client = new GoogleGenAI({ apiKey });
  const generateStartedAt = Date.now();
  const response = await client.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: prompt,
    config: {
      responseModalities: ['TEXT', 'IMAGE'],
      imageConfig: {
        aspectRatio,
        imageSize,
      },
    },
  });
  console.log('[lesson-13][google_image_generation] model-complete', {
    durationMs: Date.now() - generateStartedAt,
  });

  const candidates = response.candidates;
  if (!candidates || candidates.length === 0) {
    throw new Error('图片生成失败：模型没有返回候选结果');
  }

  const parts = candidates[0].content?.parts;
  if (!parts || parts.length === 0) {
    throw new Error('图片生成失败：响应中没有可解析的内容');
  }

  for (const part of parts) {
    if (!part.inlineData) continue;

    const imageBuffer = Buffer.from(part.inlineData.data as string, 'base64');
    const mimeType = part.inlineData.mimeType || 'image/png';
    const extension = mimeType.split('/')[1] || 'png';
    const fileName = `generated_${Date.now()}.${extension}`;

    console.log('[lesson-13][google_image_generation] upload-start', {
      fileName,
      mimeType,
      sizeBytes: imageBuffer.byteLength,
    });
    const uploadStartedAt = Date.now();
    const uploadResult = await storageService.uploadImage(imageBuffer, fileName, mimeType);
    console.log('[lesson-13][google_image_generation] upload-complete', {
      durationMs: Date.now() - uploadStartedAt,
      success: uploadResult.success,
      url: uploadResult.url,
      error: uploadResult.error,
    });

    if (!uploadResult.success || !uploadResult.url) {
      throw new Error(uploadResult.error || '图片上传到 Supabase Storage 失败');
    }

    console.log('[lesson-13][google_image_generation] done', {
      totalDurationMs: Date.now() - startedAt,
      url: uploadResult.url,
    });
    return {
      output: '图片已生成，请在最终回复中直接展示图片卡片，不要把标签放进代码块。',
      imageUrl: uploadResult.url,
      markdown: `<imagecard status="ready" src="${uploadResult.url}" download="${uploadResult.url}" prompt="${prompt.replace(/"/g, '&quot;')}" aspectRatio="${aspectRatio}"></imagecard>`,
    };
  }

  throw new Error('图片生成失败：响应中未包含图片数据');
}
