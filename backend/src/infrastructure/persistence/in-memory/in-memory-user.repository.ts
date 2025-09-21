import { User } from '../../../domain/users/user.entity.js';
import type { CreateUserInput, UserRepository } from '../../../domain/users/user.repository.js';

export class InMemoryUserRepository implements UserRepository {
  private readonly items = new Map<string, User>();

  async findById(id: string): Promise<User | null> {
    return this.items.get(id) ?? null;
  }

  async findByEmail(email: string): Promise<User | null> {
    for (const user of this.items.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return null;
  }

  async create(input: CreateUserInput): Promise<User> {
    const now = new Date();
    const user = new User({
      id: input.id,
      email: input.email,
      fullName: input.fullName,
      spiritualName: input.spiritualName ?? null,
      createdAt: now,
      updatedAt: now
    });
    this.items.set(user.id, user);
    return user;
  }
}
