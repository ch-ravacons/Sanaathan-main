import type { DailyReadingDto, ExperienceService } from '../../../shared/experience.service.js';

export interface GetDailyReadingInput {
  path?: string | null;
}

export interface GetDailyReadingOutput {
  reading: DailyReadingDto;
}

export class GetDailyReadingUseCase {
  constructor(private readonly experienceService: ExperienceService) {}

  async execute({ path }: GetDailyReadingInput): Promise<GetDailyReadingOutput> {
    const reading = await this.experienceService.getDailyReading(path);
    return { reading };
  }
}
