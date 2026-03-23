import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { DeckCard } from "../../components/DeckCard";
import {
  getCurrentDeck,
  hydrateDeckSession,
  setCurrentDeckById
} from "../../storage/sessionDeck";
import { loadDeckStatuses } from "../../storage/reviewStatus";
import { colors } from "../../theme/colors";
import type { InterviewDeck } from "../../types/deck";

const mergeStatuses = async (deck: InterviewDeck): Promise<InterviewDeck> => {
  const statuses = await loadDeckStatuses(deck.id);
  return {
    ...deck,
    cards: deck.cards.map((card) => ({
      ...card,
      status: statuses[card.id] ?? card.status
    }))
  };
};

export default function DeckOverviewScreen() {
  const router = useRouter();
  const { deckId } = useLocalSearchParams<{ deckId?: string }>();
  const [deck, setDeck] = useState<InterviewDeck | null>(getCurrentDeck());

  useEffect(() => {
    hydrateDeckSession().then(async ({ currentDeck, decks: savedDecks }) => {
      if (deckId) {
        await setCurrentDeckById(deckId);
      }
      const activeDeck = deckId
        ? savedDecks.find((entry) => entry.id === deckId) ?? currentDeck
        : currentDeck;
      if (!activeDeck) {
        return;
      }
      mergeStatuses(activeDeck).then((merged) => {
        setDeck(merged);
      });
    });
  }, [deckId]);

  if (!deck) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No deck loaded yet. Generate one first.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const cards = deck.cards;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Pressable style={styles.ghostButton} onPress={() => router.replace("/")}>
          <Text style={styles.ghostButtonText}>&lt; Back to home</Text>
        </Pressable>
        <Text style={styles.title}>{deck.title}</Text>
        <Text style={styles.meta}>{deck.cardCount} cards</Text>

        <View style={styles.learningFlow}>
          <Pressable
            style={({ pressed }) => [styles.flowButton, pressed && styles.buttonPressed]}
            onPress={() => router.push("/deck/terms?source=jd")}
          >
            <Text style={styles.flowButtonTitle}>1) JD deep dive</Text>
            <Text style={styles.flowButtonMeta}>
              {(deck.jobDescriptionTerms ?? []).length} terms
            </Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.flowButton, pressed && styles.buttonPressed]}
            onPress={() => router.push("/deck/terms?source=resume")}
          >
            <Text style={styles.flowButtonTitle}>2) Resume deep dive</Text>
            <Text style={styles.flowButtonMeta}>{(deck.resumeTerms ?? []).length} terms</Text>
          </Pressable>
          <View style={styles.flowInfo}>
            <Text style={styles.flowInfoText}>3) Interview questions (below)</Text>
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [styles.termsAllButton, pressed && styles.buttonPressed]}
          onPress={() => router.push("/deck/terms")}
        >
          <Text style={styles.termsAllButtonText}>All technical terms</Text>
        </Pressable>

        {cards.map((card) => (
          <DeckCard
            key={card.id}
            card={card}
            onPress={() => router.push(`/deck/study?cardId=${card.id}`)}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.ivory },
  container: { padding: 20, paddingBottom: 40 },
  ghostButton: {
    borderRadius: 999,
    borderWidth: 2,
    borderColor: colors.navy,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignSelf: "flex-start",
    backgroundColor: colors.card,
    marginBottom: 8,
    shadowColor: colors.shadow,
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3
  },
  ghostButtonText: { color: colors.navy, fontWeight: "800", fontSize: 15 },
  title: { color: colors.navy, fontSize: 24, fontWeight: "700" },
  meta: { color: colors.muted, marginBottom: 10 },
  learningFlow: {
    gap: 8,
    marginBottom: 12
  },
  flowButton: {
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12
  },
  flowButtonTitle: {
    color: colors.navy,
    fontWeight: "700"
  },
  flowButtonMeta: {
    color: colors.goldDark,
    marginTop: 2,
    fontWeight: "600"
  },
  flowInfo: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#fffaf0",
    padding: 10
  },
  flowInfoText: {
    color: colors.navy,
    fontWeight: "600"
  },
  buttonPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.92
  },
  termsAllButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.navy,
    backgroundColor: colors.card,
    paddingVertical: 11,
    alignItems: "center",
    marginBottom: 12,
    shadowColor: colors.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2
  },
  termsAllButtonText: {
    color: colors.navy,
    fontWeight: "700"
  },
  empty: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  emptyText: { color: colors.muted }
});
