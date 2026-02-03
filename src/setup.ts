import { Octokit } from '@octokit/rest';
import { createAppAuth } from '@octokit/auth-app';

/**
 * GitHub App Manifest for registration
 */
const GITHUB_APP_MANIFEST = {
  name: 'OffloadWorkBot',
  url: 'https://openclaw-app.offloadmy.work',
  description: 'AI-powered GitHub automation for the offloadmywork org',
  hook_attributes: {
    url: 'https://openclaw-app.offloadmy.work/webhook',
    active: true,
  },
  redirect_url: 'https://openclaw-app.offloadmy.work/setup/callback',
  callback_urls: ['https://openclaw-app.offloadmy.work/auth/callback'],
  setup_url: 'https://openclaw-app.offloadmy.work/setup/complete',
  public: false,
  default_permissions: {
    contents: 'write',
    issues: 'write',
    pull_requests: 'write',
    actions: 'write',
    metadata: 'read',
    workflows: 'write',
  },
  default_events: [
    'installation',
    'installation_repositories',
    'issues',
    'issue_comment',
    'pull_request',
    'pull_request_review_comment',
  ],
};

/**
 * Handle GET /setup - Show GitHub App registration form
 */
export function handleSetup(): Response {
  const manifestJson = JSON.stringify(GITHUB_APP_MANIFEST, null, 2);
  const manifestEscaped = manifestJson.replace(/"/g, '&quot;');

  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Register OpenClaw GitHub App</title>
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
      max-width: 700px;
      width: 100%;
    }
    h1 {
      color: #333;
      margin-bottom: 1rem;
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .logo {
      font-size: 3rem;
    }
    p {
      color: #666;
      line-height: 1.6;
      margin-bottom: 2rem;
    }
    .manifest-preview {
      background: #f5f5f5;
      padding: 1.5rem;
      border-radius: 0.5rem;
      margin-bottom: 2rem;
      max-height: 300px;
      overflow-y: auto;
    }
    .manifest-preview pre {
      margin: 0;
      font-size: 0.875rem;
      color: #333;
    }
    .manifest-preview h3 {
      margin-top: 0;
      margin-bottom: 1rem;
      color: #333;
    }
    button {
      background: #667eea;
      color: white;
      border: none;
      padding: 1rem 2rem;
      font-size: 1.125rem;
      border-radius: 0.5rem;
      cursor: pointer;
      width: 100%;
      font-weight: 600;
      transition: background 0.2s;
    }
    button:hover {
      background: #5568d3;
    }
    .info {
      background: #e3f2fd;
      border-left: 4px solid #2196f3;
      padding: 1rem;
      margin-bottom: 2rem;
      border-radius: 0.25rem;
    }
    .info p {
      margin: 0;
      color: #1976d2;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>
      <span class="logo">🦾</span>
      Register OpenClaw GitHub App
    </h1>
    
    <p>
      This will register the OffloadWorkBot GitHub App with the <strong>offloadmywork</strong> organization.
      After clicking the button, you'll be redirected to GitHub to complete the registration.
    </p>

    <div class="info">
      <p>
        <strong>Note:</strong> The app will be created with write permissions to contents, issues, pull requests, workflows, and actions.
      </p>
    </div>

    <div class="manifest-preview">
      <h3>App Manifest Preview:</h3>
      <pre>${manifestJson}</pre>
    </div>

    <form action="https://github.com/organizations/offloadmywork/settings/apps/new" method="post">
      <input type="hidden" name="manifest" value="${manifestEscaped}">
      <button type="submit">🚀 Click to Register OpenClaw</button>
    </form>
  </div>
</body>
</html>
  `.trim();

  return new Response(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html' },
  });
}

/**
 * Handle GET /setup/callback - Receive code from GitHub after app creation
 */
export async function handleSetupCallback(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');

  if (!code) {
    return new Response('Missing code parameter', { status: 400 });
  }

  try {
    // Exchange the code for app credentials
    const response = await fetch(`https://api.github.com/app-manifests/${code}/conversions`, {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.github+json',
        'User-Agent': 'OpenClaw-Worker',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('GitHub API error:', errorText);
      return new Response(`GitHub API error: ${response.statusText}`, { status: response.status });
    }

    const data = await response.json() as {
      id: number;
      client_id: string;
      client_secret: string;
      webhook_secret: string;
      pem: string;
    };

    // Display the credentials on a success page
    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>OpenClaw App Registered Successfully</title>
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
      max-width: 800px;
      width: 100%;
    }
    h1 {
      color: #333;
      margin-bottom: 1rem;
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .success-icon {
      font-size: 3rem;
    }
    .success-message {
      background: #e8f5e9;
      border-left: 4px solid #4caf50;
      padding: 1rem;
      margin-bottom: 2rem;
      border-radius: 0.25rem;
    }
    .success-message p {
      margin: 0;
      color: #2e7d32;
      font-weight: 500;
    }
    .credentials {
      background: #f5f5f5;
      padding: 1.5rem;
      border-radius: 0.5rem;
      margin-bottom: 2rem;
    }
    .credentials h3 {
      margin-top: 0;
      color: #333;
    }
    .credential-item {
      margin-bottom: 1.5rem;
    }
    .credential-item:last-child {
      margin-bottom: 0;
    }
    .credential-label {
      font-weight: 600;
      color: #666;
      margin-bottom: 0.5rem;
      font-size: 0.875rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .credential-value {
      background: white;
      border: 1px solid #ddd;
      padding: 0.75rem;
      border-radius: 0.25rem;
      font-family: monospace;
      font-size: 0.875rem;
      color: #333;
      word-break: break-all;
      white-space: pre-wrap;
      max-height: 150px;
      overflow-y: auto;
    }
    .next-steps {
      border-top: 2px solid #eee;
      padding-top: 2rem;
      margin-top: 2rem;
    }
    .next-steps h3 {
      color: #333;
      margin-bottom: 1rem;
    }
    .next-steps ol {
      color: #666;
      line-height: 1.8;
    }
    .next-steps code {
      background: #f5f5f5;
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
      font-size: 0.875rem;
    }
    .warning {
      background: #fff3e0;
      border-left: 4px solid #ff9800;
      padding: 1rem;
      margin-bottom: 2rem;
      border-radius: 0.25rem;
    }
    .warning p {
      margin: 0;
      color: #e65100;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>
      <span class="success-icon">✅</span>
      App Registered Successfully!
    </h1>

    <div class="success-message">
      <p>OffloadWorkBot has been created in the offloadmywork organization.</p>
    </div>

    <div class="warning">
      <p><strong>⚠️ Important:</strong> Save these credentials securely. You won't be able to see the private key again!</p>
    </div>

    <div class="credentials">
      <h3>App Credentials:</h3>
      
      <div class="credential-item">
        <div class="credential-label">App ID</div>
        <div class="credential-value">${data.id}</div>
      </div>

      <div class="credential-item">
        <div class="credential-label">Client ID</div>
        <div class="credential-value">${data.client_id}</div>
      </div>

      <div class="credential-item">
        <div class="credential-label">Client Secret</div>
        <div class="credential-value">${data.client_secret}</div>
      </div>

      <div class="credential-item">
        <div class="credential-label">Webhook Secret</div>
        <div class="credential-value">${data.webhook_secret}</div>
      </div>

      <div class="credential-item">
        <div class="credential-label">Private Key (PEM)</div>
        <div class="credential-value">${data.pem}</div>
      </div>
    </div>

    <div class="next-steps">
      <h3>Next Steps:</h3>
      <ol>
        <li>Copy all credentials above and save them securely</li>
        <li>Add these to your Cloudflare Worker secrets:
          <ul>
            <li><code>wrangler secret put GITHUB_APP_ID</code></li>
            <li><code>wrangler secret put GITHUB_CLIENT_ID</code></li>
            <li><code>wrangler secret put GITHUB_CLIENT_SECRET</code></li>
            <li><code>wrangler secret put GITHUB_WEBHOOK_SECRET</code></li>
            <li><code>wrangler secret put GITHUB_APP_PRIVATE_KEY</code> (paste the entire PEM)</li>
          </ul>
        </li>
        <li>Install the app to repositories in your organization</li>
        <li>Test the webhook by creating an issue or PR</li>
      </ol>
    </div>
  </div>
</body>
</html>
    `.trim();

    return new Response(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html' },
    });
  } catch (error) {
    console.error('Setup callback error:', error);
    return new Response(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`, {
      status: 500,
    });
  }
}

/**
 * Auto-setup logic for newly installed GitHub App
 * Creates workflow file and sets repository secret
 */
export async function setupRepository(
  installationId: number,
  owner: string,
  repo: string,
  appId: string,
  privateKey: string
): Promise<void> {
  // Create authenticated Octokit instance for the installation
  const octokit = new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId,
      privateKey,
      installationId,
    },
  });

  console.log(`Setting up repository: ${owner}/${repo}`);

  // 1. Create .github/workflows/openclaw.yml
  const workflowContent = createWorkflowYaml();
  
  try {
    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: '.github/workflows/openclaw.yml',
      message: 'Add OpenClaw workflow',
      content: Buffer.from(workflowContent).toString('base64'),
      branch: 'main',
    });
    console.log(`Created workflow file in ${owner}/${repo}`);
  } catch (error: any) {
    if (error.status === 422) {
      // File already exists, try to update it
      const { data: existingFile } = await octokit.repos.getContent({
        owner,
        repo,
        path: '.github/workflows/openclaw.yml',
      });
      
      if ('sha' in existingFile) {
        await octokit.repos.createOrUpdateFileContents({
          owner,
          repo,
          path: '.github/workflows/openclaw.yml',
          message: 'Update OpenClaw workflow',
          content: Buffer.from(workflowContent).toString('base64'),
          sha: existingFile.sha,
          branch: 'main',
        });
        console.log(`Updated workflow file in ${owner}/${repo}`);
      }
    } else {
      throw error;
    }
  }

  // 2. Set OPENCLAW_API_KEY as repository secret
  await setRepositorySecret(
    octokit,
    owner,
    repo,
    'OPENCLAW_API_KEY',
    'placeholder_key_change_me'
  );

  console.log(`Setup complete for ${owner}/${repo}`);
}

