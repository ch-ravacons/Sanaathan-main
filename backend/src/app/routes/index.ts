import type { FastifyInstance } from 'fastify';

import { registerAuthRoutes } from '../../interfaces/http/auth.routes.js';
import { registerPostRoutes } from '../../interfaces/http/post.routes.js';
import { registerAiRoutes } from '../../interfaces/http/ai.routes.js';
import { registerUserRoutes } from '../../interfaces/http/users.routes.js';
import { registerCommunityRoutes } from '../../interfaces/http/community.routes.js';
import { registerReadingRoutes } from '../../interfaces/http/readings.routes.js';
import { registerEventRoutes } from '../../interfaces/http/events.routes.js';
import { registerDevotionRoutes } from '../../interfaces/http/devotion.routes.js';

export async function registerRoutes(app: FastifyInstance) {
  await app.register(registerAuthRoutes, { prefix: '/api/v1/auth' });
  await app.register(registerPostRoutes, { prefix: '/api/v1/posts' });
  await app.register(registerAiRoutes, { prefix: '/api/v1/ai' });
  await app.register(registerUserRoutes, { prefix: '/api/v1/users' });
  await app.register(registerCommunityRoutes, { prefix: '/api/v1/community' });
  await app.register(registerReadingRoutes, { prefix: '/api/v1/readings' });
  await app.register(registerEventRoutes, { prefix: '/api/v1/events' });
  await app.register(registerDevotionRoutes, { prefix: '/api/v1/devotion' });
}
