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
      spiritualPath: input.spiritualPath ?? null,
      interests: input.interests ?? [],
      pathPractices: input.pathPractices ?? [],
      location: input.location ?? null,
      bio: input.bio ?? null,
      avatarUrl: input.avatarUrl ?? null,
      vedicQualifications: input.vedicQualifications ?? [],
      spiritualQualifications: input.spiritualQualifications ?? [],
      yearsOfExperience: input.yearsOfExperience ?? null,
      areasOfGuidance: input.areasOfGuidance ?? [],
      languagesSpoken: input.languagesSpoken ?? [],
      availability: input.availability ?? null,
      website: input.website ?? null,
      achievements: input.achievements ?? [],
      offerings: input.offerings ?? [],
      certifications: input.certifications ?? [],
      introduction: input.introduction ?? null,
      whatsapp: input.whatsapp ?? null,
      linkedin: input.linkedin ?? null,
      createdAt: now,
      updatedAt: now
    });
    this.items.set(user.id, user);
    return user;
  }
}
