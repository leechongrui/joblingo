import AsyncStorage from "@react-native-async-storage/async-storage";
import type { InterviewDeck } from "../types/deck";

const SESSION_KEY = "joblingo:deck-session";
const MAX_DECKS = 8;

let currentDeck: InterviewDeck | null = null;
let decks: InterviewDeck[] = [];
let hydrated = false;

const persist = async () => {
  await AsyncStorage.setItem(
    SESSION_KEY,
    JSON.stringify({
      currentDeckId: currentDeck?.id ?? null,
      decks
    })
  );
};

export const hydrateDeckSession = async (): Promise<{
  decks: InterviewDeck[];
  currentDeck: InterviewDeck | null;
}> => {
  if (!hydrated) {
    const raw = await AsyncStorage.getItem(SESSION_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as {
        currentDeckId: string | null;
        decks: InterviewDeck[];
      };
      decks = parsed.decks ?? [];
      currentDeck = decks.find((entry) => entry.id === parsed.currentDeckId) ?? decks[0] ?? null;
    }
    hydrated = true;
  }

  return { decks, currentDeck };
};

export const addDeckToSession = async (deck: InterviewDeck) => {
  await hydrateDeckSession();
  decks = [deck, ...decks.filter((entry) => entry.id !== deck.id)].slice(0, MAX_DECKS);
  currentDeck = deck;
  await persist();
};

export const setCurrentDeckById = async (deckId: string) => {
  await hydrateDeckSession();
  currentDeck = decks.find((entry) => entry.id === deckId) ?? currentDeck;
  await persist();
};

export const getCurrentDeck = () => currentDeck;

export const getSessionDecks = () => decks;

export const getDeckById = (deckId: string) => decks.find((entry) => entry.id === deckId) ?? null;

export const removeDeckFromSession = async (deckId: string) => {
  await hydrateDeckSession();
  decks = decks.filter((entry) => entry.id !== deckId);
  if (currentDeck?.id === deckId) {
    currentDeck = decks[0] ?? null;
  }
  await persist();
};
