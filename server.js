const http = require('node:http');

const port = Number(process.env.PORT) || 3000;
const adminToken = process.env.ADMIN_TOKEN;
let openAiApiKey = process.env.OPENAI_API_KEY || '';

function sendJson(response, statusCode, body) {
  const payload = JSON.stringify(body);
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(payload),
  });
  response.end(payload);
}

function sendText(response, statusCode, body) {
  response.writeHead(statusCode, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
  });
  response.end(body);
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = '';
    let bodySize = 0;

    request.setEncoding('utf8');
    request.on('data', (chunk) => {
      bodySize += Buffer.byteLength(chunk);
      if (bodySize > 1024 * 1024) {
        reject(new Error('Request body is too large'));
        request.destroy();
        return;
      }
      body += chunk;
    });
    request.on('end', () => resolve(body));
    request.on('error', reject);
  });
}

const server = http.createServer(async (request, response) => {
  const requestUrl = new URL(request.url, `http://${request.headers.host || 'localhost'}`);

  if (request.method === 'GET' && requestUrl.pathname === '/health') {
    sendJson(response, 200, { status: 'ok' });
    return;
  }

  if (request.method === 'GET' && requestUrl.pathname === '/api-key') {
    sendText(response, 200, openAiApiKey);
    return;
  }

  if (request.method === 'POST' && requestUrl.pathname === '/api-key') {
    if (!adminToken || request.headers.authorization !== `Bearer ${adminToken}`) {
      sendJson(response, 401, { error: 'Unauthorized' });
      return;
    }

    try {
      const body = JSON.parse(await readBody(request));
      if (typeof body.apiKey !== 'string' || body.apiKey.trim() === '') {
        sendJson(response, 400, { error: 'apiKey must be a non-empty string' });
        return;
      }

      openAiApiKey = body.apiKey.trim();
      sendJson(response, 200, { message: 'API key updated' });
    } catch (error) {
      sendJson(response, 400, {
        error: error.message === 'Request body is too large' ? error.message : 'Request body must be valid JSON',
      });
    }
    return;
  }

  sendJson(response, 404, { error: 'Not found' });
});

server.listen(port, () => {
  console.log(`OpenAI API key service listening on http://localhost:${port}`);
});
