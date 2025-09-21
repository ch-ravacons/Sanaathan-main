import type { DevotionSummaryDto, ExperienceService } from '../../../shared/experience.service.js';

export interface LogDevotionPracticeInput {
  userId: string;
  practiceId: string;
  intensity?: 'light' | 'medium' | 'intense';
  notes?: string | null;
}

export interface LogDevotionPracticeOutput {
  summary: DevotionSummaryDto;
}

export class LogDevotionPracticeUseCase {
  constructor(private readonly experienceService: ExperienceService) {}

  async execute({ userId, practiceId, intensity, notes }: LogDevotionPracticeInput): Promise<LogDevotionPracticeOutput> {
    const practices = this.experienceService.listDevotionPractices();
    const basePoints = practices.find((practice) => practice.id === practiceId)?.base_points ?? 10;
    const multiplier = intensity === 'intense' ? 1.5 : intensity === 'medium' ? 1.2 : 1;
    const points = Math.round(basePoints * multiplier);
    const summary = await this.experienceService.logDevotionPractice(userId, practiceId, points, intensity, notes);
    return { summary };
  }
}
