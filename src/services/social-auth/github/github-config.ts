export const GITHUB_CLIENT_ID = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID ?? "";

export const isGitHubAuthEnabled = Boolean(GITHUB_CLIENT_ID);
