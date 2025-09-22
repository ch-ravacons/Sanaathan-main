import { randomUUID } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface GenerateAvatarUploadUrlInput {
  userId: string;
  fileName: string;
}

export interface GenerateAvatarUploadUrlOutput {
  assetId: string;
  uploadUrl: string;
  headers?: Record<string, string>;
  publicUrl?: string | null;
  path: string;
}

export interface GenerateAvatarUploadUrlDependencies {
  storageClient?: SupabaseClient;
  bucket: string;
}

function inferExtension(fileName: string): string {
  const lower = fileName.toLowerCase();
  const match = lower.match(/\.([a-z0-9]{2,5})$/);
  if (match) return match[1];
  return 'jpg';
}

export class GenerateAvatarUploadUrlUseCase {
  constructor(private readonly deps: GenerateAvatarUploadUrlDependencies) {}

  async execute({ userId, fileName }: GenerateAvatarUploadUrlInput): Promise<GenerateAvatarUploadUrlOutput> {
    const assetId = randomUUID();
    const extension = inferExtension(fileName);
    const objectPath = `avatars/${userId}/${assetId}.${extension}`;

    if (!this.deps.storageClient) {
      const uploadUrl = `https://uploads.sanaathan.local/${objectPath}`;
      return {
        assetId,
        uploadUrl,
        headers: {
          'content-type': 'image/*'
        },
        publicUrl: uploadUrl,
        path: objectPath
      };
    }

    const storage = this.deps.storageClient.storage.from(this.deps.bucket);
    const { data, error } = await storage.createSignedUploadUrl(objectPath, { upsert: true });

    if (error || !data?.signedUrl) {
      throw new Error(`Failed to generate avatar upload URL: ${error?.message ?? 'unknown error'}`);
    }

    const { data: publicUrlData } = storage.getPublicUrl(objectPath);

    return {
      assetId,
      uploadUrl: data.signedUrl,
      headers: {
        'content-type': 'image/*'
      },
      publicUrl: publicUrlData?.publicUrl ?? null,
      path: objectPath
    };
  }
}
