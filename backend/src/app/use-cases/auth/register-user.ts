import { randomUUID } from 'node:crypto';

import type { UserRepository } from '../../../domain/users/user.repository.js';
import { User } from '../../../domain/users/user.entity.js';

export interface RegisterUserInput {
  email: string;
  fullName: string;
  spiritualName?: string | null;
}

export class RegisterUserUseCase {
  constructor(private readonly users: UserRepository) {}

  async execute(input: RegisterUserInput): Promise<User> {
    const existing = await this.users.findByEmail(input.email);
    if (existing) {
      return existing;
    }

    return this.users.create({
      id: randomUUID(),
      email: input.email,
      fullName: input.fullName,
      spiritualName: input.spiritualName ?? null
    });
  }
}
