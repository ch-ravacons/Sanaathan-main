import 'dotenv/config';

import { createServer } from './app/server.js';
import { createContainer } from './shared/container.js';
import { loadConfig } from './shared/config.js';
import { logger } from './shared/logger.js';

async function bootstrap() {
  try {
    const config = loadConfig();
    const container = await createContainer({ config });
    const app = await createServer({ container, config });

    await app.listen({ port: config.port, host: config.host });
    logger.info({ port: config.port }, 'API server started');
  } catch (err) {
    logger.error({ err }, 'Failed to start API server');
    process.exit(1);
  }
}

bootstrap();
