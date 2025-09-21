import Fastify, { type FastifyInstance } from 'fastify';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';

import type { AppConfig } from '../shared/config.js';
import type { Container } from '../shared/container.js';
import { registerRoutes } from './routes/index.js';

export interface ServerDependencies {
  container: Container;
  config: AppConfig;
}

export async function createServer({ container, config }: ServerDependencies): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: config.logLevel
    }
  });

  // Decorate fastify instance with container so handlers can resolve dependencies
  app.decorate('container', container);

  await app.register(helmet);
  await app.register(cors, {
    origin: true,
    credentials: true
  });

  await app.register(rateLimit, {
    max: 120,
    timeWindow: '1 minute'
  });

  await app.register(swagger, {
    openapi: {
      info: {
        title: 'Sanaathan API',
        version: '0.1.0'
      }
    }
  });

  await app.register(swaggerUi, {
    routePrefix: '/docs'
  });

  app.addHook('onRequest', async (request) => {
    request.container = app.container;
  });

  await registerRoutes(app);

  app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  return app;
}

declare module 'fastify' {
  interface FastifyInstance {
    container: Container;
  }

  interface FastifyRequest {
    container: Container;
  }
}
