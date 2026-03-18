import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { getCurrentDeck } from "../../storage/sessionDeck";
import { colors } from "../../theme/colors";

type HighlightPart = {
  text: string;
  highlighted: boolean;
};

const splitWithHighlights = (
  source: string,
  keywords: string[],
  caseInsensitive: boolean
): HighlightPart[] => {
  const terms = Array.from(
    new Set(keywords.map((keyword) => keyword.trim()).filter((keyword) => keyword.length > 0))
  ).sort((a, b) => b.length - a.length);

  if (!terms.length) {
    return [{ text: source, highlighted: false }];
  }

  const normalizedSource = caseInsensitive ? source.toLowerCase() : source;
  const normalizedTerms = terms.map((term) => (caseInsensitive ? term.toLowerCase() : term));

  const result: HighlightPart[] = [];
  let cursor = 0;

  while (cursor < source.length) {
    let matchedTerm = "";
    for (let i = 0; i < normalizedTerms.length; i += 1) {
      const term = normalizedTerms[i];
      if (normalizedSource.slice(cursor, cursor + term.length) === term) {
        matchedTerm = terms[i];
        break;
      }
    }

    if (matchedTerm) {
      result.push({
        text: source.slice(cursor, cursor + matchedTerm.length),
        highlighted: true
      });
      cursor += matchedTerm.length;
      continue;
    }

    result.push({ text: source[cursor], highlighted: false });
    cursor += 1;
  }

  return result;
};

