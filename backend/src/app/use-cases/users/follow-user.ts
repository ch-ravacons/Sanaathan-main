import type { ExperienceService } from '../../../shared/experience.service.js';

export interface FollowUserInput {
  followerId: string;
  followeeId: string;
}

export class FollowUserUseCase {
  constructor(private readonly experienceService: ExperienceService) {}

  async execute({ followerId, followeeId }: FollowUserInput): Promise<void> {
    if (followerId === followeeId) {
      throw new Error('Users cannot follow themselves');
    }
    await this.experienceService.followUser(followerId, followeeId);
  }
}
