import type { DevotionSummaryDto, ExperienceService } from '../../../shared/experience.service.js';

export interface GetDevotionSummaryInput {
  userId: string;
}

export interface GetDevotionSummaryOutput {
  summary: DevotionSummaryDto;
}

export class GetDevotionSummaryUseCase {
  constructor(private readonly experienceService: ExperienceService) {}

  async execute({ userId }: GetDevotionSummaryInput): Promise<GetDevotionSummaryOutput> {
    const summary = await this.experienceService.getDevotionSummary(userId);
    return { summary };
  }
}
