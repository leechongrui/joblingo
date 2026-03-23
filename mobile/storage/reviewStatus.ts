import AsyncStorage from "@react-native-async-storage/async-storage";
import type { CardStatus } from "../types/deck";

const keyForDeck = (deckId: string) => `deck-status:${deckId}`;

export const loadDeckStatuses = async (
  deckId: string
): Promise<Record<string, CardStatus>> => {
  const raw = await AsyncStorage.getItem(keyForDeck(deckId));
  if (!raw) {
    return {};
  }
  return JSON.parse(raw) as Record<string, CardStatus>;
};

export const saveDeckStatus = async (
  deckId: string,
  cardId: string,
  status: CardStatus
): Promise<void> => {
  const current = await loadDeckStatuses(deckId);
  const next = { ...current, [cardId]: status };
  await AsyncStorage.setItem(keyForDeck(deckId), JSON.stringify(next));
};

export const deleteDeckStatuses = async (deckId: string): Promise<void> => {
  await AsyncStorage.removeItem(keyForDeck(deckId));
};
