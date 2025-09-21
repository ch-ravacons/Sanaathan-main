import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { z } from 'zod';

import type { CreateEventUseCase } from '../../app/use-cases/events/create-event.js';
import type { ListEventsUseCase } from '../../app/use-cases/events/list-events.js';
import type { RsvpEventUseCase } from '../../app/use-cases/events/rsvp-event.js';
import type { GenerateEventIcsUseCase } from '../../app/use-cases/events/generate-event-ics.js';

const CreateEventSchema = z.object({
  creatorId: z.string().uuid(),
  title: z.string().min(3),
  description: z.string().optional(),
  startAt: z.string(),
  endAt: z.string().optional(),
  location: z.string().optional(),
  tags: z.array(z.string()).optional(),
  capacity: z.number().int().positive().optional()
});

const ListEventsQuerySchema = z.object({
  interest: z.string().optional(),
  startAfter: z.string().optional(),
  userId: z.string().uuid().optional(),
  attending: z
    .union([z.string(), z.boolean()])
    .optional()
    .transform((value) => {
      if (typeof value === 'boolean') return value;
      if (typeof value === 'string') return value.toLowerCase() === 'true';
      return undefined;
    })
});

const RsvpSchema = z.object({
  userId: z.string().uuid(),
  status: z.enum(['going', 'interested', 'not_going'])
});

export async function registerEventRoutes(app: FastifyInstance, _opts: FastifyPluginOptions) {
  app.get('/', async (request) => {
    const query = ListEventsQuerySchema.parse(request.query);
    const usecase = app.container.resolve<ListEventsUseCase>('usecase.event.list');
    const { events } = await usecase.execute(query);
    return { events };
  });

  app.post('/', async (request, reply) => {
    const payload = CreateEventSchema.parse(request.body);
    const usecase = app.container.resolve<CreateEventUseCase>('usecase.event.create');
    const { event } = await usecase.execute(payload);
    reply.code(201).send({ event });
  });

  app.post('/:eventId/rsvp', async (request) => {
    const paramsSchema = z.object({ eventId: z.string() });
    const params = paramsSchema.parse(request.params);
    const body = RsvpSchema.parse(request.body);
    const usecase = app.container.resolve<RsvpEventUseCase>('usecase.event.rsvp');
    const { event } = await usecase.execute({ eventId: params.eventId, ...body });
    return { event };
  });

  app.get('/:eventId/ics', async (request, reply) => {
    const paramsSchema = z.object({ eventId: z.string() });
    const params = paramsSchema.parse(request.params);
    const usecase = app.container.resolve<GenerateEventIcsUseCase>('usecase.event.generateIcs');
    const ics = await usecase.execute({ eventId: params.eventId });
    reply
      .header('Content-Type', 'text/calendar')
      .header('Content-Disposition', `attachment; filename="event-${params.eventId}.ics"`)
      .send(ics);
  });
}
