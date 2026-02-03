export interface Env {
  GITHUB_APP_ID: string;
  GITHUB_APP_PRIVATE_KEY: string;
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
  GITHUB_WEBHOOK_SECRET: string;
  OPENROUTER_API_KEY: string;
}

export interface GitHubInstallation {
  id: number;
  account: {
    login: string;
    type: string;
  };
  repositories?: Array<{
    id: number;
    name: string;
    full_name: string;
  }>;
}

export interface WebhookEvent {
  action: string;
  installation: GitHubInstallation;
  repositories?: Array<{
    id: number;
    name: string;
    full_name: string;
  }>;
}
