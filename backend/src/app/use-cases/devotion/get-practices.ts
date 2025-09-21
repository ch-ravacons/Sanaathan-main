import type { DevotionPracticeDto, ExperienceService } from '../../../shared/experience.service.js';

export interface GetDevotionPracticesOutput {
  practices: DevotionPracticeDto[];
}

export class GetDevotionPracticesUseCase {
  constructor(private readonly experienceService: ExperienceService) {}

  async execute(): Promise<GetDevotionPracticesOutput> {
    const practices = this.experienceService.listDevotionPractices();
    return { practices };
  }
}
