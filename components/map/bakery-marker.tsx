import { Star } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";
import { Marker } from "react-native-maps";

import { BakeryWithReviews } from "../../lib/database.types";
import { Fonts, Colors } from "../../constants/Styles";

interface BakeryMarkerProps {
  bakery: BakeryWithReviews;
  onPress: (bakery: BakeryWithReviews) => void;
}

export function BakeryMarker({ bakery, onPress }: BakeryMarkerProps) {
  return (
    <Marker
      coordinate={{
        latitude: Number(bakery.latitude),
        longitude: Number(bakery.longitude),
      }}
      onPress={() => onPress(bakery)}
    >
      <View style={styles.container}>
        <View style={styles.bubble}>
          <Text style={styles.rating}>
            {bakery.averageRating > 0 ? bakery.averageRating.toFixed(1) : "–"}
          </Text>
          <Star size={10} fill="#fff" color="#fff" />
        </View>
        <View style={styles.arrow} />
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  bubble: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    gap: 2,
  },
  rating: {
    color: "#fff",
    fontSize: 12,
    fontFamily: Fonts.bold,
  },
  arrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: Colors.primary,
    marginTop: -1,
  },
});
