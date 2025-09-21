# Sanaathan Backend

Modular Fastify-based backend following clean architecture. Layers:

- **Domain** – entities and repository contracts.
- **Application** – use cases orchestrating domain logic.
- **Infrastructure** – adapters (persistence, AI orchestration) currently backed by in-memory implementations.
- **Interfaces** – HTTP routes and controllers.

## Getting Started

```bash
cd backend
npm install
npm run dev
```

Environment variables: copy `.env.example` to `.env` and update secrets.

- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` enable Supabase-backed repositories.
- Without those values the API falls back to in-memory stores (development only).

## Service Tokens

| Token | Description |
|-------|-------------|
| `repo.user` | User repository implementation |
| `repo.post` | Post repository |
| `ai.orchestrator` | Agentic RAG/KAG orchestrator |
| `usecase.*` | Application layer use cases |

Swap in production providers by overriding registrations inside `createContainer`.

## Extending AI capabilities

- Implement vector store client (Pinecone, Milvus, PostgreSQL pgvector) and wire into `RagPipeline`.
- Implement knowledge graph client (Neo4j, Neptune) for `KagPipeline` and replace the in-memory orchestrator.
- Add background workers consuming ingestion events to build embeddings and graph edges asynchronously.

## Next Steps

1. Connect to real Postgres using an ORM/Query builder (Drizzle/Prisma) and move repositories out of memory.
2. Implement JWT auth, RBAC, and integrate with Supabase or custom identity provider.
3. Introduce job queue (BullMQ/Celery) for moderation + AI ingestion pipelines.
4. Add OpenAPI schemas for each route and contract tests against clients.
5. Hook up observability (OpenTelemetry, Sentry) via Fastify plugins.
