import { Slot, usePathname, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { AuthProvider, useAuth } from "../providers/AuthProvider";
import { colors } from "../theme/colors";

export default function RootLayout() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}

const AuthGate = () => {
  const router = useRouter();
  const pathname = usePathname();
  const segments = useSegments();
  const { loading, session } = useAuth();

  useEffect(() => {
    if (loading) {
      return;
    }

    const onAuthScreen = segments[0] === "sign-in";

    if (!session && !onAuthScreen) {
      router.replace("/sign-in");
    } else if (session && onAuthScreen) {
      router.replace("/");
    }
  }, [loading, session, segments, router]);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#1D2B53" />
      </View>
    );
  }

  const showBottomNav = Boolean(session) && pathname !== "/sign-in";

  return (
    <View style={styles.shell}>
      <View style={styles.contentArea}>
        <Slot />
      </View>
      {showBottomNav ? (
        <View style={styles.navBar}>
          <NavButton
            label="Home"
            active={!pathname.startsWith("/profile")}
            onPress={() => router.replace("/")}
          />
          <NavButton
            label="Profile"
            active={pathname.startsWith("/profile")}
            onPress={() => router.replace("/profile")}
          />
        </View>
      ) : null}
    </View>
  );
};

const NavButton = ({
  label,
  active,
  onPress
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) => (
  <Pressable style={[styles.navButton, active && styles.navButtonActive]} onPress={onPress}>
    <Text style={[styles.navButtonText, active && styles.navButtonTextActive]}>{label}</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.ivory
  },
  shell: {
    flex: 1,
    backgroundColor: colors.ivory
  },
  contentArea: {
    flex: 1,
    paddingBottom: 82
  },
  navBar: {
    position: "absolute",
    left: 14,
    right: 14,
    bottom: 14,
    flexDirection: "row",
    backgroundColor: colors.card,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 6,
    gap: 8,
    shadowColor: colors.shadow,
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3
  },
  navButton: {
    flex: 1,
    alignItems: "center",
    borderRadius: 999,
    paddingVertical: 10
  },
  navButtonActive: {
    backgroundColor: colors.gold
  },
  navButtonText: {
    color: colors.navy,
    fontWeight: "700"
  },
  navButtonTextActive: {
    color: colors.navyDark
  }
});
