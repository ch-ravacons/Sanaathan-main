import type { SupabaseClient } from '@supabase/supabase-js';

const BANNED_KEYWORDS = ['violence', 'hate', 'terrorism', 'self-harm'];

export interface ModeratePostInput {
  postId: string;
  userId: string;
  content: string;
}

export interface ModerationResult {
  status: 'approved' | 'flagged';
  score: number;
  labels: string[];
}

export class ContentModerationService {
  constructor(private readonly supabaseClient?: SupabaseClient) {}

  async moderatePost(input: ModeratePostInput): Promise<ModerationResult> {
    const lower = input.content.toLowerCase();
    const flaggedKeywords = BANNED_KEYWORDS.filter((word) => lower.includes(word));
    const isFlagged = flaggedKeywords.length > 0;

    const result: ModerationResult = {
      status: isFlagged ? 'flagged' : 'approved',
      score: isFlagged ? 0.1 : 0.95,
      labels: isFlagged ? flaggedKeywords : ['clean']
    };

    if (!this.supabaseClient) {
      return result;
    }

    await this.supabaseClient
      .from('ai_moderation_events')
      .insert({
        post_id: input.postId,
        user_id: input.userId,
        status: result.status,
        score: result.score,
        labels: result.labels,
        reasoning: isFlagged ? 'Flagged by keyword heuristics' : 'Passed keyword heuristics'
      });

    const { error } = await this.supabaseClient
      .from('posts')
      .update({ moderation_status: result.status })
      .eq('id', input.postId);

    if (error) {
      throw new Error(`Failed to update post moderation status: ${error.message}`);
    }

    return result;
  }
}