export default function AnswerCardScreen() {
  const router = useRouter();
  const { cardId } = useLocalSearchParams<{ cardId: string }>();
  const deck = getCurrentDeck();
  const [mode, setMode] = useState<"framework" | "step">("framework");
  const [stepIndex, setStepIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const flipAnim = useRef(new Animated.Value(0)).current;

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
          <Text style={styles.emptyText}>Answer card not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const englishSteps = card.answerPlanEn ?? [];
  const chineseSteps = card.answerPlanZh ?? [];
  const totalSteps = Math.max(englishSteps.length, chineseSteps.length);
  const currentEnglish = englishSteps[stepIndex] ?? "";
  const currentChinese = chineseSteps[stepIndex] ?? "";
  const keywordEn = (card.keywords ?? []).map((keyword) => keyword.en);
  const keywordZh = (card.keywords ?? []).map((keyword) => keyword.zh);

  useEffect(() => {
    Animated.timing(flipAnim, {
      toValue: flipped ? 1 : 0,
      duration: 260,
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
        <Text style={styles.title}>Answer Structure Card</Text>
        {mode === "framework" ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Framework (English)</Text>
            <Text style={styles.frameworkEn}>
              {"Use a 4-part response: Context -> Actions -> Impact -> Role fit."}
            </Text>
            <Text style={styles.point}>1. Briefly set context and objective.</Text>
            <Text style={styles.point}>2. Explain your key actions clearly.</Text>
            <Text style={styles.point}>3. Share measurable impact/result.</Text>
            <Text style={styles.point}>4. Link outcome to role fit.</Text>
          </View>
        ) : (
          <Pressable style={styles.flipFrame} onPress={() => setFlipped((value) => !value)}>
            <Animated.View
              style={[
                styles.flipFace,
                styles.flipFront,
                { transform: [{ rotateY: frontRotate }], opacity: frontOpacity }
              ]}
            >
              <Text style={styles.stepLabel}>
                Step {stepIndex + 1} / {totalSteps}
              </Text>
              <Text style={styles.point}>
                {splitWithHighlights(currentEnglish, keywordEn, true).map((part, index) => (
                  <Text
                    key={`en-${index}-${part.text}`}
                    style={part.highlighted ? styles.highlightEn : undefined}
                  >
                    {part.text}
                  </Text>
                ))}
              </Text>
              <Text style={styles.stepHint}>Tap card to flip.</Text>
            </Animated.View>

            <Animated.View
              style={[
                styles.flipFace,
                styles.flipBack,
                { transform: [{ rotateY: backRotate }], opacity: backOpacity }
              ]}
            >
              <Text style={styles.stepLabel}>
                Step {stepIndex + 1} / {totalSteps}
              </Text>
              <Text style={styles.point}>
                {splitWithHighlights(currentChinese, keywordZh, false).map((part, index) => (
                  <Text
                    key={`zh-${index}-${part.text}`}
                    style={part.highlighted ? styles.highlightZh : undefined}
                  >
                    {part.text}
                  </Text>
                ))}
              </Text>
            </Animated.View>
          </Pressable>
        )}

        <View style={styles.navRow}>
          {mode === "framework" ? (
            <Pressable style={styles.navButton} onPress={() => setMode("step")}>
              <Text style={styles.navButtonText}>Next</Text>
            </Pressable>
          ) : (
            <>
              <Pressable
                style={[styles.navButton, stepIndex === 0 && styles.navDisabled]}
                onPress={() => {
                  if (stepIndex === 0) {
                    setMode("framework");
                    return;
                  }
                  flipAnim.setValue(0);
                  setFlipped(false);
                  setStepIndex((value) => value - 1);
                }}
              >
                <Text style={styles.navButtonText}>Prev</Text>
              </Pressable>
              <Pressable
                style={[styles.navButton, stepIndex >= totalSteps - 1 && styles.navDisabled]}
                onPress={() => {
                  if (stepIndex >= totalSteps - 1) {
                    return;
                  }
                  flipAnim.setValue(0);
                  setFlipped(false);
                  setStepIndex((value) => value + 1);
                }}
              >
                <Text style={styles.navButtonText}>Next</Text>
              </Pressable>
            </>
          )}
        </View>

        <Pressable
          style={({ pressed }) => [styles.backButton, pressed && styles.buttonPressed]}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>&lt; Back to question</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.ivory },
  container: { flex: 1, padding: 20, gap: 12 },
  title: { color: colors.navy, fontSize: 28, fontWeight: "700", textAlign: "center" },
  card: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border
  },
  sectionTitle: {
    color: colors.navy,
    fontWeight: "700",
    marginBottom: 10,
    fontSize: 16,
    textAlign: "center"
  },
  point: {
    color: colors.text,
    marginBottom: 10,
    lineHeight: 24,
    fontSize: 16,
    textAlign: "center"
  },
  frameworkEn: {
    color: colors.navyDark,
    marginBottom: 14,
    lineHeight: 24,
    fontSize: 16,
    textAlign: "center"
  },
  flipFrame: {
    flex: 1,
    minHeight: 320
  },
  flipFace: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    padding: 16,
    backfaceVisibility: "hidden",
    justifyContent: "center"
  },
  flipFront: {},
  flipBack: {},
  stepLabel: {
    color: colors.goldDark,
    fontWeight: "700",
    marginBottom: 10,
    textAlign: "center",
    fontSize: 16
  },
  stepHint: {
    color: colors.goldDark,
    textAlign: "center",
    fontSize: 14,
    marginTop: 8
  },
  highlightEn: {
    backgroundColor: "#fff3cc",
    color: colors.navyDark,
    fontWeight: "700"
  },
  highlightZh: {
    backgroundColor: "#fff3cc",
    color: colors.navy,
    fontWeight: "700"
  },
  navRow: {
    flexDirection: "row",
    gap: 10
  },
  buttonPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.92
  },
  navButton: {
    flex: 1,
    borderRadius: 999,
    backgroundColor: colors.gold,
    paddingVertical: 13,
    alignItems: "center"
  },
  navDisabled: {
    opacity: 0.5
  },
  navButtonText: { color: colors.navyDark, fontWeight: "700", fontSize: 16 },
  backButton: {
    borderRadius: 999,
    borderWidth: 2,
    borderColor: colors.navy,
    backgroundColor: colors.card,
    paddingVertical: 13,
    alignItems: "center",
    shadowColor: colors.shadow,
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3
  },
  backButtonText: { color: colors.navy, fontWeight: "800", fontSize: 16 },
  empty: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { color: colors.muted }
});
