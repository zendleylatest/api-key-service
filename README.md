# OpenAI API Key Service

A dependency-free Node.js backend that returns the current OpenAI API key as plain text and lets an authorized client replace it.

## Run

```sh
cp .env.example .env
# Set OPENAI_API_KEY and ADMIN_TOKEN in .env
npm start
```

Node.js 18 or newer is required. The service stores the updated value in memory, so it returns to `OPENAI_API_KEY` after a restart.

## API

Read the current key:

```sh
curl http://localhost:5980/api-key \
  -H 'Authorization: Bearer change-me'
```

Update the key:

```sh
curl -X POST http://localhost:5980/api-key \
  -H 'Authorization: Bearer change-me' \
  -H 'Content-Type: application/json' \
  -d '{"apiKey":"sk-new-value"}'
```

Health check:

```sh
curl http://localhost:5980/health
```

The API key is sensitive. Always use HTTPS in production and send the admin token in the `Authorization` header, never in the URL.
