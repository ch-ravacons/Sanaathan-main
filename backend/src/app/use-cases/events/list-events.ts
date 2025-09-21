import type { EventDto, ExperienceService } from '../../../shared/experience.service.js';

export interface ListEventsInput {
  interest?: string;
  startAfter?: string;
  attending?: boolean;
  userId?: string;
}

export interface ListEventsOutput {
  events: EventDto[];
}

export class ListEventsUseCase {
  constructor(private readonly experienceService: ExperienceService) {}

  async execute(input: ListEventsInput = {}): Promise<ListEventsOutput> {
    const events = await this.experienceService.listEvents({
      interest: input.interest,
      startAfter: input.startAfter,
      attending: input.attending,
      userId: input.userId
    });
    return { events };
  }
}
