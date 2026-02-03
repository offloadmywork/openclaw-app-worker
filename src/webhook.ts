import { Webhooks } from '@octokit/webhooks';
import { Env, WebhookEvent } from './types';
import { setupRepository } from './setup';

/**
 * Handle incoming GitHub webhook events
 */
export async function handleWebhook(
  request: Request,
  env: Env
): Promise<Response> {
  // Verify webhook signature
  const signature = request.headers.get('x-hub-signature-256');
  if (!signature) {
    return new Response('Missing signature', { status: 401 });
  }

  const body = await request.text();
  
  const webhooks = new Webhooks({
    secret: env.GITHUB_WEBHOOK_SECRET,
  });

  // Verify the webhook signature
  const isValid = await webhooks.verify(body, signature);
  if (!isValid) {
    return new Response('Invalid signature', { status: 401 });
  }

  // Parse the event
  const event = request.headers.get('x-github-event');
  const payload = JSON.parse(body);

  console.log(`Received webhook: ${event}`, payload.action);

  // Handle installation events
  if (event === 'installation' && payload.action === 'created') {
    await handleInstallationCreated(payload, env);
  } else if (event === 'installation_repositories' && payload.action === 'added') {
    await handleRepositoriesAdded(payload, env);
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Handle installation.created event
 * Auto-setup all repositories in the installation
 */
async function handleInstallationCreated(
  payload: WebhookEvent,
  env: Env
): Promise<void> {
  const { installation, repositories } = payload;
  
  console.log(`Installation created: ${installation.id} by ${installation.account.login}`);

  // Get the list of repositories (either from event or fetch from API)
  const repos = repositories || [];

  // Setup each repository
  for (const repo of repos) {
    const [owner, repoName] = repo.full_name.split('/');
    
    try {
      await setupRepository(
        installation.id,
        owner,
        repoName,
        env.GITHUB_APP_ID,
        env.GITHUB_APP_PRIVATE_KEY
      );
    } catch (error) {
      console.error(`Failed to setup ${repo.full_name}:`, error);
      // Continue with other repos even if one fails
    }
  }
}

/**
 * Handle installation_repositories.added event
 * Auto-setup newly added repositories
 */
async function handleRepositoriesAdded(
  payload: any,
  env: Env
): Promise<void> {
  const { installation, repositories_added } = payload;
  
  console.log(`Repositories added to installation ${installation.id}`);

  for (const repo of repositories_added) {
    const [owner, repoName] = repo.full_name.split('/');
    
    try {
      await setupRepository(
        installation.id,
        owner,
        repoName,
        env.GITHUB_APP_ID,
        env.GITHUB_APP_PRIVATE_KEY
      );
    } catch (error) {
      console.error(`Failed to setup ${repo.full_name}:`, error);
    }
  }
}
