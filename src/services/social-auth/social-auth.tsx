"use client";

import Grid from "@mui/material/Grid";
import GoogleAuth from "./google/google-auth";
import { isGoogleAuthEnabled } from "./google/google-config";

export default function SocialAuth() {
  return (
    <Grid container spacing={2}>
      {isGoogleAuthEnabled && (
        <Grid size={{ xs: 12 }}>
          <GoogleAuth />
        </Grid>
      )}
    </Grid>
  );
}
