import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { AppLogo } from "../components/AppLogo";
import { supabase } from "../services/supabase";
import { colors } from "../theme/colors";

export default function SignInScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const signIn = async () => {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });

      if (signInError) {
        setError(signInError.message);
      } else if (data.session) {
        router.replace("/");
      }
    } catch (err) {
      console.error("[auth] Sign in failed", {
        emailLength: email.trim().length,
        error: err instanceof Error ? err.message : String(err)
      });
      setError(err instanceof Error ? err.message : "Sign in failed. Check connection.");
    } finally {
      setLoading(false);
    }
  };

  const signUp = async () => {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password
      });

      if (signUpError) {
        setError(signUpError.message);
      } else if (!data.session) {
        setMessage("Check your email to confirm your account, then sign in.");
      } else {
        setMessage("Account created and signed in.");
        router.replace("/");
      }
    } catch (err) {
      console.error("[auth] Sign up failed", {
        emailLength: email.trim().length,
        error: err instanceof Error ? err.message : String(err)
      });
      setError(err instanceof Error ? err.message : "Create account failed. Check connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <AppLogo size={92} />
        <Text style={styles.title}>JobLingo 面试答</Text>
        <Text style={styles.subtitle}>Sign in to generate and save your decks.</Text>

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="you@example.com"
          placeholderTextColor="#8A8F99"
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="At least 6 characters"
          placeholderTextColor="#8A8F99"
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {message ? <Text style={styles.message}>{message}</Text> : null}

        <Pressable
          style={({ pressed }) => [
            styles.primaryButton,
            loading && styles.buttonDisabled,
            pressed && !loading && styles.buttonPressed
          ]}
          onPress={signIn}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#1B212D" />
          ) : (
            <Text style={styles.primaryButtonText}>Sign In</Text>
          )}
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.secondaryButton,
            loading && styles.buttonDisabled,
            pressed && !loading && styles.buttonPressed
          ]}
          onPress={signUp}
          disabled={loading}
        >
          <Text style={styles.secondaryButtonText}>Create Account</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.ivory },
  container: { flex: 1, padding: 20, justifyContent: "center" },
  title: {
    color: colors.navy,
    fontSize: 30,
    fontWeight: "700",
    marginTop: 10,
    marginBottom: 6,
    textAlign: "center"
  },
  subtitle: { color: colors.muted, marginBottom: 20, textAlign: "center" },
  label: { color: colors.navy, marginBottom: 8, fontWeight: "600" },
  input: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    marginBottom: 12
  },
  primaryButton: {
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
  buttonPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.92
  },
  buttonDisabled: { opacity: 0.65 },
  primaryButtonText: {
    color: colors.navyDark,
    fontWeight: "700",
    fontSize: 16
  },
  secondaryButton: {
    marginTop: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.navy,
    borderRadius: 999,
    paddingVertical: 12,
    backgroundColor: colors.card,
    shadowColor: colors.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2
  },
  secondaryButtonText: {
    color: colors.navy,
    fontWeight: "700"
  },
  error: { color: colors.danger, marginBottom: 10 },
  message: { color: colors.success, marginBottom: 10 }
});
