import { Octokit } from '@octokit/rest';
import { createAppAuth } from '@octokit/auth-app';

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
