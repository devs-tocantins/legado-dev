"use client";

import GoogleAuth from "./google/google-auth";
import { isGoogleAuthEnabled } from "./google/google-config";

export default function SocialAuth() {
  if (!isGoogleAuthEnabled) return null;

  return (
    <div className="flex flex-col gap-2">
      <GoogleAuth />
    </div>
  );
}
