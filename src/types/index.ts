export interface User {
  id: string;
  email: string;
  full_name: string;
  spiritual_name?: string | null;
  phone?: string | null;
  location?: string | null;
  age_group?: string | null;
  gender?: string | null;
  interests: string[];
  spiritual_path: string;
  path_practices: string[];
  bio?: string | null;
  avatar_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Interest {
  id: string;
  name: string;
  description: string;
  category: 'scripture' | 'practice' | 'philosophy' | 'ritual';
}

export interface SpiritualPath {
  id: string;
  name: string;
  description: string;
  practices: string[];
}

export interface AuthState {
  user: User | null;
  session: any | null;
  loading: boolean;
}

export interface PostMedia {
  id: string;
  url: string;
  media_type: 'image' | 'video';
  metadata?: Record<string, unknown> | null;
  storage_bucket?: string | null;
}

export interface Post {
  id: string;
  user_id: string;
  content: string;
  spiritual_topic?: string;
  tags: string[];
  likes_count: number;
  comments_count: number;
  shares_count: number;
  is_moderated: boolean;
  moderation_status: 'approved' | 'pending' | 'flagged' | 'rejected';
  created_at: string;
  updated_at: string;
  user?: User;
  media?: PostMedia[];
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user?: User;
}

export interface PostLike {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
}
