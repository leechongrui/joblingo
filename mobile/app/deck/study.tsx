import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo } from "react";
import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { StudyCard } from "../../components/StudyCard";
import { getCurrentDeck } from "../../storage/sessionDeck";
import { colors } from "../../theme/colors";

export default function StudyCardScreen() {
  const router = useRouter();
  const { cardId } = useLocalSearchParams<{ cardId: string }>();
  const deck = getCurrentDeck();

  const card = useMemo(() => {
    if (!deck || !cardId) {
      return null;
    }
    return deck.cards.find((entry) => entry.id === cardId) ?? null;
  }, [deck, cardId]);

  if (!deck || !card) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Card not found. Return to deck list.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <StudyCard card={card} />

        <Pressable
          style={({ pressed }) => [styles.answerButton, pressed && styles.buttonPressed]}
          onPress={() => router.push(`/deck/answer?cardId=${card.id}`)}
        >
          <Text style={styles.answerButtonText}>Answer structure card</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.termsButton, pressed && styles.buttonPressed]}
          onPress={() => router.push(`/deck/terms?cardId=${card.id}`)}
        >
          <Text style={styles.termsButtonText}>Technical terms (this question)</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.backButton, pressed && styles.buttonPressed]}
          onPress={() => router.back()}
        >
          <Text style={styles.back}>&lt; Back to deck</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.ivory },
  container: { flex: 1, padding: 20, gap: 14 },
  buttonPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.92
  },
  answerButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.goldDark,
    paddingVertical: 11,
    alignItems: "center",
    backgroundColor: colors.card
  },
  answerButtonText: {
    color: colors.goldDark,
    fontWeight: "700"
  },
  termsButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.navy,
    paddingVertical: 11,
    alignItems: "center",
    backgroundColor: colors.card,
    shadowColor: colors.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2
  },
  termsButtonText: {
    color: colors.navy,
    fontWeight: "700"
  },
  backButton: {
    borderRadius: 999,
    borderWidth: 2,
    borderColor: colors.navy,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: colors.card,
    shadowColor: colors.shadow,
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3
  },
  back: { color: colors.navy, fontWeight: "800", fontSize: 16 },
  empty: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  emptyText: { color: colors.muted }
});
