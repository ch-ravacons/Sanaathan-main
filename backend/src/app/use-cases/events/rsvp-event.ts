import type { EventDto, ExperienceService } from '../../../shared/experience.service.js';

export interface RsvpEventInput {
  eventId: string;
  userId: string;
  status: 'going' | 'interested' | 'not_going';
}

export interface RsvpEventOutput {
  event: EventDto;
}

export class RsvpEventUseCase {
  constructor(private readonly experienceService: ExperienceService) {}

  async execute({ eventId, userId, status }: RsvpEventInput): Promise<RsvpEventOutput> {
    const event = await this.experienceService.rsvpEvent(eventId, userId, status);
    if (!event) {
      throw new Error('Event not found');
    }
    return { event };
  }
}
