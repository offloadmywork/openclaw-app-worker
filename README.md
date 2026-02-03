# OpenClaw GitHub App Worker

Cloudflare Worker that handles GitHub App webhooks and OAuth flows for OpenClaw.

## Features

- **Automatic Setup**: When installed, automatically creates `.github/workflows/openclaw.yml` and sets `OPENCLAW_API_KEY` secret
- **Webhook Handling**: Receives GitHub events (installation, issues, PRs, comments)
- **OAuth Flow**: Handles GitHub OAuth callback for user authentication

## Endpoints

- `POST /webhook` - GitHub webhook receiver (verifies signature)
- `GET /auth/callback` - OAuth callback handler
- `GET /health` - Health check endpoint
- `GET /` - Home page with endpoint documentation

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Secrets

Set the following environment variables using Wrangler:

```bash
wrangler secret put GITHUB_APP_ID
wrangler secret put GITHUB_APP_PRIVATE_KEY
wrangler secret put GITHUB_CLIENT_ID
wrangler secret put GITHUB_CLIENT_SECRET
wrangler secret put GITHUB_WEBHOOK_SECRET
wrangler secret put OPENROUTER_API_KEY
```

### 3. Deploy

```bash
npm run deploy
```

## Development

```bash
npm run dev
```

## Project Structure

```
src/
├── index.ts      - Main router and entry point
├── webhook.ts    - GitHub webhook handler
├── oauth.ts      - OAuth flow handler
├── setup.ts      - Auto-setup logic (workflow + secret)
└── types.ts      - TypeScript types
```

## How It Works

### Installation Flow

1. User installs the GitHub App on their account/org
2. GitHub sends `installation.created` webhook to `/webhook`
3. Worker verifies webhook signature
4. For each repository:
   - Creates `.github/workflows/openclaw.yml` workflow file
   - Sets `OPENCLAW_API_KEY` as a repository secret
5. Repository is now ready to use OpenClaw

### Workflow File

The auto-created workflow listens for:
- Issue opens/edits
- Issue comments
- PR opens/edits/syncs

Events are forwarded to the OpenClaw API with authentication.

## Security Notes

- Webhook signatures are verified using `GITHUB_WEBHOOK_SECRET`
- Repository secrets use placeholder values initially (must be updated)
- Secret encryption currently uses a placeholder implementation (⚠️ TODO: implement proper libsodium encryption)

## TODO

- [ ] Implement proper libsodium encryption for repository secrets
- [ ] Add installation settings UI
- [ ] Support custom workflow templates
- [ ] Add logging/monitoring integration
- [ ] Handle repository removal events

## License

MIT
