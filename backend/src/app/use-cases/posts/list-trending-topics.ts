import type { ExperienceService, TrendingTopicDto } from '../../../shared/experience.service.js';

export interface ListTrendingTopicsInput {
  window?: string;
  limit?: number;
}

export interface ListTrendingTopicsOutput {
  topics: TrendingTopicDto[];
}

export class ListTrendingTopicsUseCase {
  constructor(private readonly experienceService: ExperienceService) {}

  async execute({ limit = 10, window }: ListTrendingTopicsInput = {}): Promise<ListTrendingTopicsOutput> {
    const topics = await this.experienceService.listTrendingTopics(limit, window);
    return { topics };
  }
}
