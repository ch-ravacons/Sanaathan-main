import { User } from './user.entity.js';

export interface CreateUserInput {
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
}

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(input: CreateUserInput): Promise<User>;
}
