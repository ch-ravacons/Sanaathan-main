import { randomUUID } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface GenerateMediaUploadUrlInput {
  userId: string;
  mediaType: 'image' | 'video';
  fileName: string;
}

export interface GenerateMediaUploadUrlOutput {
  uploadUrl: string;
  assetId: string;
  headers?: Record<string, string>;
  publicUrl?: string | null;
  path?: string;
}

export interface GenerateMediaUploadUrlDependencies {
  storageClient?: SupabaseClient;
  bucket: string;
}

function inferExtension(fileName: string, mediaType: 'image' | 'video'): string {
  const lower = fileName.toLowerCase();
  const match = lower.match(/\.([a-z0-9]{2,5})$/);
  if (match) return match[1];
  if (mediaType === 'image') return 'jpg';
  if (mediaType === 'video') return 'mp4';
  return 'bin';
}

export class GenerateMediaUploadUrlUseCase {
  constructor(private readonly deps: GenerateMediaUploadUrlDependencies) {}

  async execute({ userId, mediaType, fileName }: GenerateMediaUploadUrlInput): Promise<GenerateMediaUploadUrlOutput> {
    const assetId = randomUUID();
    const extension = inferExtension(fileName, mediaType);
    const objectPath = `${userId}/${assetId}.${extension}`;

    if (!this.deps.storageClient) {
      const uploadUrl = `https://uploads.sanaathan.local/${objectPath}`;
      return {
        assetId,
        uploadUrl,
        headers: {
          'content-type': mediaType === 'image' ? 'image/*' : 'video/*'
        },
        publicUrl: uploadUrl,
        path: objectPath
      };
    }

    const storageBucket = this.deps.bucket;
    await this.ensureBucket(storageBucket);

    const storage = this.deps.storageClient.storage.from(storageBucket);

    const { data, error } = await storage.createSignedUploadUrl(objectPath, {
      upsert: true
    });
    if (error || !data?.signedUrl) {
      throw new Error(`Failed to generate upload URL: ${error?.message ?? 'unknown error'}`);
    }

    const { data: publicUrlData } = storage.getPublicUrl(objectPath);

    await this.deps.storageClient
      .from('media_uploads')
      .insert({
        id: assetId,
        user_id: userId,
        url: publicUrlData?.publicUrl ?? objectPath,
        media_type: mediaType,
        original_filename: fileName,
        storage_bucket: storageBucket,
        metadata: { objectPath, mediaType }
      });

    return {
      assetId,
      uploadUrl: data.signedUrl,
      headers: {
        'content-type': mediaType === 'image' ? 'image/*' : 'video/*'
      },
      publicUrl: publicUrlData?.publicUrl ?? null,
      path: objectPath
    };
  }

  private async ensureBucket(bucket: string): Promise<void> {
    if (!this.deps.storageClient) return;

    const storageAdmin = this.deps.storageClient.storage;
    const { error } = await storageAdmin.createBucket(bucket, { public: true });

    if (error && !/exists/i.test(error.message)) {
      throw new Error(`Failed to create bucket ${bucket}: ${error.message}`);
    }

    await storageAdmin.updateBucket(bucket, { public: true });
  }
}
