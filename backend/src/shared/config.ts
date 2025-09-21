import { z } from 'zod';

const ConfigSchema = z.object({
  nodeEnv: z.enum(['development', 'test', 'production']).default('development'),
  port: z.coerce.number().default(4000),
  host: z.string().default('0.0.0.0'),
  logLevel: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  jwtSecret: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  postgresUrl: z.string().url().optional(),
  redisUrl: z.string().url().optional(),
  vectorDbUrl: z.string().optional(),
  openAiApiKey: z.string().optional(),
  anthropicApiKey: z.string().optional(),
  supabaseUrl: z.string().url().optional(),
  supabaseServiceRoleKey: z.string().optional(),
  postMediaBucket: z.string().default('post-media')
});

export type AppConfig = z.infer<typeof ConfigSchema>;

export function loadConfig(): AppConfig {
  console.log('Loading config');
  const parsed = ConfigSchema.safeParse({
    nodeEnv: process.env.NODE_ENV,
    port: process.env.PORT,
    host: process.env.API_HOST,
    logLevel: process.env.LOG_LEVEL,
    jwtSecret: process.env.JWT_SECRET,
    postgresUrl: process.env.POSTGRES_URL,
    redisUrl: process.env.REDIS_URL,
    vectorDbUrl: process.env.VECTOR_DB_URL,
    openAiApiKey: process.env.OPENAI_API_KEY,
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    postMediaBucket: process.env.POST_MEDIA_BUCKET
  });

  if (!parsed.success) {
    console.error('Config validation errors', parsed.error.format());
    const flatErrors = parsed.error.flatten().fieldErrors;
    const message = Object.entries(flatErrors)
      .map(([key, val]) => `${key}: ${val?.join(', ')}`)
      .join('\n');
    throw new Error(`Configuration validation failed:\n${message}`);
  }

  return parsed.data;
}
