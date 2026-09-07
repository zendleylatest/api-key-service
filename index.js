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

function sendHtml(response, statusCode, body) {
  response.writeHead(statusCode, {
    'Content-Type': 'text/html; charset=utf-8',
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

  if (request.method === 'GET' && requestUrl.pathname === '/') {
    sendHtml(response, 200, `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>OpenAI API Key Service</title>
  <style>
    :root { color-scheme: dark; font-family: Inter, system-ui, sans-serif; }
    * { box-sizing: border-box; }
    body { min-height: 100vh; margin: 0; display: grid; place-items: center; padding: 24px; background: radial-gradient(circle at top, #17354d, #08111c 55%); color: #eaf2f8; }
    main { width: min(620px, 100%); padding: 40px; border: 1px solid #29445a; border-radius: 20px; background: rgba(12, 27, 40, .9); box-shadow: 0 24px 70px rgba(0, 0, 0, .35); }
    .status { display: flex; align-items: center; gap: 10px; color: #73e6a5; font-weight: 700; }
    .dot { width: 10px; height: 10px; border-radius: 50%; background: #42d985; box-shadow: 0 0 14px #42d985; }
    h1 { margin: 18px 0 10px; font-size: clamp(2rem, 6vw, 3rem); line-height: 1.05; }
    p { color: #aebfcd; line-height: 1.65; }
    ul { margin: 24px 0 0; padding: 0; list-style: none; display: grid; gap: 10px; }
    li { padding: 13px 15px; border-radius: 10px; background: #11283a; color: #c9d8e3; }
    code { color: #80d7ff; }
  </style>
</head>
<body>
  <main>
    <div class="status"><span class="dot"></span>Service online</div>
    <h1>OpenAI API Key Service</h1>
    <p>The server is running and ready to accept requests.</p>
    <ul>
      <li><code>GET /health</code> — Check service health</li>
      <li><code>GET /api-key</code> — Retrieve the current key</li>
      <li><code>POST /api-key</code> — Update the key with admin authorization</li>
    </ul>
  </main>
</body>
</html>`);
    return;
  }

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
