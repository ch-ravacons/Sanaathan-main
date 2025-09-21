import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { z } from 'zod';

import type { GetDevotionPracticesUseCase } from '../../app/use-cases/devotion/get-practices.js';
import type { LogDevotionPracticeUseCase } from '../../app/use-cases/devotion/log-practice.js';
import type { GetDevotionSummaryUseCase } from '../../app/use-cases/devotion/get-summary.js';

const LogPracticeSchema = z.object({
  userId: z.string().uuid(),
  practiceId: z.string(),
  intensity: z.enum(['light', 'medium', 'intense']).optional(),
  notes: z.string().optional()
});

const SummaryQuerySchema = z.object({
  userId: z.string().uuid()
});

export async function registerDevotionRoutes(app: FastifyInstance, _opts: FastifyPluginOptions) {
  app.get('/practices', async () => {
    const usecase = app.container.resolve<GetDevotionPracticesUseCase>('usecase.devotion.listPractices');
    const { practices } = await usecase.execute();
    return { practices };
  });

  app.post('/log', async (request) => {
    const payload = LogPracticeSchema.parse(request.body);
    const usecase = app.container.resolve<LogDevotionPracticeUseCase>('usecase.devotion.logPractice');
    const { summary } = await usecase.execute(payload);
    return { summary };
  });

  app.get('/summary', async (request) => {
    const query = SummaryQuerySchema.parse(request.query);
    const usecase = app.container.resolve<GetDevotionSummaryUseCase>('usecase.devotion.getSummary');
    const { summary } = await usecase.execute(query);
    return { summary };
  });
}
