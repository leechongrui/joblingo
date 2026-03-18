import { Pressable, StyleSheet, Text, View } from "react-native";
import type { InterviewCard } from "../types/deck";
import { colors } from "../theme/colors";

interface DeckCardProps {
  card: InterviewCard;
  onPress: () => void;
}

export const DeckCard = ({ card, onPress }: DeckCardProps) => {
  const statusLabel =
    card.status === "got_it"
      ? "Got it"
      : card.status === "need_practice"
        ? "Need practice"
        : "Unseen";

  return (
    <Pressable
      style={({ pressed }) => [styles.container, pressed && styles.containerPressed]}
      onPress={onPress}
    >
      <View style={styles.header}>
        <Text style={styles.order}>#{card.order}</Text>
        <Text style={styles.status}>{statusLabel}</Text>
      </View>
      <Text style={styles.question}>{card.questionZh}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border
  },
  containerPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8
  },
  order: {
    color: colors.muted,
    fontWeight: "600"
  },
  status: {
    color: colors.navy,
    fontWeight: "700"
  },
  question: {
    color: colors.text,
    fontSize: 16,
    lineHeight: 22
  }
});
