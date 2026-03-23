import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { generateDeck } from "../services/api";
import { addDeckToSession } from "../storage/sessionDeck";
import { colors } from "../theme/colors";

export default function GenerateDeckScreen() {
  const router = useRouter();
  const [companyName, setCompanyName] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [resume, setResume] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeMultiline, setActiveMultiline] = useState<"jobDescription" | "resume" | null>(
    null
  );

  const onGenerate = async (skipCache: boolean) => {
    const company = companyName.trim();
    const role = roleTitle.trim();
    const jd = jobDescription.trim();

    if (company.length < 2) {
      setError("Please enter a valid company name.");
      return;
    }

    if (role.length < 2) {
      setError("Please enter a valid role title.");
      return;
    }

    if (jd.length < 30) {
      setError("Job description is too short. Please paste at least 30 characters.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const deck = await generateDeck({
        companyName: company,
        roleTitle: role,
        jobDescription: jd,
        resume: resume.trim() ? resume : undefined,
        skipCache
      });
      await addDeckToSession(deck);
      router.push(`/deck?deckId=${deck.id}`);
    } catch (err) {
      console.error("[generateDeck] Request failed", {
        companyLength: company.length,
        roleLength: role.length,
        jdLength: jd.length,
        resumeLength: resume.trim().length,
        error: err instanceof Error ? err.message : String(err)
      });
      setError(err instanceof Error ? err.message : "Failed to generate deck.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} scrollEnabled={!activeMultiline}>
        <Pressable
          style={({ pressed }) => [styles.ghostButton, pressed && styles.buttonPressed]}
          onPress={() => router.replace("/")}
        >
          <Text style={styles.ghostButtonText}>&lt; Back to home</Text>
        </Pressable>
        <Text style={styles.title}>Generate New Deck</Text>
        <Text style={styles.subtitle}>Paste role details to create fresh interview cards.</Text>

        <Field label="Company Name" value={companyName} onChangeText={setCompanyName} />
        <Field label="Role Title" value={roleTitle} onChangeText={setRoleTitle} />
        <Field
          label="Job Description"
          value={jobDescription}
          onChangeText={setJobDescription}
          multiline
          minHeight={180}
          maxHeight={180}
          onFocus={() => setActiveMultiline("jobDescription")}
          onBlur={() => setActiveMultiline(null)}
        />
        <Field
          label="Resume (Optional)"
          value={resume}
          onChangeText={setResume}
          multiline
          minHeight={120}
          maxHeight={120}
          onFocus={() => setActiveMultiline("resume")}
          onBlur={() => setActiveMultiline(null)}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          style={({ pressed }) => [
            styles.button,
            loading && styles.buttonDisabled,
            pressed && !loading && styles.buttonPressed
          ]}
          onPress={() => onGenerate(false)}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#1B212D" />
          ) : (
            <Text style={styles.buttonText}>Generate Deck</Text>
          )}
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.secondaryButton,
            loading && styles.buttonDisabled,
            pressed && !loading && styles.buttonPressed
          ]}
          onPress={() => onGenerate(true)}
          disabled={loading}
        >
          <Text style={styles.secondaryButtonText}>Generate Fresh Deck</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

type FieldProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  multiline?: boolean;
  minHeight?: number;
  maxHeight?: number;
  onFocus?: () => void;
  onBlur?: () => void;
};

const Field = ({
  label,
  value,
  onChangeText,
  multiline,
  minHeight,
  maxHeight,
  onFocus,
  onBlur
}: FieldProps) => (
  <View style={styles.field}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      style={[
        styles.input,
        multiline && { minHeight, maxHeight, textAlignVertical: "top" }
      ]}
      value={value}
      onChangeText={onChangeText}
      multiline={multiline}
      scrollEnabled={Boolean(multiline)}
      onFocus={onFocus}
      onBlur={onBlur}
      placeholder={`Enter ${label.toLowerCase()}`}
      placeholderTextColor="#8A8F99"
    />
  </View>
);

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
    marginBottom: 10,
    shadowColor: colors.shadow,
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3
  },
  ghostButtonText: { color: colors.navy, fontWeight: "800", fontSize: 15 },
  buttonPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.92
  },
  title: { color: colors.navy, fontSize: 30, fontWeight: "700", marginBottom: 6 },
  subtitle: { color: colors.muted, marginBottom: 20 },
  field: { marginBottom: 14 },
  label: { color: colors.navy, marginBottom: 8, fontWeight: "600" },
  input: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text
  },
  button: {
    backgroundColor: colors.gold,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
    shadowColor: colors.shadow,
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4
  },
  buttonDisabled: {
    opacity: 0.6
  },
  buttonText: {
    color: colors.navyDark,
    fontWeight: "700",
    fontSize: 16
  },
  secondaryButton: {
    borderRadius: 999,
    paddingVertical: 13,
    alignItems: "center",
    marginTop: 10,
    borderColor: colors.navy,
    borderWidth: 1,
    backgroundColor: colors.card,
    shadowColor: colors.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2
  },
  secondaryButtonText: {
    color: colors.navy,
    fontWeight: "700",
    fontSize: 15
  },
  error: { color: colors.danger, marginBottom: 10 }
});
