import type { SupabaseClient } from '@supabase/supabase-js';
import type { UserRepository } from '../../../domain/users/user.repository.js';

export interface UpdateUserAvatarInput {
  userId: string;
  avatarUrl: string;
}

export class UpdateUserAvatarUseCase {
  constructor(private readonly userRepository: UserRepository, private readonly supabaseClient?: SupabaseClient) {}

  async execute({ userId, avatarUrl }: UpdateUserAvatarInput): Promise<void> {
    if (this.supabaseClient) {
      const { error } = await this.supabaseClient
        .from('users')
        .update({ avatar_url: avatarUrl })
        .eq('id', userId);
      if (error) {
        throw new Error(`Failed to update avatar: ${error.message}`);
      }
      return;
    }

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
  }
}
