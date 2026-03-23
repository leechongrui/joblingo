import Constants from "expo-constants";
import type { GenerateDeckPayload, InterviewDeck } from "../types/deck";
import { supabase } from "./supabase";

const getDefaultApiBaseUrl = () => {
  const host = Constants.expoConfig?.hostUri?.split(":")[0];
  if (host) {
    return `http://${host}:4000/api`;
  }
  return "http://localhost:4000/api";
};

const configuredBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
const API_BASE_URL = configuredBaseUrl ? configuredBaseUrl : getDefaultApiBaseUrl();

type ApiErrorResponse = {
  message?: string;
  details?: {
    fieldErrors?: Record<string, string[] | undefined>;
  };
};

type GenerateDeckResponse = {
  deck: InterviewDeck;
  debug?: {
    requestId?: string;
    cacheHit?: boolean;
    generationSource?: string;
    geminiCallSucceeded?: boolean;
    persisted?: boolean;
    elapsedMs?: number;
  };
};

export const generateDeck = async (payload: GenerateDeckPayload): Promise<InterviewDeck> => {
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("Please sign in before generating a deck.");
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/generate-deck`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`
      },
      body: JSON.stringify(payload)
    });
  } catch (error) {
    console.error("[generateDeck] Network error", {
      apiBaseUrl: API_BASE_URL,
      hasToken: Boolean(session.access_token),
      companyLength: payload.companyName.length,
      roleLength: payload.roleTitle.length,
      jdLength: payload.jobDescription.length,
      resumeLength: payload.resume?.length ?? 0,
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }

  if (!response.ok) {
    let serverError: ApiErrorResponse | null = null;
    try {
      serverError = (await response.json()) as ApiErrorResponse;
    } catch {
      serverError = null;
    }

    console.error("[generateDeck] API error", {
      status: response.status,
      apiBaseUrl: API_BASE_URL,
      serverError
    });

    const fieldErrors = serverError?.details?.fieldErrors;
    if (serverError?.message === "Invalid input" && fieldErrors) {
      const firstError = Object.values(fieldErrors).find(
        (messages) => Array.isArray(messages) && messages.length > 0
      );
      if (firstError?.[0]) {
        throw new Error(firstError[0]);
      }
      throw new Error("Invalid input. Please check required fields.");
    }

    throw new Error(serverError?.message ?? "Deck generation failed.");
  }

  const data = (await response.json()) as GenerateDeckResponse;
  console.info("[generateDeck] API success", {
    apiBaseUrl: API_BASE_URL,
    debug: data.debug
  });
  return data.deck;
};
