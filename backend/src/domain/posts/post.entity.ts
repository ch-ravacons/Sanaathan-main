export interface PostProps {
  id: string;
  userId: string;
  content: string;
  spiritualTopic?: string | null;
  tags: string[];
  moderationStatus: 'approved' | 'pending' | 'flagged' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
  author?: {
    id: string;
    email: string;
    fullName: string;
    spiritualName?: string | null;
    spiritualPath?: string | null;
  };
  likesCount?: number;
  commentsCount?: number;
  sharesCount?: number;
}

export class Post {
  constructor(private readonly props: PostProps) {}

  get id() {
    return this.props.id;
  }

  get userId() {
    return this.props.userId;
  }

  get content() {
    return this.props.content;
  }

  get moderationStatus() {
    return this.props.moderationStatus;
  }

  get tags() {
    return this.props.tags;
  }

  get createdAt() {
    return this.props.createdAt;
  }

  get author() {
    return this.props.author;
  }

  get likesCount() {
    return this.props.likesCount ?? 0;
  }

  get commentsCount() {
    return this.props.commentsCount ?? 0;
  }

  get sharesCount() {
    return this.props.sharesCount ?? 0;
  }

  toJSON() {
    return { ...this.props };
  }
}
