import { Bookmark, MapPin } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";
import { formatDate, SavedPlace } from "./types";
import { Fonts, Colors } from "../../constants/Styles";

interface SavedPlaceCardProps {
  place: SavedPlace;
}

export function SavedPlaceCard({ place }: SavedPlaceCardProps) {
  return (
    <View style={styles.savedCard}>
      <View style={styles.savedIconContainer}>
        <MapPin size={24} color={Colors.primary} />
      </View>
      <View style={styles.savedContent}>
        <Text style={styles.savedName}>
          {place.bakeries?.name || "Unknown Bakery"}
        </Text>
        <Text style={styles.savedAddress} numberOfLines={2}>
          {place.bakeries?.address || "No address available"}
        </Text>
        <Text style={styles.savedDate}>
          Saved {formatDate(place.created_at)}
        </Text>
      </View>
      <Bookmark size={20} fill={Colors.primary} color={Colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  savedCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  savedIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  savedContent: {
    flex: 1,
  },
  savedName: {
    fontFamily: Fonts.semibold,
    fontSize: 15,
    color: Colors.text,
    marginBottom: 2,
  },
  savedAddress: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: Colors.textLight,
    lineHeight: 18,
  },
  savedDate: {
    fontSize: 11,
    fontFamily: Fonts.regular,
    color: Colors.textLighter,
    marginTop: 4,
  },
});
