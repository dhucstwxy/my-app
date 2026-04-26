import { supabase } from '@/app/database/supabase';

const IMAGE_BUCKET = 'generated-images';

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export class StorageService {
  async uploadImage(
    buffer: Buffer,
    fileName: string,
    mimeType: string = 'image/png'
  ): Promise<UploadResult> {
    try {
      const timestampedPath = `${Date.now()}-${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(IMAGE_BUCKET)
        .upload(timestampedPath, buffer, {
          contentType: mimeType,
          upsert: false,
        });

      if (uploadError) {
        return {
          success: false,
          error: `Upload failed: ${uploadError.message}`,
        };
      }

      const { data } = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(timestampedPath);

      return {
        success: true,
        url: data.publicUrl,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

export const storageService = new StorageService();

