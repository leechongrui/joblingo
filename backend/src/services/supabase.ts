import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "../config/env.js";
import type { InterviewDeck } from "../types/deck.js";

let supabase: SupabaseClient | null = null;

const getSupabase = () => {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }

  if (!supabase) {
    supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  }

  return supabase;
};

export const persistDeck = async (deck: InterviewDeck, userId: string): Promise<void> => {
  const db = getSupabase();
  if (!db) {
    return;
  }

  const { error: deckError } = await db.from("decks").upsert({
    id: deck.id,
    user_id: userId,
    title: deck.title,
    company_name: deck.companyName,
    role_title: deck.roleTitle,
    card_count: deck.cardCount,
    job_description_terms: deck.jobDescriptionTerms,
    resume_terms: deck.resumeTerms,
    created_at: deck.createdAt
  });

  if (deckError) {
    throw deckError;
  }

  const cardsPayload = deck.cards.map((card) => ({
    id: card.id,
    deck_id: deck.id,
    card_order: card.order,
    question_zh: card.questionZh,
    meaning_en: card.meaningEn,
    keywords: card.keywords,
    technical_terms: card.technicalTerms,
    answer_plan_en: card.answerPlanEn,
    answer_plan_zh: card.answerPlanZh,
    answer_framework_zh: card.answerFrameworkZh,
    status: card.status
  }));

  const { error: cardsError } = await db.from("cards").upsert(cardsPayload);
  if (cardsError) {
    throw cardsError;
  }
};
