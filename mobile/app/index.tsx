import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  PanResponder,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { AppLogo } from "../components/AppLogo";
import { colors } from "../theme/colors";
import {
  getSessionDecks,
  hydrateDeckSession,
  removeDeckFromSession,
  setCurrentDeckById
} from "../storage/sessionDeck";
import { deleteDeckStatuses } from "../storage/reviewStatus";
import type { InterviewDeck } from "../types/deck";

const DELETE_SWIPE_WIDTH = 92;
const SWIPE_OPEN_THRESHOLD = 36;

const SwipeDeckRow = ({
  deck,
  onOpen,
  onDelete
}: {
  deck: InterviewDeck;
  onOpen: () => void;
  onDelete: () => void;
}) => {
  const reveal = useRef(new Animated.Value(0)).current;
  const [opened, setOpened] = useState(false);
  const startReveal = useRef(0);

  const animateTo = (toValue: number) => {
    Animated.timing(reveal, {
      toValue,
      duration: 180,
      useNativeDriver: true
    }).start(() => {
      setOpened(toValue > 0);
    });
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) =>
          Math.abs(gestureState.dx) > 8 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy),
        onPanResponderGrant: () => {
          startReveal.current = opened ? DELETE_SWIPE_WIDTH : 0;
        },
        onPanResponderMove: (_, gestureState) => {
          const next = Math.max(0, Math.min(DELETE_SWIPE_WIDTH, startReveal.current - gestureState.dx));
          reveal.setValue(next);
        },
        onPanResponderRelease: (_, gestureState) => {
          const estimated = startReveal.current - gestureState.dx;
          if (estimated >= SWIPE_OPEN_THRESHOLD || gestureState.vx < -0.3) {
            animateTo(DELETE_SWIPE_WIDTH);
            return;
          }
          animateTo(0);
        },
        onPanResponderTerminate: () => {
          animateTo(opened ? DELETE_SWIPE_WIDTH : 0);
        }
      }),
    [opened, reveal]
  );

  const translateX = reveal.interpolate({
    inputRange: [0, DELETE_SWIPE_WIDTH],
    outputRange: [0, -DELETE_SWIPE_WIDTH]
  });

  return (
    <View style={[styles.rowShell, opened && styles.rowShellOpen]} {...panResponder.panHandlers}>
      <View style={styles.deleteTray}>
        <Pressable
          style={styles.deleteAction}
          onPress={onDelete}
          accessibilityRole="button"
          accessibilityLabel="Delete deck"
        >
          <Text style={styles.deleteIcon}>🗑</Text>
          <Text style={styles.deleteActionText}>Delete</Text>
        </Pressable>
      </View>
      <Animated.View
        style={[styles.deckSurface, { transform: [{ translateX }] }]}
        pointerEvents={opened ? "none" : "auto"}
      >
        <Pressable
          style={({ pressed }) => [styles.deckOpenArea, pressed && styles.buttonPressed]}
          onPress={() => {
            if (opened) {
              animateTo(0);
              return;
            }
            onOpen();
          }}
        >
          <Text style={styles.deckTitle}>{deck.roleTitle}</Text>
          <Text style={styles.deckMeta}>
            {deck.companyName} · {deck.cardCount} cards
          </Text>
        </Pressable>
      </Animated.View>
    </View>
  );
};

export default function HomeScreen() {
  const router = useRouter();
  const [decks, setDecks] = useState<InterviewDeck[]>(getSessionDecks());

  useEffect(() => {
    hydrateDeckSession().then(({ decks: savedDecks }) => {
      setDecks(savedDecks);
    });
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <AppLogo size={92} />
        <View style={styles.headerActions}>
          <Pressable
            style={({ pressed }) => [
              styles.primaryButtonSmall,
              pressed && styles.buttonPressed
            ]}
            onPress={() => router.push("/generate")}
          >
            <Text style={styles.primaryButtonSmallText}>+ New deck</Text>
          </Pressable>
        </View>

        {!decks.length ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>No decks yet</Text>
            <Text style={styles.emptyText}>
              Create your first deck from a job description to start practicing.
            </Text>
            <Pressable
              style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
              onPress={() => router.push("/generate")}
            >
              <Text style={styles.buttonText}>Create First Deck</Text>
            </Pressable>
          </View>
        ) : (
          decks.map((deck) => (
            <SwipeDeckRow
              key={deck.id}
              deck={deck}
              onOpen={async () => {
                await setCurrentDeckById(deck.id);
                router.push(`/deck?deckId=${deck.id}`);
              }}
              onDelete={() =>
                Alert.alert("Remove deck?", "This removes the deck from this device.", [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Remove",
                    style: "destructive",
                    onPress: async () => {
                      await removeDeckFromSession(deck.id);
                      await deleteDeckStatuses(deck.id);
                      const { decks: nextDecks } = await hydrateDeckSession();
                      setDecks(nextDecks);
                    }
                  }
                ])
              }
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.ivory },
  container: { padding: 20, paddingBottom: 40, gap: 10 },
  headerActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 8
  },
  buttonPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.92
  },
  primaryButtonSmall: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: colors.gold,
    shadowColor: colors.shadow,
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4
  },
  primaryButtonSmallText: { color: colors.navyDark, fontWeight: "700" },
  emptyBox: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 6
  },
  emptyTitle: {
    color: colors.navy,
    fontWeight: "700",
    marginBottom: 6
  },
  emptyText: {
    color: colors.muted,
    marginBottom: 12
  },
  button: {
    backgroundColor: colors.gold,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
    shadowColor: colors.shadow,
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4
  },
  buttonText: {
    color: colors.navyDark,
    fontWeight: "700",
    fontSize: 16
  },
  rowShell: {
    borderRadius: 14,
    overflow: "hidden",
    marginTop: 2,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    position: "relative"
  },
  rowShellOpen: {
    borderColor: "#F3CACA"
  },
  deleteTray: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    width: DELETE_SWIPE_WIDTH,
    backgroundColor: "#FBE9E9",
    justifyContent: "center",
    alignItems: "center"
  },
  deleteAction: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    gap: 3
  },
  deleteIcon: {
    fontSize: 18
  },
  deleteActionText: {
    color: colors.danger,
    fontWeight: "700",
    fontSize: 14
  },
  deckSurface: {
    backgroundColor: colors.card,
    borderRadius: 14
  },
  deckOpenArea: {
    paddingHorizontal: 14,
    paddingVertical: 14
  },
  deckTitle: {
    color: colors.navy,
    fontWeight: "700",
    fontSize: 17,
    marginBottom: 5
  },
  deckMeta: {
    color: colors.muted
  }
});
