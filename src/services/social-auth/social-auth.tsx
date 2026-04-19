"use client";

import GoogleAuth from "./google/google-auth";
import GitHubAuth from "./github/github-auth";
import { isGoogleAuthEnabled } from "./google/google-config";
import { isGitHubAuthEnabled } from "./github/github-config";

export default function SocialAuth() {
  if (!isGoogleAuthEnabled && !isGitHubAuthEnabled) return null;

  return (
    <div className="flex flex-col gap-2">
      {isGoogleAuthEnabled && <GoogleAuth />}
      {isGitHubAuthEnabled && <GitHubAuth />}
    </div>
  );
}
