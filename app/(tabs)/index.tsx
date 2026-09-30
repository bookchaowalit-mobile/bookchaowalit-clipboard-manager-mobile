import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Clipboard from "expo-clipboard";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  MAX_SNIPPET_LENGTH,
  STORAGE_KEY,
  addSnippet,
  exportArchive,
  filterSnippets,
  parseStoredSnippets,
  type Snippet,
} from "../../lib/snippets";

function ActionButton({
  label,
  onPress,
  variant = "secondary",
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "quiet" | "danger";
  disabled?: boolean;
}) {
  const variantStyle =
    variant === "primary"
      ? { button: styles.actionButtonPrimary, text: styles.actionButtonTextPrimary }
      : variant === "quiet"
        ? { button: styles.actionButtonQuiet, text: styles.actionButtonTextQuiet }
        : variant === "danger"
          ? { button: styles.actionButtonDanger, text: styles.actionButtonTextDanger }
          : { button: styles.actionButtonSecondary, text: styles.actionButtonTextSecondary };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionButton,
        variantStyle.button,
        pressed && styles.actionButtonPressed,
        disabled && styles.actionButtonDisabled,
      ]}
    >
      <Text style={[styles.actionButtonText, variantStyle.text]}>{label}</Text>
    </Pressable>
  );
}

