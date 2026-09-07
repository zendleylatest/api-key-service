# OpenAI API Key Service

A dependency-free Node.js backend that returns the current OpenAI API key as plain text and lets an authorized client replace it.

## Run

```sh
cp .env.example .env
# Set OPENAI_API_KEY and ADMIN_TOKEN in .env
OPENAI_API_KEY=sk-example ADMIN_TOKEN=change-me npm start
```

Node.js 18 or newer is required. The service stores the updated value in memory, so it returns to `OPENAI_API_KEY` after a restart.

## API

Read the current key:

```sh
curl http://localhost:3000/api-key
```

Update the key:

```sh
curl -X POST http://localhost:3000/api-key \
  -H 'Authorization: Bearer change-me' \
  -H 'Content-Type: application/json' \
  -d '{"apiKey":"sk-new-value"}'
```

Health check:

```sh
curl http://localhost:3000/health
```

The API key is sensitive. Run this service behind HTTPS and keep `GET /api-key` accessible only to trusted clients.
