import React, { useMemo, useEffect, useState } from "react";
import { StyleSheet, View, Dimensions } from "react-native";
import Animated, {
  withTiming,
  withDelay,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  useDerivedValue,
  runOnJS,
} from "react-native-reanimated";
import { Colors } from "../../constants/Styles";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Bezier formula for smooth curved animation paths
const bezierFormula = (
  from: number,
  to: number,
  control: number,
  t: number
): number => {
  "worklet";
  return (1 - t) * (1 - t) * from + 2 * (1 - t) * t * control + t * t * to;
};

interface BezierGemProps {
  from: { x: number; y: number };
  to: { x: number; y: number };
  bulge?: number;
  delay?: number;
  duration?: number;
  onComplete?: () => void;
  children: React.ReactNode;
}

// Individual gem that animates along a bezier curve
const BezierGem: React.FC<BezierGemProps> = ({
  from,
  to,
  bulge = 100,
  delay = 0,
  duration = 1500,
  onComplete,
  children,
}) => {
  const progress = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(0.3);

  useEffect(() => {
    // Scale up at start
    scale.value = withDelay(
      delay,
      withTiming(1, { duration: 200, easing: Easing.out(Easing.back(2)) })
    );

    // Main progress animation
    progress.value = withDelay(
      delay,
      withTiming(1, {
        duration: duration,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      })
    );

    // Fade out near the end
    opacity.value = withDelay(
      delay + duration * 0.7,
      withTiming(0, {
        duration: duration * 0.3,
        easing: Easing.out(Easing.ease),
      })
    );

    // Call onComplete after animation finishes
    if (onComplete) {
      const timeout = setTimeout(() => {
        onComplete();
      }, delay + duration + 100);
      return () => clearTimeout(timeout);
    }
  }, []);

  // Calculate control point for bezier curve to create the bulge effect
  const controlPoint = useMemo(() => {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const midX = (from.x + to.x) / 2;
    const midY = (from.y + to.y) / 2;
    const length = Math.sqrt(dx * dx + dy * dy);

    if (length === 0) return { x: midX, y: midY };

    // Perpendicular direction for the bulge
    const normalizedPerpX = -dy / length;
    const normalizedPerpY = dx / length;

    return {
      x: midX + normalizedPerpX * bulge,
      y: midY + normalizedPerpY * bulge,
    };
  }, [from, to, bulge]);

  // Derive x position from progress
  const x = useDerivedValue(() => {
    return bezierFormula(from.x, to.x, controlPoint.x, progress.value);
  });

  // Derive y position from progress
  const y = useDerivedValue(() => {
    return bezierFormula(from.y, to.y, controlPoint.y, progress.value);
  });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: x.value },
        { translateY: y.value },
        { scale: scale.value },
      ],
      opacity: opacity.value,
    };
  });

  return (
    <Animated.View style={[styles.gemContainer, animatedStyle]}>
      {children}
    </Animated.View>
  );
};

// Gem icon component - a diamond/gem shape
const GemIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 24,
  color = "#FFD700",
}) => {
  return (
    <View style={[styles.gem, { width: size, height: size }]}>
      <View
        style={[
          styles.gemTop,
          {
            borderBottomWidth: size * 0.35,
            borderLeftWidth: size / 2,
            borderRightWidth: size / 2,
            borderBottomColor: color,
          },
        ]}
      />
      <View
        style={[
          styles.gemBottom,
          {
            borderTopWidth: size * 0.65,
            borderLeftWidth: size / 2,
            borderRightWidth: size / 2,
            borderTopColor: color,
          },
        ]}
      />
    </View>
  );
};

interface GemAnimationProps {
  fromPosition: { x: number; y: number };
  toPosition: { x: number; y: number };
  gemCount?: number;
  pointsAwarded?: number;
  onAnimationComplete?: () => void;
}

// Main component that orchestrates multiple gems flying from source to destination
export const GemAnimation: React.FC<GemAnimationProps> = ({
  fromPosition,
  toPosition,
  gemCount = 6,
  pointsAwarded = 5,
  onAnimationComplete,
}) => {
  const [completedCount, setCompletedCount] = useState(0);

  // Generate gem configurations with varying bulge, delay, and duration
  const gems = useMemo(() => {
    const gemConfigs = [];
    for (let i = 0; i < gemCount; i++) {
      // Vary the bulge between -150 and 150 to create spread effect
      const bulge = (Math.random() - 0.5) * 300;
      // Stagger delays between 0 and 400ms
      const delay = Math.random() * 400;
      // Vary duration between 800 and 1400ms
      const duration = 800 + Math.random() * 600;
      // Random size variation
      const size = 16 + Math.random() * 12;
      // Gold color variations
      const colors = ["#FFD700", "#FFC107", "#FFAB00", "#FF8F00", "#FFE082"];
      const color = colors[Math.floor(Math.random() * colors.length)];

      gemConfigs.push({ bulge, delay, duration, size, color, id: i });
    }
    return gemConfigs;
  }, [gemCount]);

  // Handle completion callback in useEffect to avoid calling during render
  useEffect(() => {
    if (completedCount === gemCount && onAnimationComplete) {
      // Use setTimeout to ensure this runs after the current render cycle
      const timeout = setTimeout(() => {
        onAnimationComplete();
      }, 0);
      return () => clearTimeout(timeout);
    }
  }, [completedCount, gemCount, onAnimationComplete]);

  const handleGemComplete = () => {
    setCompletedCount((prev) => prev + 1);
  };

  return (
    <View style={styles.container} pointerEvents="none">
      {gems.map((gem) => (
        <BezierGem
          key={gem.id}
          from={fromPosition}
          to={toPosition}
          bulge={gem.bulge}
          delay={gem.delay}
          duration={gem.duration}
          onComplete={handleGemComplete}
        >
          <GemIcon size={gem.size} color={gem.color} />
        </BezierGem>
      ))}
    </View>
  );
};

// Points display component for the header
interface PointsDisplayProps {
  points: number;
  onLayout?: (position: { x: number; y: number }) => void;
}

export const PointsDisplay: React.FC<PointsDisplayProps> = ({
  points,
  onLayout,
}) => {
  const scale = useSharedValue(1);

  // Pulse animation when points change
  useEffect(() => {
    scale.value = withTiming(1.2, { duration: 150 }, () => {
      scale.value = withTiming(1, { duration: 150 });
    });
  }, [points]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handleLayout = (event: any) => {
    if (onLayout) {
      const { x, y, width, height } = event.nativeEvent.layout;
      // Calculate center of the points display
      onLayout({
        x: x + width / 2,
        y: y + height / 2,
      });
    }
  };

  return (
    <Animated.View
      style={[styles.pointsContainer, animatedStyle]}
      onLayout={handleLayout}
    >
      <GemIcon size={18} color="#FFD700" />
      <Animated.Text style={styles.pointsText}>{points}</Animated.Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
  gemContainer: {
    position: "absolute",
    top: 0,
    left: 0,
  },
  gem: {
    alignItems: "center",
    justifyContent: "center",
  },
  gemTop: {
    width: 0,
    height: 0,
    backgroundColor: "transparent",
    borderStyle: "solid",
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
  },
  gemBottom: {
    width: 0,
    height: 0,
    backgroundColor: "transparent",
    borderStyle: "solid",
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
  },
  pointsContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 215, 0, 0.15)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "rgba(255, 215, 0, 0.3)",
    gap: 6,
  },
  pointsText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#B8860B",
    letterSpacing: 0.5,
  },
});

export default GemAnimation;

