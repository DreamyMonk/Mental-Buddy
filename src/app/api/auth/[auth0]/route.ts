// src/app/api/auth/[auth0]/route.ts
import { handleAuth } from '@auth0/nextjs-auth0';

// This single line sets up:
// /api/auth/login
// /api/auth/logout
// /api/auth/callback
// /api/auth/me
export const GET = handleAuth();