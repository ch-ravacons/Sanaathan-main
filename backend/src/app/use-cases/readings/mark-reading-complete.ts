import type { ExperienceService } from '../../../shared/experience.service.js';

export interface MarkReadingCompleteInput {
  readingId: string;
  userId: string;
}

export class MarkReadingCompleteUseCase {
  constructor(private readonly experienceService: ExperienceService) {}

  async execute({ readingId, userId }: MarkReadingCompleteInput): Promise<void> {
    await this.experienceService.markReadingComplete(readingId, userId);
  }
}
