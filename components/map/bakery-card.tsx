import { Image } from "expo-image";
import { MapPin, Star } from "lucide-react-native";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { BakeryWithReviews } from "../../lib/database.types";
import { Fonts, Colors } from "../../constants/Styles";

interface BakeryCardProps {
  bakery: BakeryWithReviews;
  isSelected: boolean;
  onPress: (bakery: BakeryWithReviews) => void;
}

export function BakeryCard({ bakery, isSelected, onPress }: BakeryCardProps) {
  const firstImage = bakery.reviews.find((r) => r.image_url)?.image_url;

  return (
    <TouchableOpacity
      onPress={() => onPress(bakery)}
      style={[styles.card, isSelected && styles.selectedCard]}
    >
      {firstImage ? (
        <Image
          source={{ uri: firstImage }}
          style={styles.image}
          contentFit="cover"
        />
      ) : (
        <View style={styles.imagePlaceholder}>
          <MapPin size={24} color={Colors.textLighter} />
        </View>
      )}
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>
          {bakery.name}
        </Text>
        <View style={styles.ratingRow}>
          <Star size={12} fill={Colors.primary} color={Colors.primary} />
          <Text style={styles.ratingText}>
            {bakery.averageRating > 0
              ? bakery.averageRating.toFixed(1)
              : "No ratings"}
          </Text>
          <Text style={styles.reviewCount}>({bakery.reviews.length})</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 160,
    marginLeft: 12,
    backgroundColor: Colors.background,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "transparent",
  },
  selectedCard: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  image: {
    width: "100%",
    height: 100,
  },
  imagePlaceholder: {
    width: "100%",
    height: 100,
    backgroundColor: Colors.borderLight,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    padding: 12,
  },
  name: {
    fontSize: 14,
    fontFamily: Fonts.semibold,
    color: Colors.text,
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontFamily: Fonts.semibold,
    color: Colors.textLight,
  },
  reviewCount: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: Colors.textLighter,
  },
});
