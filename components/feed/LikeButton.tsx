import { Heart } from "lucide-react-native";
import React, { memo } from "react";
import { Text, TouchableOpacity, StyleSheet } from "react-native";
import Reanimated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from "react-native-reanimated";
import { Colors, Fonts } from "../../constants/Styles";

interface LikeButtonProps {
  isLiked: boolean;
  likesCount: number;
  onPress: () => void;
}

function LikeButton({
  isLiked,
  likesCount,
  onPress,
}: LikeButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSequence(
      withSpring(1.3, { damping: 8, stiffness: 200 }),
      withSpring(1, { damping: 8, stiffness: 200 })
    );
    onPress();
  };

  return (
    <TouchableOpacity style={styles.actionButton} onPress={handlePress}>
      <Reanimated.View style={animatedStyle}>
        <Heart
          size={20}
          color={isLiked ? "#ef4444" : "#6b7280"}
          fill={isLiked ? "#ef4444" : "transparent"}
        />
      </Reanimated.View>
      <Text style={[styles.actionText, isLiked && styles.actionTextLiked]}>
        {likesCount}
      </Text>
    </TouchableOpacity>
  );
}

export default memo(LikeButton);

const styles = StyleSheet.create({
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionText: {
    marginLeft: 6,
    color: Colors.textLight,
    fontFamily: Fonts.medium,
    fontSize: 14,
  },
  actionTextLiked: {
    color: Colors.error,
  },
});
