import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { pinyin } from "pinyin-pro";
import { getCurrentDeck } from "../../storage/sessionDeck";
import { colors } from "../../theme/colors";
import type { InterviewKeyword } from "../../types/deck";

type TermCard = {
  id: string;
  zh: string;
  en: string;
  sourceQuestion: string;
};

const normalizeTerm = (value: string) =>
  value
    .toLowerCase()
    .replace(/[\s\-_./\\(){}[\],;:!?'"`~@#$%^&*+=|<>]/g, "");

const makeTermKey = (zh: string, en: string) => `${normalizeTerm(zh)}::${normalizeTerm(en)}`;
const toPinyin = (value: string) => pinyin(value);

export default function TechnicalTermsScreen() {
  const router = useRouter();
  const { cardId, source } = useLocalSearchParams<{ cardId?: string; source?: string }>();
  const deck = getCurrentDeck();
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const flipAnim = useRef(new Animated.Value(0)).current;

  const terms = useMemo<TermCard[]>(() => {
    if (!deck) {
      return [];
    }

    const map = new Map<string, TermCard>();

    if (source === "jd") {
      (deck.jobDescriptionTerms ?? []).forEach((term) => {
        const key = makeTermKey(term.zh, term.en);
        if (!map.has(key)) {
          map.set(key, {
            id: `jd-${term.zh}-${term.en}`,
            zh: term.zh,
            en: term.en,
            sourceQuestion: "From job description deep dive"
          });
        }
      });
    } else if (source === "resume") {
      (deck.resumeTerms ?? []).forEach((term) => {
        const key = makeTermKey(term.zh, term.en);
        if (!map.has(key)) {
          map.set(key, {
            id: `resume-${term.zh}-${term.en}`,
            zh: term.zh,
            en: term.en,
            sourceQuestion: "From resume deep dive"
          });
        }
      });
    } else {
      const cards = cardId ? deck.cards.filter((card) => card.id === cardId) : deck.cards;
      cards.forEach((card) => {
        (card.technicalTerms ?? []).forEach((term: InterviewKeyword) => {
          const key = makeTermKey(term.zh, term.en);
          if (!map.has(key)) {
            map.set(key, {
              id: `${card.id}-${term.zh}-${term.en}`,
              zh: term.zh,
              en: term.en,
              sourceQuestion: card.questionZh
            });
          }
        });
      });
    }

    return Array.from(map.values());
  }, [deck, cardId, source]);

  if (!deck) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.emptyText}>No active deck found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!terms.length) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.emptyText}>No technical terms available for this selection.</Text>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>&lt; Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const term = terms[index];

  const goToIndex = (nextIndex: number) => {
    if (nextIndex < 0 || nextIndex >= terms.length) {
      return;
    }
    // Hard reset to front side before switching term to avoid answer spoiler flashes.
    flipAnim.stopAnimation(() => {
      flipAnim.setValue(0);
      setFlipped(false);
      setIndex(nextIndex);
    });
  };

  useEffect(() => {
    Animated.timing(flipAnim, {
      toValue: flipped ? 1 : 0,
      duration: 280,
      useNativeDriver: false
    }).start();
  }, [flipped, flipAnim]);

  const frontRotate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"]
  });
  const backRotate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["180deg", "360deg"]
  });
  const frontOpacity = flipAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0, 0]
  });
  const backOpacity = flipAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1]
  });

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>
          {source === "jd"
            ? "Job Description Deep Dive"
            : source === "resume"
              ? "Resume Deep Dive"
              : cardId
                ? "Technical terms (question)"
                : "All technical terms"}
        </Text>
        <Text style={styles.meta}>
          {index + 1} / {terms.length}
        </Text>

        <Pressable style={styles.cardFrame} onPress={() => setFlipped((value) => !value)}>
          <Animated.View
            style={[
              styles.card,
              styles.frontFace,
              { transform: [{ rotateY: frontRotate }], opacity: frontOpacity }
            ]}
          >
            <Text style={styles.main}>{term.en}</Text>
            <Text style={styles.hint}>Tap to reveal Chinese</Text>
          </Animated.View>
          <Animated.View
            style={[
              styles.card,
              styles.backFace,
              { transform: [{ rotateY: backRotate }], opacity: backOpacity }
            ]}
          >
            <Text style={styles.pinyin}>{toPinyin(term.zh)}</Text>
            <Text style={styles.main}>{term.zh}</Text>
            <Text style={styles.source}>{term.sourceQuestion}</Text>
          </Animated.View>
        </Pressable>

        <View style={styles.row}>
          <Pressable
            style={({ pressed }) => [
              styles.navButton,
              index === 0 && styles.navDisabled,
              pressed && index !== 0 && styles.buttonPressed
            ]}
            onPress={() => goToIndex(index - 1)}
          >
            <Text style={styles.navText}>Prev</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.navButton,
              index === terms.length - 1 && styles.navDisabled,
              pressed && index !== terms.length - 1 && styles.buttonPressed
            ]}
            onPress={() => goToIndex(index + 1)}
          >
            <Text style={styles.navText}>Next</Text>
          </Pressable>
        </View>

        <Pressable
          style={({ pressed }) => [styles.backButton, pressed && styles.buttonPressed]}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>&lt; Back</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.ivory },
  container: { flex: 1, padding: 20, gap: 12 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20, gap: 14 },
  title: { color: colors.navy, fontSize: 24, fontWeight: "700" },
  meta: { color: colors.muted },
  cardFrame: {
    flex: 1,
    minHeight: 320
  },
  card: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    justifyContent: "center",
    alignItems: "center",
    padding: 18,
    backfaceVisibility: "hidden"
  },
  frontFace: {
    justifyContent: "center",
    alignItems: "center"
  },
  backFace: {
    justifyContent: "center",
    alignItems: "center"
  },
  main: {
    color: colors.navy,
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center"
  },
  pinyin: {
    color: colors.goldDark,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6
  },
  hint: { marginTop: 14, color: colors.goldDark, fontWeight: "700" },
  source: { marginTop: 14, color: colors.muted, textAlign: "center" },
  row: { flexDirection: "row", gap: 10 },
  buttonPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.92
  },
  navButton: {
    flex: 1,
    borderRadius: 999,
    backgroundColor: colors.gold,
    paddingVertical: 12,
    alignItems: "center",
    shadowColor: colors.shadow,
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3
  },
  navDisabled: { opacity: 0.45 },
  navText: { color: colors.navyDark, fontWeight: "700" },
  backButton: {
    borderRadius: 999,
    borderWidth: 2,
    borderColor: colors.navy,
    paddingVertical: 12,
    paddingHorizontal: 18,
    alignItems: "center",
    backgroundColor: colors.card,
    shadowColor: colors.shadow,
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3
  },
  backButtonText: { color: colors.navy, fontWeight: "800", fontSize: 16 },
  emptyText: { color: colors.muted, textAlign: "center" }
});
