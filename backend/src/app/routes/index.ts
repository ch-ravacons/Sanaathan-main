import type { FastifyInstance } from 'fastify';

import { registerAuthRoutes } from '../../interfaces/http/auth.routes.js';
import { registerPostRoutes } from '../../interfaces/http/post.routes.js';
import { registerAiRoutes } from '../../interfaces/http/ai.routes.js';

export async function registerRoutes(app: FastifyInstance) {
  await app.register(registerAuthRoutes, { prefix: '/api/v1/auth' });
  await app.register(registerPostRoutes, { prefix: '/api/v1/posts' });
  await app.register(registerAiRoutes, { prefix: '/api/v1/ai' });
}
