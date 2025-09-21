import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { z } from 'zod';

import type { GetDailyReadingUseCase } from '../../app/use-cases/readings/get-daily-reading.js';
import type { MarkReadingCompleteUseCase } from '../../app/use-cases/readings/mark-reading-complete.js';

const ReadingQuerySchema = z.object({
  path: z.string().min(2).optional()
});

const CompleteReadingSchema = z.object({
  userId: z.string().uuid()
});

export async function registerReadingRoutes(app: FastifyInstance, _opts: FastifyPluginOptions) {
  app.get('/today', async (request) => {
    const query = ReadingQuerySchema.parse(request.query);
    const usecase = app.container.resolve<GetDailyReadingUseCase>('usecase.reading.getDaily');
    const result = await usecase.execute({ path: query.path });
    return result;
  });

  app.post('/:readingId/complete', async (request, reply) => {
    const paramsSchema = z.object({ readingId: z.string() });
    const params = paramsSchema.parse(request.params);
    const body = CompleteReadingSchema.parse(request.body);
    const usecase = app.container.resolve<MarkReadingCompleteUseCase>('usecase.reading.complete');
    await usecase.execute({ readingId: params.readingId, userId: body.userId });
    reply.code(204).send();
  });
}
