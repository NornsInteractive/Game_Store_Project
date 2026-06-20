const { createServer } = require('http');
const handler = require('./app');

let server = null;

async function handleRequest(request) {
  if (!server) {
    const expressHandler = await handler;
    server = createServer(expressHandler);
  }

  const url = new URL(request.url);

  return new Promise(async (resolve) => {
    const headers = {};
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });

    const bodyBuffer = (request.method !== 'GET' && request.method !== 'HEAD')
      ? Buffer.from(await request.arrayBuffer())
      : null;

    const req = new (require('http').IncomingMessage)(require('net').Socket());
    req.method = request.method;
    req.url = url.pathname + url.search;
    req.headers = headers;
    req.connection = { remoteAddress: headers['cf-connecting-ip'] || '127.0.0.1', encrypted: true };
    req.socket = { remoteAddress: headers['cf-connecting-ip'] || '127.0.0.1', encrypted: true };

    if (bodyBuffer && bodyBuffer.length > 0) {
      req.push(bodyBuffer);
    }
    req.push(null);

    const http = require('http');
    const res = new http.ServerResponse(req);

    let statusCode = 200;
    const responseHeaders = {};
    const chunks = [];

    const origWriteHead = res.writeHead.bind(res);
    res.writeHead = function (code, reasonOrHeaders, hdrs) {
      statusCode = code;
      const h = typeof reasonOrHeaders === 'object' ? reasonOrHeaders : (hdrs || {});
      Object.entries(h).forEach(([k, v]) => { responseHeaders[k] = v; });
      return res;
    };

    const origSetHeader = res.setHeader.bind(res);
    res.setHeader = function (name, value) {
      responseHeaders[name] = value;
      try { origSetHeader(name, value); } catch (e) { /* ignore */ }
      return res;
    };

    res.getHeader = function (name) {
      return responseHeaders[name.toLowerCase()] || responseHeaders[name];
    };

    res.write = function (chunk) {
      if (chunk) chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
      return true;
    };

    res.end = function (chunk) {
      if (chunk) chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
      const body = Buffer.concat(chunks);
      const cfHeaders = new Headers();
      for (const [key, value] of Object.entries(responseHeaders)) {
        if (value != null) {
          cfHeaders.set(key, Array.isArray(value) ? value.join(', ') : String(value));
        }
      }
      resolve(new Response(body, { status: statusCode, headers: cfHeaders }));
    };

    const expressHandler = await handler;
    expressHandler(req, res);
  });
}

module.exports = {
  async fetch(request, env, ctx) {
    // Set CF_PAGES env var for auth blocking
    process.env.CF_PAGES = '1';
    process.env.NODE_ENV = process.env.NODE_ENV || 'production';

    return handleRequest(request);
  }
};
