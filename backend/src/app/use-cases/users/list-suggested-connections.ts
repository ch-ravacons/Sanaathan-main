import type { ExperienceService, SuggestedConnectionDto } from '../../../shared/experience.service.js';

export interface ListSuggestedConnectionsInput {
  userId?: string;
  limit?: number;
}

export interface ListSuggestedConnectionsOutput {
  suggestions: SuggestedConnectionDto[];
}

export class ListSuggestedConnectionsUseCase {
  constructor(private readonly experienceService: ExperienceService) {}

  async execute({ limit = 5 }: ListSuggestedConnectionsInput): Promise<ListSuggestedConnectionsOutput> {
    const suggestions = await this.experienceService.listSuggestedConnections(limit);
    return { suggestions };
  }
}
