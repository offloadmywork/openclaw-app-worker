import { Env } from './types';

/**
 * Handle OAuth callback from GitHub
 * Exchanges code for access token
 */
export async function handleOAuthCallback(
  request: Request,
  env: Env
): Promise<Response> {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');

  if (!code) {
    return new Response('Missing code parameter', { status: 400 });
  }

  console.log(`OAuth callback received, code: ${code.substring(0, 8)}...`);

  try {
    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: env.GITHUB_CLIENT_ID,
        client_secret: env.GITHUB_CLIENT_SECRET,
        code,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      console.error('OAuth error:', tokenData);
      return new Response(`OAuth error: ${tokenData.error_description}`, { status: 400 });
    }

    // Return success page
    return new Response(createSuccessPage(tokenData.access_token), {
      status: 200,
      headers: { 'Content-Type': 'text/html' },
    });
  } catch (error) {
    console.error('OAuth callback error:', error);
    return new Response('OAuth error', { status: 500 });
  }
}

/**
 * Create a success HTML page
 */
function createSuccessPage(accessToken: string): string {
  // Mask the token for display
  const maskedToken = accessToken.substring(0, 8) + '...' + accessToken.substring(accessToken.length - 4);
  
  return `
<!DOCTYPE html>
<html>
<head>
  <title>OpenClaw - Connected</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
    .container {
      background: white;
      padding: 3rem;
      border-radius: 1rem;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      text-align: center;
      max-width: 500px;
    }
    h1 {
      color: #333;
      margin-bottom: 1rem;
    }
    .success-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
    }
    p {
      color: #666;
      line-height: 1.6;
    }
    .token {
      background: #f5f5f5;
      padding: 1rem;
      border-radius: 0.5rem;
      margin: 1rem 0;
      font-family: monospace;
      word-break: break-all;
    }
    .close-button {
      margin-top: 2rem;
      padding: 0.75rem 2rem;
      background: #667eea;
      color: white;
      border: none;
      border-radius: 0.5rem;
      cursor: pointer;
      font-size: 1rem;
    }
    .close-button:hover {
      background: #5568d3;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="success-icon">✅</div>
    <h1>Successfully Connected!</h1>
    <p>Your GitHub account has been connected to OpenClaw.</p>
    <p>The app will now automatically set up workflows in your repositories.</p>
    <div class="token">Token: ${maskedToken}</div>
    <button class="close-button" onclick="window.close()">Close Window</button>
  </div>
</body>
</html>
  `.trim();
}
