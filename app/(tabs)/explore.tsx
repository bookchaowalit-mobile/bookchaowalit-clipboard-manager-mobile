import { Ionicons } from "@expo/vector-icons";
import { ScrollView, StyleSheet, Text, View } from "react-native";

const features = [
  {
    icon: "file-tray-stacked",
    title: "File snippets",
    description: "Keep reusable text in one small, searchable archive.",
  },
  {
    icon: "search",
    title: "Find fast",
    description: "Filter your saved lines without an account or network.",
  },
  {
    icon: "copy",
    title: "Copy on demand",
    description: "Send a saved snippet back to your workflow with one tap.",
  },
  {
    icon: "shield-checkmark",
    title: "Private by default",
    description: "Snippets stay on this device unless you choose to share them.",
  },
] as const;

export default function ExploreScreen() {
  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.container}>
      <View style={styles.header}>
        <Ionicons color="#4A90D9" name="compass" size={48} />
        <Text style={styles.title}>Explore</Text>
        <Text style={styles.subtitle}>
          A private shelf for text you reuse, designed for quick retrieval.
        </Text>
      </View>
      <View style={styles.featureList}>
        {features.map((feature) => (
          <View key={feature.title} style={styles.featureCard}>
            <Ionicons color="#4A90D9" name={feature.icon} size={28} />
            <View style={styles.featureCopy}>
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <Text style={styles.featureDescription}>{feature.description}</Text>
            </View>
          </View>
        ))}
      </View>
      <Text style={styles.note}>
        Clipboard access is explicit: the app reads or writes it only after you
        tap a clipboard action.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#EEF2F6",
    flex: 1,
  },
  content: {
    paddingBottom: 28,
  },
  header: {
    alignItems: "center",
    padding: 28,
    paddingBottom: 20,
  },
  title: {
    color: "#12243A",
    fontSize: 26,
    fontWeight: "800",
    marginTop: 10,
  },
  subtitle: {
    color: "#516173",
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
    textAlign: "center",
  },
  featureList: {
    gap: 12,
    paddingHorizontal: 16,
  },
  featureCard: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    flexDirection: "row",
    gap: 14,
    padding: 18,
    shadowColor: "#12243A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  featureCopy: {
    flex: 1,
  },
  featureTitle: {
    color: "#1C2E42",
    fontSize: 16,
    fontWeight: "700",
  },
  featureDescription: {
    color: "#718196",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },
  note: {
    color: "#718196",
    fontSize: 12,
    lineHeight: 18,
    paddingHorizontal: 24,
    paddingTop: 22,
    textAlign: "center",
  },
});
