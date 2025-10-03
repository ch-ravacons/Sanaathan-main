export interface UserProps {
  id: string;
  email: string;
  fullName: string;
  spiritualName?: string | null;
  spiritualPath?: string | null;
  interests?: string[];
  pathPractices?: string[];
  location?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  vedicQualifications?: string[];
  spiritualQualifications?: string[];
  yearsOfExperience?: number | null;
  areasOfGuidance?: string[];
  languagesSpoken?: string[];
  availability?: string | null;
  website?: string | null;
  achievements?: string[];
  offerings?: string[];
  certifications?: string[];
  introduction?: string | null;
  whatsapp?: string | null;
  linkedin?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class User {
  constructor(private readonly props: UserProps) {}

  get id() {
    return this.props.id;
  }

  get email() {
    return this.props.email;
  }

  get fullName() {
    return this.props.fullName;
  }

  get spiritualName() {
    return this.props.spiritualName ?? null;
  }

  get spiritualPath() {
    return this.props.spiritualPath ?? null;
  }

  get interests() {
    return this.props.interests ?? [];
  }

  get pathPractices() {
    return this.props.pathPractices ?? [];
  }

  get location() {
    return this.props.location ?? null;
  }

  get bio() {
    return this.props.bio ?? null;
  }

  get avatarUrl() {
    return this.props.avatarUrl ?? null;
  }

  get vedicQualifications() {
    return this.props.vedicQualifications ?? [];
  }

  get spiritualQualifications() {
    return this.props.spiritualQualifications ?? [];
  }

  get yearsOfExperience() {
    return this.props.yearsOfExperience ?? null;
  }

  get areasOfGuidance() {
    return this.props.areasOfGuidance ?? [];
  }

  get languagesSpoken() {
    return this.props.languagesSpoken ?? [];
  }

  get availability() {
    return this.props.availability ?? null;
  }

  get website() {
    return this.props.website ?? null;
  }

  get achievements() {
    return this.props.achievements ?? [];
  }

  get offerings() {
    return this.props.offerings ?? [];
  }

  get certifications() {
    return this.props.certifications ?? [];
  }

  get introduction() {
    return this.props.introduction ?? null;
  }

  get whatsapp() {
    return this.props.whatsapp ?? null;
  }

  get linkedin() {
    return this.props.linkedin ?? null;
  }

  toJSON() {
    return { ...this.props };
  }
}
