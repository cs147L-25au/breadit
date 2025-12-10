import { MessageCircle } from "lucide-react-native";
import React, { memo } from "react";
import { Text, TouchableOpacity, StyleSheet } from "react-native";
import Reanimated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from "react-native-reanimated";
import { Colors, Fonts } from "../../constants/Styles";

interface CommentButtonProps {
  commentsCount: number;
  onPress: () => void;
}

function CommentButton({
  commentsCount,
  onPress,
}: CommentButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSequence(
      withSpring(1.2, { damping: 8 }),
      withSpring(1, { damping: 8 })
    );
    onPress();
  };

  return (
    <TouchableOpacity style={styles.actionButton} onPress={handlePress}>
      <Reanimated.View style={animatedStyle}>
        <MessageCircle size={20} color="#6b7280" />
      </Reanimated.View>
      <Text style={styles.actionText}>{commentsCount}</Text>
    </TouchableOpacity>
  );
}

export default memo(CommentButton);

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
});
