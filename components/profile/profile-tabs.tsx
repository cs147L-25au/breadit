import { Bookmark, Star } from "lucide-react-native";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Fonts, Colors } from "../../constants/Styles";

export type TabType = "reviews" | "saved";

interface ProfileTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export function ProfileTabs({ activeTab, onTabChange }: ProfileTabsProps) {
  const isReviews = activeTab === "reviews";
  const isSaved = activeTab === "saved";

  return (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[styles.tab, isReviews && styles.activeTab]}
        onPress={() => onTabChange("reviews")}
      >
        <Star size={18} color={isReviews ? Colors.primary : Colors.textLight} />
        <Text style={[styles.tabText, isReviews && styles.activeTabText]}>
          My Reviews
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, isSaved && styles.activeTab]}
        onPress={() => onTabChange("saved")}
      >
        <Bookmark
          size={18}
          color={isSaved ? Colors.primary : Colors.textLight}
        />
        <Text style={[styles.tabText, isSaved && styles.activeTabText]}>
          Saved Places
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 8,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.surface,
  },
  activeTab: {
    backgroundColor: "#fff3e1ff",
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontFamily: Fonts.semibold,
    color: Colors.textLight,
  },
  activeTabText: {
    color: Colors.primary,
  },
});
