import { Redis } from "ioredis";
import { env } from "../config/env.js";
import type { InterviewDeck } from "../types/deck.js";

const CACHE_TTL_SECONDS = 60 * 60 * 24;

let client: Redis | null = null;

const getClient = () => {
  if (!env.REDIS_URL) {
    return null;
  }

  if (!client) {
    client = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 1
    });
  }

  return client;
};

export const getCachedDeck = async (key: string): Promise<InterviewDeck | null> => {
  const redis = getClient();
  if (!redis) {
    return null;
  }

  const raw = await redis.get(key);
  if (!raw) {
    return null;
  }

  return JSON.parse(raw) as InterviewDeck;
};

export const cacheDeck = async (key: string, deck: InterviewDeck): Promise<void> => {
  const redis = getClient();
  if (!redis) {
    return;
  }

  await redis.set(key, JSON.stringify(deck), "EX", CACHE_TTL_SECONDS);
};
