import type { AppConfig } from './config.js';
import { logger } from './logger.js';
import { InMemoryUserRepository } from '../infrastructure/persistence/in-memory/in-memory-user.repository.js';
import { InMemoryPostRepository } from '../infrastructure/persistence/in-memory/in-memory-post.repository.js';
import { InMemoryAiOrchestrator } from '../infrastructure/ai/in-memory-orchestrator.js';
import { SupabaseUserRepository } from '../infrastructure/persistence/supabase/supabase-user.repository.js';
import { SupabasePostRepository } from '../infrastructure/persistence/supabase/supabase-post.repository.js';
import { RegisterUserUseCase } from '../app/use-cases/auth/register-user.js';
import { CreatePostUseCase } from '../app/use-cases/posts/create-post.js';
import { ListUserPostsUseCase } from '../app/use-cases/posts/list-user-posts.js';
import { ListFeedUseCase } from '../app/use-cases/posts/list-feed.js';
import { AskAgentUseCase } from '../app/use-cases/ai/ask-agent.js';
import { ExperienceService } from './experience.service.js';
import { getSupabaseClient } from '../infrastructure/persistence/supabase/supabase-client.js';
import { ListSuggestedConnectionsUseCase } from '../app/use-cases/users/list-suggested-connections.js';
import { ListTrendingTopicsUseCase } from '../app/use-cases/posts/list-trending-topics.js';
import { GenerateMediaUploadUrlUseCase } from '../app/use-cases/posts/generate-media-upload-url.js';
import { GetDailyReadingUseCase } from '../app/use-cases/readings/get-daily-reading.js';
import { MarkReadingCompleteUseCase } from '../app/use-cases/readings/mark-reading-complete.js';
import { ListCommunityMembersUseCase } from '../app/use-cases/community/list-community-members.js';
import { CreateEventUseCase } from '../app/use-cases/events/create-event.js';
import { ListEventsUseCase } from '../app/use-cases/events/list-events.js';
import { RsvpEventUseCase } from '../app/use-cases/events/rsvp-event.js';
import { GenerateEventIcsUseCase } from '../app/use-cases/events/generate-event-ics.js';
import { GetDevotionPracticesUseCase } from '../app/use-cases/devotion/get-practices.js';
import { LogDevotionPracticeUseCase } from '../app/use-cases/devotion/log-practice.js';
import { GetDevotionSummaryUseCase } from '../app/use-cases/devotion/get-summary.js';
import { FollowUserUseCase } from '../app/use-cases/users/follow-user.js';
import { UnfollowUserUseCase } from '../app/use-cases/users/unfollow-user.js';

export type ServiceFactory<T> = (container: Container) => Promise<T> | T;

export interface Container {
  config: AppConfig;
  register: <T>(token: string, factory: ServiceFactory<T>) => void;
  resolve: <T>(token: string) => T;
  resolveAsync: <T>(token: string) => Promise<T>;
}

export interface ContainerOptions {
  config: AppConfig;
}