export default function HomeScreen() {
  const [items, setItems] = useState<Snippet[]>([]);
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ARCHIVE READY / LOCAL ONLY");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  // Only write back after a successful read: saving after a failed read would
  // overwrite the stored archive with an empty list.
  const [canSave, setCanSave] = useState(false);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let active = true;

    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (!active) {
          return;
        }
        setItems(parseStoredSnippets(stored));
        setCanSave(true);
        setIsHydrated(true);
      })
      .catch(() => {
        if (!active) {
          return;
        }
        setStatus("ARCHIVE UNAVAILABLE / RETRY LATER");
        setIsHydrated(true);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!canSave) {
      return;
    }

    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items)).catch(() => {
      setStatus("SAVE FAILED / TRY AGAIN");
    });
  }, [canSave, items]);

  const exportItems = () => {
    Share.share({ title: "Clipboard archive", message: exportArchive(items, new Date()) })
      .then(() => setStatus("EXPORTED / JSON BACKUP SHARED"))
      .catch(() => setStatus("EXPORT FAILED / TRY AGAIN"));
  };

  useEffect(() => {
    return () => {
      if (copiedTimer.current) {
        clearTimeout(copiedTimer.current);
      }
    };
  }, []);

  const filteredItems = useMemo(
    () => filterSnippets(items, query),
    [items, query],
  );

  const pinnedCount = items.filter((item) => item.pinned).length;

  const saveSnippet = () => {
    const result = addSnippet(items, draft);
    if (result.items === items) {
      setStatus("HOLD / WRITE A SNIPPET FIRST");
      return;
    }

    setItems(result.items);
    setDraft("");
    setStatus(
      result.added ? "FILED / SNIPPET IN ARCHIVE" : "MOVED UP / ALREADY FILED",
    );
  };

  const readClipboard = async () => {
    try {
      const text = await Clipboard.getStringAsync();
      if (!text.trim()) {
        setStatus("CLIPBOARD EMPTY / PASTE MANUALLY");
        return;
      }
      setDraft(text.slice(0, MAX_SNIPPET_LENGTH));
      setStatus("LOADED / READY TO FILE");
    } catch {
      setStatus("CLIPBOARD CLOSED / PASTE MANUALLY");
    }
  };

  const copySnippet = async (snippet: Snippet) => {
    try {
      await Clipboard.setStringAsync(snippet.text);
      setCopiedId(snippet.id);
      setStatus("COPIED / READY TO DELIVER");
      if (copiedTimer.current) {
        clearTimeout(copiedTimer.current);
      }
      copiedTimer.current = setTimeout(() => setCopiedId(null), 1_400);
    } catch {
      setStatus("COPY BLOCKED / SELECT THE TEXT");
    }
  };

  const togglePinned = (id: string) => {
    setItems((current) =>
      current.map((item) =>
        item.id === id ? { ...item, pinned: !item.pinned } : item,
      ),
    );
    setStatus("UPDATED / PIN STATUS SAVED");
  };

  const deleteSnippet = (id: string) => {
    setItems((current) => current.filter((item) => item.id !== id));
    setStatus("REMOVED / ARCHIVE UPDATED");
  };

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      style={styles.container}
    >
      <View style={styles.header}>
        <View style={styles.brand}>
          <Text style={styles.eyebrow}>LOCAL DISPATCH</Text>
          <Text style={styles.title}>CLIP / BOARD</Text>
        </View>
        <Text accessibilityLiveRegion="polite" style={styles.status}>
          {status}
        </Text>
        <View
          accessibilityLabel={items.length + " files, " + pinnedCount + " pinned"}
          style={styles.stats}
        >
          <Text style={styles.statValue}>{String(items.length).padStart(2, "0")}</Text>
          <Text style={styles.statLabel}>FILES / {pinnedCount} PINNED</Text>
        </View>
      </View>

      <View style={styles.intro}>
        <Text style={styles.introTitle}>Keep the useful line.</Text>
        <Text style={styles.introText}>
          A private shelf for text you reuse. Save it once, find it again, and
          send it on its way.
        </Text>
      </View>

      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>DROP SLOT / NEW FILE</Text>
          <Text style={styles.sectionNumber}>01</Text>
        </View>
        <Text style={styles.fieldLabel}>Snippet</Text>
        <TextInput
          accessibilityLabel="New snippet"
          multiline
          maxLength={MAX_SNIPPET_LENGTH}
          onChangeText={setDraft}
          placeholder="Paste or type a useful line…"
          placeholderTextColor="#8D98A8"
          style={styles.composer}
          textAlignVertical="top"
          value={draft}
        />
        <Text style={styles.characterCount}>
          {draft.length.toLocaleString()} / {MAX_SNIPPET_LENGTH.toLocaleString()}
        </Text>
        <View style={styles.buttonRow}>
          <ActionButton
            disabled={!isHydrated}
            label="File snippet"
            onPress={saveSnippet}
            variant="primary"
          />
          <ActionButton
            label="Read clipboard"
            onPress={() => void readClipboard()}
          />
          <ActionButton
            label="Clear"
            onPress={() => {
              setDraft("");
              setStatus("DROP SLOT CLEARED");
            }}
            variant="quiet"
          />
        </View>
        <Text style={styles.hint}>
          Clipboard access happens only when you tap Read clipboard or Copy.
          Nothing is synced.
        </Text>
      </View>

      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>ARCHIVE / SEARCHABLE</Text>
          <Text style={styles.sectionNumber}>02</Text>
        </View>
        <TextInput
          accessibilityLabel="Search snippets"
          onChangeText={setQuery}
          placeholder="Search saved text"
          placeholderTextColor="#8D98A8"
          style={styles.search}
          value={query}
        />
        <ActionButton
          label="Export archive (JSON)"
          variant="quiet"
          disabled={items.length === 0}
          onPress={exportItems}
        />
        {!isHydrated ? (

          <ActivityIndicator
            accessibilityLabel="Loading snippets"
            color="#4A90D9"
            style={styles.loading}
          />
        ) : filteredItems.length === 0 ? (
          <Text style={styles.empty}>
            {items.length === 0
              ? "No saved snippets yet. File your first useful line above."
              : "No saved snippets match this search."}
          </Text>
        ) : (
          filteredItems.map((item, index) => (
            <View
              key={item.id}
              style={[styles.snippet, item.pinned && styles.snippetPinned]}
            >
              <View style={styles.snippetMeta}>
                <Text style={styles.snippetIndex}>
                  {String(index + 1).padStart(2, "0")}
                </Text>
                <Text style={styles.snippetDate}>
                  {new Date(item.createdAt).toLocaleDateString()}
                </Text>
                {item.pinned ? <Text style={styles.pinnedLabel}>PINNED</Text> : null}
              </View>
              <Text selectable style={styles.snippetText}>
                {item.text}
              </Text>
              <View style={styles.snippetActions}>
                <ActionButton
                  label={copiedId === item.id ? "Copied" : "Copy"}
                  onPress={() => void copySnippet(item)}
                />
                <ActionButton
                  label={item.pinned ? "Unpin" : "Pin"}
                  onPress={() => togglePinned(item.id)}
                />
                <ActionButton
                  label="Delete"
                  onPress={() => deleteSnippet(item.id)}
                  variant="danger"
                />
              </View>
            </View>
          ))
        )}
      </View>

      <Text style={styles.footer}>
        LOCAL STORAGE / DEVICE ONLY / BOOKCHAOWALIT DEVELOPER TOOLS
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EEF2F6",
  },
  content: {
    paddingBottom: 36,
  },
  header: {
    backgroundColor: "#12243A",
    padding: 20,
    paddingTop: 18,
  },
  brand: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
  },
  eyebrow: {
    color: "#8EC5FF",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.4,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  status: {
    color: "#D9E7F5",
    fontSize: 12,
    letterSpacing: 0.4,
    marginTop: 18,
  },
  stats: {
    alignItems: "flex-end",
    marginTop: 16,
  },
  statValue: {
    color: "#FFFFFF",
    fontSize: 30,
    fontWeight: "800",
  },
  statLabel: {
    color: "#8EC5FF",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
  },
  intro: {
    padding: 20,
    paddingBottom: 10,
  },
  introTitle: {
    color: "#12243A",
    fontSize: 28,
    fontWeight: "800",
  },
  introText: {
    color: "#516173",
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    shadowColor: "#12243A",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  sectionLabel: {
    color: "#4A90D9",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.1,
  },
  sectionNumber: {
    color: "#A7B3C1",
    fontSize: 11,
    fontWeight: "800",
  },
  fieldLabel: {
    color: "#31445A",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 7,
  },
  composer: {
    backgroundColor: "#F5F8FB",
    borderColor: "#D9E2EC",
    borderRadius: 10,
    borderWidth: 1,
    color: "#12243A",
    fontSize: 15,
    minHeight: 110,
    padding: 12,
  },
  characterCount: {
    alignSelf: "flex-end",
    color: "#8D98A8",
    fontSize: 11,
    marginTop: 5,
  },
  buttonRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  actionButton: {
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 38,
    paddingHorizontal: 12,
  },
  actionButtonPrimary: {
    backgroundColor: "#4A90D9",
    borderColor: "#4A90D9",
  },
  actionButtonSecondary: {
    backgroundColor: "#FFFFFF",
    borderColor: "#B8C7D7",
  },
  actionButtonQuiet: {
    backgroundColor: "#F5F8FB",
    borderColor: "#F5F8FB",
  },
  actionButtonDanger: {
    backgroundColor: "#FFF7F5",
    borderColor: "#F0B6A9",
  },
  actionButtonPressed: {
    opacity: 0.72,
  },
  actionButtonDisabled: {
    opacity: 0.45,
  },
  actionButtonText: {
    color: "#31445A",
    fontSize: 13,
    fontWeight: "700",
  },
  actionButtonTextPrimary: {
    color: "#FFFFFF",
  },
  actionButtonTextSecondary: {
    color: "#31445A",
  },
  actionButtonTextQuiet: {
    color: "#66778A",
  },
  actionButtonTextDanger: {
    color: "#B64A35",
  },
  hint: {
    color: "#718196",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 12,
  },
  search: {
    backgroundColor: "#F5F8FB",
    borderColor: "#D9E2EC",
    borderRadius: 10,
    borderWidth: 1,
    color: "#12243A",
    fontSize: 15,
    padding: 12,
  },
  loading: {
    marginVertical: 28,
  },
  empty: {
    color: "#718196",
    fontSize: 14,
    lineHeight: 20,
    paddingVertical: 28,
    textAlign: "center",
  },
  snippet: {
    borderBottomColor: "#E7EDF3",
    borderBottomWidth: 1,
    paddingVertical: 16,
  },
  snippetPinned: {
    borderLeftColor: "#4A90D9",
    borderLeftWidth: 3,
    paddingLeft: 10,
  },
  snippetMeta: {
    alignItems: "center",
    flexDirection: "row",
    gap: 9,
  },
  snippetIndex: {
    color: "#4A90D9",
    fontSize: 11,
    fontWeight: "800",
  },
  snippetDate: {
    color: "#8D98A8",
    fontSize: 11,
  },
  pinnedLabel: {
    color: "#4A90D9",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  snippetText: {
    color: "#1C2E42",
    fontSize: 15,
    lineHeight: 22,
    marginTop: 10,
  },
  snippetActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  footer: {
    color: "#8D98A8",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    paddingHorizontal: 20,
    paddingTop: 24,
    textAlign: "center",
  },
});
