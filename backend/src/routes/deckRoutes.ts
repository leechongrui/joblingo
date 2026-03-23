import { Router } from "express";
import { randomUUID } from "node:crypto";
import { getUserIdFromRequest } from "../services/auth.js";
import { generateDeck, GenerateDeckInputSchema } from "../services/deckService.js";
import { HttpError } from "../utils/httpError.js";

export const deckRoutes = Router();

deckRoutes.post("/generate-deck", async (req, res) => {
  const requestId = randomUUID();
  const startedAt = Date.now();
  const parsedInput = GenerateDeckInputSchema.safeParse(req.body);

  console.info("[POST /api/generate-deck] Incoming request", {
    requestId,
    hasAuthHeader: Boolean(req.headers.authorization),
    bodyKeys: Object.keys((req.body ?? {}) as Record<string, unknown>)
  });

  if (!parsedInput.success) {
    return res.status(400).json({
      message: "Invalid input",
      details: parsedInput.error.flatten()
    });
  }

  try {
    const userId = await getUserIdFromRequest(req);
    const { deck, debug } = await generateDeck(parsedInput.data, userId, requestId);

    console.info("[POST /api/generate-deck] Success", {
      requestId,
      elapsedMs: Date.now() - startedAt,
      deckId: deck.id,
      cardCount: deck.cardCount,
      debug
    });

    return res.status(200).json({ deck, debug });
  } catch (error) {
    const normalizedError =
      error instanceof Error
        ? { name: error.name, message: error.message, stack: error.stack }
        : error;

    console.error("[POST /api/generate-deck] Failed", {
      requestId,
      hasAuthHeader: Boolean(req.headers.authorization),
      bodyKeys: Object.keys((req.body ?? {}) as Record<string, unknown>),
      elapsedMs: Date.now() - startedAt,
      error: normalizedError
    });

    if (error instanceof HttpError) {
      return res.status(error.statusCode).json({ message: error.message });
    }

    const message =
      error instanceof Error ? error.message : "Unable to generate interview deck.";
    return res.status(500).json({ message });
  }
});
