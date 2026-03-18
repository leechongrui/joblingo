import { ScrollView, StyleSheet, Text, View } from "react-native";
import type { InterviewCard } from "../types/deck";
import { colors } from "../theme/colors";

interface StudyCardProps {
  card: InterviewCard;
  showKeywords?: boolean;
}

export const StudyCard = ({ card, showKeywords = true }: StudyCardProps) => {
  return (
    <View style={styles.frame}>
      <View style={styles.face}>
        <View style={styles.questionBlock}>
          <Text style={styles.question}>{card.questionZh}</Text>
          <ScrollView
            style={styles.meaningScroll}
            contentContainerStyle={styles.meaningScrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.meaning}>{card.meaningEn}</Text>
          </ScrollView>
        </View>
      </View>

      {showKeywords ? (
        <View style={styles.keywordsCard}>
          <Text style={styles.sectionTitle}>Core keywords</Text>
          <ScrollView style={styles.keywordsScroll} showsVerticalScrollIndicator={false}>
            {card.keywords.map((keyword) => (
              <Text key={`${card.id}-${keyword.zh}`} style={styles.keyword}>
                {keyword.zh} · {keyword.en}
              </Text>
            ))}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  frame: {
    minHeight: 320,
    gap: 14
  },
  face: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 18,
    minHeight: 230,
    justifyContent: "center",
    alignItems: "center"
  },
  keywordsCard: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 18,
    minHeight: 180,
    justifyContent: "center"
  },
  questionBlock: {
    width: "100%"
  },
  meaningScroll: {
    marginTop: 12,
    maxHeight: 160
  },
  meaningScrollContent: {
    flexGrow: 1,
    justifyContent: "center"
  },
  keywordsScroll: {
    marginTop: 12,
    maxHeight: 160
  },
  question: {
    color: colors.text,
    fontSize: 25,
    lineHeight: 35,
    textAlign: "center"
  },
  meaning: {
    color: colors.text,
    fontSize: 20,
    lineHeight: 30,
    textAlign: "center"
  },
  section: {
    marginTop: 18
  },
  sectionTitle: {
    color: colors.navy,
    fontWeight: "700",
    marginBottom: 2,
    fontSize: 18,
    textAlign: "center"
  },
  keyword: {
    color: colors.text,
    marginBottom: 8,
    fontSize: 18,
    lineHeight: 26,
    textAlign: "center"
  }
});
