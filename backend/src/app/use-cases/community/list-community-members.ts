import type { CommunityMemberDto, ExperienceService } from '../../../shared/experience.service.js';

export interface ListCommunityMembersInput {
  interest?: string;
  cursor?: string | null;
  limit?: number;
}

export interface ListCommunityMembersOutput {
  members: CommunityMemberDto[];
  nextCursor: string | null;
}

export class ListCommunityMembersUseCase {
  constructor(private readonly experienceService: ExperienceService) {}

  async execute({ interest, cursor, limit = 10 }: ListCommunityMembersInput): Promise<ListCommunityMembersOutput> {
    const { items, nextCursor } = await this.experienceService.listCommunityMembers(interest, limit, cursor);
    return { members: items, nextCursor };
  }
}
