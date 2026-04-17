/**
 * Returns the GitHub avatar URL for a given GitHub username.
 * GitHub redirects /{username}.png to the CDN avatar — no API key needed.
 */
export function getGitHubAvatarUrl(githubUsername: string): string {
  return `https://github.com/${encodeURIComponent(githubUsername)}.png`;
}
