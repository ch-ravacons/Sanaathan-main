import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { z } from 'zod';

import type { RegisterUserUseCase } from '../../app/use-cases/auth/register-user.js';

const RegisterSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(1),
  spiritualName: z.string().min(2).nullable().optional()
});

export async function registerAuthRoutes(app: FastifyInstance, _opts: FastifyPluginOptions) {
  app.post('/', async (request, reply) => {
    const payload = RegisterSchema.parse(request.body);
    const usecase = app.container.resolve<RegisterUserUseCase>('usecase.user.register');
    const user = await usecase.execute({
      email: payload.email,
      fullName: payload.fullName,
      spiritualName: payload.spiritualName ?? null
    });

    reply.code(201).send({ user: user.toJSON() });
  });
}
