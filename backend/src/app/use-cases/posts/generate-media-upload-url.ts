import { randomUUID } from 'node:crypto';

export interface GenerateMediaUploadUrlInput {
  userId: string;
  mediaType: 'image' | 'video';
  fileName: string;
}

export interface GenerateMediaUploadUrlOutput {
  uploadUrl: string;
  assetId: string;
  headers?: Record<string, string>;
}

export class GenerateMediaUploadUrlUseCase {
  async execute({ mediaType, fileName }: GenerateMediaUploadUrlInput): Promise<GenerateMediaUploadUrlOutput> {
    const assetId = randomUUID();
    const safeFileName = fileName.toLowerCase().replace(/[^a-z0-9\.]+/g, '-');
    const uploadUrl = `https://uploads.sanaathan.local/${assetId}/${safeFileName}?type=${mediaType}`;

    return {
      assetId,
      uploadUrl,
      headers: {
        'x-upload-token': randomUUID()
      }
    };
  }
}
