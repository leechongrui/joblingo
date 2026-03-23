import { z } from "zod";
import { cacheDeck, getCachedDeck } from "./cache.js";
import { generateDeckWithGemini } from "./gemini.js";
import { persistDeck } from "./supabase.js";
import { makeDeckCacheKey } from "../utils/hash.js";
import type { GenerateDeckInput, InterviewDeck } from "../types/deck.js";
import type { GenerationSource } from "./gemini.js";

export const GenerateDeckInputSchema = z.object({
  companyName: z.string().trim().min(2, "Company name is required."),
  roleTitle: z.string().trim().min(2, "Role title is required."),
  jobDescription: z
    .string()
    .trim()
    .min(30, "Job description is too short. Please paste at least 30 characters."),
  resume: z.string().trim().optional(),
  skipCache: z.boolean().optional().default(false)
});

export interface GenerateDeckDebug {
  requestId: string;
  cacheHit: boolean;
  generationSource: GenerationSource | "cache";
  geminiCallSucceeded: boolean;
  persisted: boolean;
  elapsedMs: number;
}

export const generateDeck = async (
  input: GenerateDeckInput,
  userId: string,
  requestId: string
): Promise<{ deck: InterviewDeck; debug: GenerateDeckDebug }> => {
  const startedAt = Date.now();
  const cacheKey = makeDeckCacheKey({
    userId,
    companyName: input.companyName.trim(),
    roleTitle: input.roleTitle.trim(),
    jobDescription: input.jobDescription.trim(),
    resume: input.resume?.trim() ?? ""
  });
  const skipCache = Boolean(input.skipCache);

  console.info("[deckService] generation requested", {
    requestId,
    userId,
    cacheKey,
    companyName: input.companyName,
    roleTitle: input.roleTitle
  });

  if (!skipCache) {
    const cachedDeck = await getCachedDeck(cacheKey);
    if (cachedDeck) {
      console.info("[deckService] cache hit", {
        requestId,
        cacheKey,
        elapsedMs: Date.now() - startedAt
      });
      return {
        deck: cachedDeck,
        debug: {
          requestId,
          cacheHit: true,
          generationSource: "cache",
          geminiCallSucceeded: false,
          persisted: false,
          elapsedMs: Date.now() - startedAt
        }
      };
    }
  } else {
    console.info("[deckService] cache bypass requested", { requestId, cacheKey });
  }

  console.info("[deckService] cache miss", { requestId, cacheKey });

  const { deck, source } = await generateDeckWithGemini(input, requestId);
  if (!skipCache) {
    await cacheDeck(cacheKey, deck);
    console.info("[deckService] cache write completed", {
      requestId,
      cacheKey,
      cardCount: deck.cardCount
    });
  }

  let persisted = false;
  try {
    await persistDeck(deck, userId);
    persisted = true;
    console.info("[deckService] persistence completed", {
      requestId,
      deckId: deck.id,
      cardCount: deck.cardCount
    });
  } catch (error) {
    const normalizedError =
      error instanceof Error
        ? { name: error.name, message: error.message }
        : { raw: error };

    console.error("[deckService] persistence failed, returning generated deck", {
      requestId,
      deckId: deck.id,
      cardCount: deck.cardCount,
      error: normalizedError
    });
  }

  return {
    deck,
    debug: {
      requestId,
      cacheHit: false,
      generationSource: source,
      geminiCallSucceeded: source === "gemini",
      persisted,
      elapsedMs: Date.now() - startedAt
    }
  };
};
