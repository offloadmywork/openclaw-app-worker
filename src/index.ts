import { Env } from './types';
import { handleWebhook } from './webhook';
import { handleOAuthCallback } from './oauth';
import { handleSetup, handleSetupCallback } from './setup';

/**
 * Main Cloudflare Worker entry point
 */
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // Add CORS headers for preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST',
          'Access-Control-Allow-Headers': 'Content-Type, X-GitHub-Event, X-Hub-Signature-256',
        },
      });
    }

    try {
      // Route handling
      if (path === '/webhook' && request.method === 'POST') {
        return await handleWebhook(request, env);
      } else if (path === '/auth/callback' && request.method === 'GET') {
        return await handleOAuthCallback(request, env);
      } else if (path === '/setup' && request.method === 'GET') {
        return handleSetup();
      } else if (path === '/setup/callback' && request.method === 'GET') {
        return await handleSetupCallback(request);
      } else if (path === '/health' && request.method === 'GET') {
        return new Response(JSON.stringify({ status: 'ok', timestamp: Date.now() }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      } else if (path === '/' && request.method === 'GET') {
        return new Response(createHomePage(), {
          status: 200,
          headers: { 'Content-Type': 'text/html' },
        });
      } else {
        return new Response('Not Found', { status: 404 });
      }
    } catch (error) {
      console.error('Worker error:', error);
      return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  },
};

/**
 * Create home page HTML
 */
function createHomePage(): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <title>OpenClaw GitHub App</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 2rem;
    }
    .container {
      background: white;
      padding: 3rem;
      border-radius: 1rem;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      text-align: center;
      max-width: 600px;
      width: 100%;
    }
    h1 {
      color: #333;
      margin-bottom: 1rem;
    }
    .logo {
      font-size: 4rem;
      margin-bottom: 1rem;
    }
    p {
      color: #666;
      line-height: 1.6;
      margin-bottom: 2rem;
    }
    .cta {
      background: #667eea;
      color: white;
      text-decoration: none;
      padding: 1rem 2rem;
      border-radius: 0.5rem;
      display: inline-block;
      font-weight: 600;
      margin-bottom: 2rem;
      transition: background 0.2s;
    }
    .cta:hover {
      background: #5568d3;
    }
    .endpoints {
      background: #f5f5f5;
      padding: 1.5rem;
      border-radius: 0.5rem;
      text-align: left;
      margin-top: 2rem;
    }
    .endpoints h3 {
      margin-top: 0;
      color: #333;
    }
    .endpoint {
      margin: 0.5rem 0;
      font-family: monospace;
      color: #667eea;
    }
    .method {
      display: inline-block;
      width: 60px;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">🦾</div>
    <h1>OpenClaw GitHub App Worker</h1>
    <p>
      This Cloudflare Worker handles GitHub App webhooks and OAuth flows for OpenClaw.
      It automatically sets up repositories with workflows and secrets when installed.
    </p>
    
    <a href="/setup" class="cta">🚀 Register GitHub App</a>
    
    <div class="endpoints">
      <h3>Available Endpoints:</h3>
      <div class="endpoint">
        <span class="method">GET</span> /setup - App registration wizard
      </div>
      <div class="endpoint">
        <span class="method">GET</span> /setup/callback - Registration callback
      </div>
      <div class="endpoint">
        <span class="method">POST</span> /webhook - GitHub webhook receiver
      </div>
      <div class="endpoint">
        <span class="method">GET</span> /auth/callback - OAuth callback handler
      </div>
      <div class="endpoint">
        <span class="method">GET</span> /health - Health check
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}
