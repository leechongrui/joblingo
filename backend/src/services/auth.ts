import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Request } from "express";
import { env } from "../config/env.js";
import { HttpError } from "../utils/httpError.js";

let authClient: SupabaseClient | null = null;

const getAuthClient = (): SupabaseClient => {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new HttpError(
      500,
      "Supabase auth is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  if (!authClient) {
    authClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  }

  return authClient;
};

export const getUserIdFromRequest = async (req: Request): Promise<string> => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    throw new HttpError(401, "Missing bearer token.");
  }

  const accessToken = authHeader.slice("Bearer ".length).trim();
  if (!accessToken) {
    throw new HttpError(401, "Invalid bearer token.");
  }

  const client = getAuthClient();
  const { data, error } = await client.auth.getUser(accessToken);

  if (error || !data.user) {
    throw new HttpError(401, "Unauthorized.");
  }

  return data.user.id;
};