/**
 * Create the OpenClaw workflow YAML content
 */
function createWorkflowYaml(): string {
  return `name: OpenClaw

on:
  issues:
    types: [opened, edited]
  issue_comment:
    types: [created]
  pull_request:
    types: [opened, edited, synchronize]

jobs:
  openclaw:
    runs-on: ubuntu-latest
    steps:
      - name: OpenClaw Handler
        uses: actions/github-script@v7
        with:
          github-token: \${{ secrets.GITHUB_TOKEN }}
          script: |
            // Forward event to OpenClaw API
            const response = await fetch('https://api.openclaw.com/github/event', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer \${{ secrets.OPENCLAW_API_KEY }}'
              },
              body: JSON.stringify(context)
            });
            
            if (!response.ok) {
              core.setFailed(\`OpenClaw API error: \${response.statusText}\`);
            }
`;
}

/**
 * Set a repository secret using GitHub's API
 * Requires encrypting the secret with the repo's public key
 */
async function setRepositorySecret(
  octokit: Octokit,
  owner: string,
  repo: string,
  secretName: string,
  secretValue: string
): Promise<void> {
  // Get the repository public key for encrypting secrets
  const { data: publicKey } = await octokit.actions.getRepoPublicKey({
    owner,
    repo,
  });

  // Encrypt the secret using libsodium (via Web Crypto API workaround)
  const encryptedValue = await encryptSecret(secretValue, publicKey.key);

  // Create or update the secret
  await octokit.actions.createOrUpdateRepoSecret({
    owner,
    repo,
    secret_name: secretName,
    encrypted_value: encryptedValue,
    key_id: publicKey.key_id,
  });

  console.log(`Set secret ${secretName} in ${owner}/${repo}`);
}

/**
 * Encrypt a secret using the repository's public key
 * Uses libsodium-style encryption compatible with GitHub's API
 */
async function encryptSecret(secret: string, publicKey: string): Promise<string> {
  // Import libsodium-wrappers for encryption
  // Note: In production, this should use @octokit/auth-app's built-in encryption
  // For now, we return a base64-encoded placeholder
  // TODO: Implement proper libsodium encryption or use @octokit/plugin-create-or-update-text-file
  
  // Workaround: Return base64 encoded secret (NOT SECURE - for demo only)
  // In production, use proper libsodium encryption with the public key
  console.warn('Using placeholder encryption - implement proper libsodium encryption in production');
  return Buffer.from(secret).toString('base64');
}
