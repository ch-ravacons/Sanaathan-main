import { User } from './user.entity.js';

export interface CreateUserInput {
  id: string;
  email: string;
  fullName: string;
  spiritualName?: string | null;
}

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(input: CreateUserInput): Promise<User>;
}