export async function createContainer({ config }: ContainerOptions): Promise<Container> {
  const registry = new Map<string, ServiceFactory<unknown>>();
  const cache = new Map<string, unknown>();

  const container: Container = {
    config,
    register: (token, factory) => {
      if (registry.has(token)) {
        throw new Error(`Service token already registered: ${token}`);
      }
      registry.set(token, factory);
    },
    resolve: <T>(token: string): T => {
      if (cache.has(token)) {
        return cache.get(token) as T;
      }
      const factory = registry.get(token);
      if (!factory) {
        throw new Error(`No provider registered for token: ${token}`);
      }
      const value = factory(container);
      if (value instanceof Promise) {
        throw new Error(`Provider for ${token} is async. Use resolveAsync instead.`);
      }
      cache.set(token, value);
      return value as T;
    },
    resolveAsync: async <T>(token: string): Promise<T> => {
      if (cache.has(token)) {
        return cache.get(token) as T;
      }
      const factory = registry.get(token);
      if (!factory) {
        throw new Error(`No provider registered for token: ${token}`);
      }
      const value = await factory(container as Container);
      cache.set(token, value);
      return value as T;
    }
  };

  // Register base services synchronously
  container.register('logger', () => logger);
  container.register('config', () => config);

  // Base infrastructure (in-memory defaults). Replace with actual persistence in production.
  if (config.supabaseUrl && config.supabaseServiceRoleKey) {
    logger.info('Using Supabase repositories');
  } else {
    logger.warn('Supabase configuration missing, using in-memory repositories');
  }

  const userRepository =
    config.supabaseUrl && config.supabaseServiceRoleKey
      ? new SupabaseUserRepository(config)
      : new InMemoryUserRepository();
  const postRepository =
    config.supabaseUrl && config.supabaseServiceRoleKey
      ? new SupabasePostRepository(config)
      : new InMemoryPostRepository();
  const aiOrchestrator = new InMemoryAiOrchestrator();
  const supabaseClient =
    config.supabaseUrl && config.supabaseServiceRoleKey
      ? getSupabaseClient(config)
      : undefined;
  const experienceSvc = new ExperienceService(supabaseClient);

  container.register('repo.user', () => userRepository);
  container.register('repo.post', () => postRepository);
  container.register('ai.orchestrator', () => aiOrchestrator);
  container.register('service.experience', () => experienceSvc);

  container.register('usecase.user.register', () => new RegisterUserUseCase(userRepository));
  container.register(
    'usecase.post.create',
    () => new CreatePostUseCase(postRepository, aiOrchestrator),
  );
  container.register('usecase.post.listUser', () => new ListUserPostsUseCase(postRepository));
  container.register(
    'usecase.post.listFeed',
    () => new ListFeedUseCase(postRepository, aiOrchestrator),
  );
  container.register('usecase.ai.askAgent', () => new AskAgentUseCase(aiOrchestrator));
  container.register(
    'usecase.user.listSuggested',
    () => new ListSuggestedConnectionsUseCase(experienceSvc)
  );
  container.register('usecase.user.follow', () => new FollowUserUseCase(experienceSvc));
  container.register('usecase.user.unfollow', () => new UnfollowUserUseCase(experienceSvc));
  container.register(
    'usecase.post.listTrending',
    () => new ListTrendingTopicsUseCase(experienceSvc)
  );
  container.register('usecase.post.generateUploadUrl', () => new GenerateMediaUploadUrlUseCase());
  container.register(
    'usecase.reading.getDaily',
    () => new GetDailyReadingUseCase(experienceSvc)
  );
  container.register(
    'usecase.reading.complete',
    () => new MarkReadingCompleteUseCase(experienceSvc)
  );
  container.register(
    'usecase.community.listMembers',
    () => new ListCommunityMembersUseCase(experienceSvc)
  );
  container.register(
    'usecase.event.create',
    () => new CreateEventUseCase(experienceSvc)
  );
  container.register(
    'usecase.event.list',
    () => new ListEventsUseCase(experienceSvc)
  );
  container.register(
    'usecase.event.rsvp',
    () => new RsvpEventUseCase(experienceSvc)
  );
  container.register(
    'usecase.event.generateIcs',
    () => new GenerateEventIcsUseCase(experienceSvc)
  );
  container.register(
    'usecase.devotion.listPractices',
    () => new GetDevotionPracticesUseCase(experienceSvc)
  );
  container.register(
    'usecase.devotion.logPractice',
    () => new LogDevotionPracticeUseCase(experienceSvc)
  );
  container.register(
    'usecase.devotion.getSummary',
    () => new GetDevotionSummaryUseCase(experienceSvc)
  );

  // Placeholder providers (database, cache, vector store) to be overridden later
  container.register('db.connection', () => {
    throw new Error('Database connection not configured yet');
  });

  container.register('cache.client', () => {
    throw new Error('Cache client not configured yet');
  });

  container.register('vector.client', () => {
    throw new Error('Vector DB client not configured yet');
  });

  return container;
}
