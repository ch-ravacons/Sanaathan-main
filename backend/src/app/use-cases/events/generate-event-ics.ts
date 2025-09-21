import type { ExperienceService } from '../../../shared/experience.service.js';

export interface GenerateEventIcsInput {
  eventId: string;
}

export class GenerateEventIcsUseCase {
  constructor(private readonly experienceService: ExperienceService) {}

  async execute({ eventId }: GenerateEventIcsInput): Promise<string> {
    const ics = await this.experienceService.generateEventIcs(eventId);
    if (!ics) {
      throw new Error('Event not found');
    }
    return ics;
  }
}
