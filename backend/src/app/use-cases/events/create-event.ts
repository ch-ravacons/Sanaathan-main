import type { EventDto, ExperienceService } from '../../../shared/experience.service.js';

export interface CreateEventInput {
  creatorId: string;
  title: string;
  description?: string | null;
  startAt: string;
  endAt?: string | null;
  location?: string | null;
  tags?: string[];
  capacity?: number | null;
}

export interface CreateEventOutput {
  event: EventDto;
}

export class CreateEventUseCase {
  constructor(private readonly experienceService: ExperienceService) {}

  async execute(input: CreateEventInput): Promise<CreateEventOutput> {
    const event = await this.experienceService.createEvent({
      creator_id: input.creatorId,
      title: input.title,
      description: input.description,
      start_at: input.startAt,
      end_at: input.endAt ?? null,
      location: input.location ?? null,
      tags: input.tags ?? [],
      capacity: input.capacity ?? null,
      is_attending: true
    });
    return { event };
  }
}
