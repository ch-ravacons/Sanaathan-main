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
  spiritual_path: string | null;
  interests: string[] | null;
  path_practices: string[] | null;
  location: string | null;
  bio: string | null;
  avatar_url: string | null;
  vedic_qualifications: string[] | null;
  spiritual_qualifications: string[] | null;
  years_of_experience: number | null;
  areas_of_guidance: string[] | null;
  languages_spoken: string[] | null;
  availability: string | null;
  website: string | null;
  achievements: string[] | null;
  offerings: string[] | null;
  certifications: string[] | null;
  introduction: string | null;
  whatsapp: string | null;
  linkedin: string | null;
  created_at: string;
  updated_at: string;
}

function mapRow(row: UserRow): User {
  return new User({
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    spiritualName: row.spiritual_name,
    spiritualPath: row.spiritual_path,
    interests: row.interests ?? [],
    pathPractices: row.path_practices ?? [],
    location: row.location,
    bio: row.bio,
    avatarUrl: row.avatar_url,
    vedicQualifications: row.vedic_qualifications ?? [],
    spiritualQualifications: row.spiritual_qualifications ?? [],
    yearsOfExperience: row.years_of_experience ?? null,
    areasOfGuidance: row.areas_of_guidance ?? [],
    languagesSpoken: row.languages_spoken ?? [],
    availability: row.availability ?? null,
    website: row.website ?? null,
    achievements: row.achievements ?? [],
    offerings: row.offerings ?? [],
    certifications: row.certifications ?? [],
    introduction: row.introduction ?? null,
    whatsapp: row.whatsapp ?? null,
    linkedin: row.linkedin ?? null,
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
    const { data, error } = await this.client
      .from('users')
      .select(
        'id, email, full_name, spiritual_name, spiritual_path, interests, path_practices, location, bio, avatar_url, vedic_qualifications, spiritual_qualifications, years_of_experience, areas_of_guidance, languages_spoken, availability, website, achievements, offerings, certifications, introduction, whatsapp, linkedin, created_at, updated_at'
      )
      .eq('id', id)
      .maybeSingle<UserRow>();
    if (error) {
      throw new Error(`Failed to fetch user: ${error.message}`);
    }
    return data ? mapRow(data) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const { data, error } = await this.client
      .from('users')
      .select(
        'id, email, full_name, spiritual_name, spiritual_path, interests, path_practices, location, bio, avatar_url, vedic_qualifications, spiritual_qualifications, years_of_experience, areas_of_guidance, languages_spoken, availability, website, achievements, offerings, certifications, introduction, whatsapp, linkedin, created_at, updated_at'
      )
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
        spiritual_name: input.spiritualName ?? null,
        spiritual_path: input.spiritualPath ?? null,
        interests: input.interests ?? [],
        path_practices: input.pathPractices ?? [],
        location: input.location ?? null,
        bio: input.bio ?? null,
        avatar_url: input.avatarUrl ?? null,
        vedic_qualifications: input.vedicQualifications ?? [],
        spiritual_qualifications: input.spiritualQualifications ?? [],
        years_of_experience: input.yearsOfExperience ?? null,
        areas_of_guidance: input.areasOfGuidance ?? [],
        languages_spoken: input.languagesSpoken ?? [],
        availability: input.availability ?? null,
        website: input.website ?? null,
        achievements: input.achievements ?? [],
        offerings: input.offerings ?? [],
        certifications: input.certifications ?? [],
        introduction: input.introduction ?? null,
        whatsapp: input.whatsapp ?? null,
        linkedin: input.linkedin ?? null
      })
      .select(
        'id, email, full_name, spiritual_name, spiritual_path, interests, path_practices, location, bio, avatar_url, vedic_qualifications, spiritual_qualifications, years_of_experience, areas_of_guidance, languages_spoken, availability, website, achievements, offerings, certifications, introduction, whatsapp, linkedin, created_at, updated_at'
      )
      .single<UserRow>();

    if (error || !data) {
      throw new Error(`Failed to create user: ${error?.message ?? 'unknown error'}`);
    }

    return mapRow(data);
  }
}
