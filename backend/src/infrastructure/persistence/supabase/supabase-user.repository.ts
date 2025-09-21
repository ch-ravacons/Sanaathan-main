import { User } from '../../../domain/users/user.entity.js';
import type { CreateUserInput, UserRepository } from '../../../domain/users/user.repository.js';
import type { AppConfig } from '../../../shared/config.js';
import { getSupabaseClient } from './supabase-client.js';
import type { SupabaseClient } from '@supabase/supabase-js';

interface UserRow {
  id: string;
  email: string;
  full_name: string;
  spiritual_name: string | null;
  created_at: string;
  updated_at: string;
}

function mapRow(row: UserRow): User {
  return new User({
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    spiritualName: row.spiritual_name,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at)
  });
}

export class SupabaseUserRepository implements UserRepository {
  private readonly client: SupabaseClient;

  constructor(private readonly config: AppConfig) {
    this.client = getSupabaseClient(config);
  }

  async findById(id: string): Promise<User | null> {
    const { data, error } = await this.client.from('users').select('*').eq('id', id).maybeSingle<UserRow>();
    if (error) {
      throw new Error(`Failed to fetch user: ${error.message}`);
    }
    return data ? mapRow(data) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const { data, error } = await this.client
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle<UserRow>();
    if (error) {
      throw new Error(`Failed to fetch user by email: ${error.message}`);
    }
    return data ? mapRow(data) : null;
  }

  async create(input: CreateUserInput): Promise<User> {
    const { data, error } = await this.client
      .from('users')
      .insert({
        id: input.id,
        email: input.email,
        full_name: input.fullName,
        spiritual_name: input.spiritualName ?? null
      })
      .select('*')
      .single<UserRow>();

    if (error || !data) {
      throw new Error(`Failed to create user: ${error?.message ?? 'unknown error'}`);
    }

    return mapRow(data);
  }
}
