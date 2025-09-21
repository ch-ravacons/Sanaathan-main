import type { ExperienceService } from '../../../shared/experience.service.js';

export interface UnfollowUserInput {
  followerId: string;
  followeeId: string;
}

export class UnfollowUserUseCase {
  constructor(private readonly experienceService: ExperienceService) {}

  async execute({ followerId, followeeId }: UnfollowUserInput): Promise<void> {
    if (followerId === followeeId) {
      return;
    }
    await this.experienceService.unfollowUser(followerId, followeeId);
  }
}
