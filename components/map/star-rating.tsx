import { Star } from "lucide-react-native";
import { View } from "react-native";
import { Colors } from "../../constants/Styles";

interface StarRatingProps {
  rating: number;
  size?: number;
  color?: string;
}

export function StarRating({
  rating,
  size = 16,
  color = Colors.primary,
}: StarRatingProps) {
  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating - fullStars >= 0.5;

  for (let i = 0; i < 5; i++) {
    if (i < fullStars) {
      stars.push(<Star key={i} size={size} fill={color} color={color} />);
    } else if (i === fullStars && hasHalfStar) {
      stars.push(
        <View key={i} style={{ position: "relative" }}>
          <Star size={size} color={color} />
          <View
            style={{
              position: "absolute",
              overflow: "hidden",
              width: size / 2,
            }}
          >
            <Star size={size} fill={color} color={color} />
          </View>
        </View>
      );
    } else {
      stars.push(<Star key={i} size={size} color={color} />);
    }
  }

  return <View style={{ flexDirection: "row", gap: 2 }}>{stars}</View>;
}
