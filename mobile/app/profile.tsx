import { useEffect, useState } from "react";
import { SafeAreaView, StyleSheet, Text, View, Pressable } from "react-native";
import { useAuth } from "../providers/AuthProvider";
import { loadDeckStatuses } from "../storage/reviewStatus";
import { hydrateDeckSession } from "../storage/sessionDeck";
import { colors } from "../theme/colors";

export default function ProfileScreen() {
  const { session, signOut } = useAuth();
  const [stats, setStats] = useState({
    deckCount: 0,
    cardCount: 0,
    gotIt: 0,
    needPractice: 0
  });

  useEffect(() => {
    hydrateDeckSession().then(async ({ decks }) => {
      let gotIt = 0;
      let needPractice = 0;
      for (const deck of decks) {
        const statuses = await loadDeckStatuses(deck.id);
        Object.values(statuses).forEach((status) => {
          if (status === "got_it") {
            gotIt += 1;
          } else if (status === "need_practice") {
            needPractice += 1;
          }
        });
      }

      setStats({
        deckCount: decks.length,
        cardCount: decks.reduce((sum, deck) => sum + deck.cardCount, 0),
        gotIt,
        needPractice
      });
    });
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Profile</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{session?.user?.email ?? "Unknown"}</Text>

          <Text style={[styles.label, styles.sectionGap]}>User ID</Text>
          <Text style={styles.value}>{session?.user?.id ?? "Unknown"}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Learning snapshot</Text>
          <View style={styles.statRow}>
            <Stat label="Decks" value={stats.deckCount} />
            <Stat label="Cards" value={stats.cardCount} />
          </View>
          <View style={styles.statRow}>
            <Stat label="Got it" value={stats.gotIt} />
            <Stat label="Need practice" value={stats.needPractice} />
          </View>
        </View>

        <Pressable style={styles.signOutButton} onPress={() => signOut()}>
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const Stat = ({ label, value }: { label: string; value: number }) => (
  <View style={styles.statBox}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.ivory },
  container: { flex: 1, padding: 20, gap: 14 },
  title: { color: colors.navy, fontSize: 30, fontWeight: "700" },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16
  },
  label: { color: colors.goldDark, fontWeight: "700", marginBottom: 6 },
  value: { color: colors.navyDark, lineHeight: 20 },
  sectionGap: { marginTop: 10 },
  statRow: { flexDirection: "row", gap: 10, marginTop: 8 },
  statBox: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: "#fffaf0",
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 12,
    alignItems: "center"
  },
  statValue: { color: colors.navy, fontSize: 20, fontWeight: "700" },
  statLabel: { color: colors.muted, marginTop: 2, fontSize: 12 },
  signOutButton: {
    borderRadius: 999,
    backgroundColor: colors.navy,
    paddingVertical: 13,
    alignItems: "center",
    shadowColor: colors.shadow,
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3
  },
  signOutText: { color: colors.ivory, fontWeight: "700" }
});
