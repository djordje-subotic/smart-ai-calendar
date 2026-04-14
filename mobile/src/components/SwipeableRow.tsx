import { ReactNode } from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolateColor,
  useDerivedValue,
} from "react-native-reanimated";
import { haptic } from "../lib/haptics";

/**
 * Horizontal swipe row used for tasks / events / habits.
 *
 * - Swipe right → reveals green "complete" background, fires `onComplete` if
 *   released past the threshold.
 * - Swipe left → reveals red "delete" background, fires `onDelete` past
 *   threshold.
 *
 * Gesture uses pan + spring return. We avoid a 3rd-party swipe library because
 * we already depend on react-native-gesture-handler + reanimated v4.
 */

export type SwipeableRowProps = {
  children: ReactNode;
  onComplete?: () => void;
  onDelete?: () => void;
  completeLabel?: string;
  deleteLabel?: string;
  disabled?: boolean;
};

const THRESHOLD = 80;
const MAX_SWIPE = 140;
const COMPLETE_COLOR = "#16a34a";
const DELETE_COLOR = "#dc2626";

export function SwipeableRow({
  children,
  onComplete,
  onDelete,
  completeLabel = "Done",
  deleteLabel = "Delete",
  disabled = false,
}: SwipeableRowProps) {
  const translateX = useSharedValue(0);

  function triggerHaptic() {
    haptic.light();
  }

  const pan = Gesture.Pan()
    .enabled(!disabled)
    .activeOffsetX([-10, 10])
    .failOffsetY([-15, 15])
    .onUpdate((e) => {
      // Disable directions that aren't wired up.
      if (!onComplete && e.translationX > 0) return;
      if (!onDelete && e.translationX < 0) return;

      const next = Math.max(-MAX_SWIPE, Math.min(MAX_SWIPE, e.translationX));
      const prevPastThreshold = Math.abs(translateX.value) >= THRESHOLD;
      const nextPastThreshold = Math.abs(next) >= THRESHOLD;
      translateX.value = next;

      if (nextPastThreshold && !prevPastThreshold) {
        runOnJS(triggerHaptic)();
      }
    })
    .onEnd(() => {
      if (translateX.value > THRESHOLD && onComplete) {
        translateX.value = withTiming(MAX_SWIPE, { duration: 120 }, () => {
          runOnJS(onComplete)();
          translateX.value = withTiming(0, { duration: 200 });
        });
      } else if (translateX.value < -THRESHOLD && onDelete) {
        translateX.value = withTiming(-MAX_SWIPE, { duration: 120 }, () => {
          runOnJS(onDelete)();
          translateX.value = withTiming(0, { duration: 200 });
        });
      } else {
        translateX.value = withSpring(0, { damping: 18, stiffness: 240 });
      }
    });

  const rowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const bgColor = useDerivedValue(() => {
    if (translateX.value > 4) {
      return interpolateColor(
        translateX.value,
        [0, THRESHOLD, MAX_SWIPE],
        ["transparent", COMPLETE_COLOR + "55", COMPLETE_COLOR]
      );
    }
    if (translateX.value < -4) {
      return interpolateColor(
        -translateX.value,
        [0, THRESHOLD, MAX_SWIPE],
        ["transparent", DELETE_COLOR + "55", DELETE_COLOR]
      );
    }
    return "transparent";
  });

  const backgroundStyle = useAnimatedStyle(() => ({
    backgroundColor: bgColor.value,
  }));

  return (
    <View style={styles.wrapper}>
      <Animated.View style={[StyleSheet.absoluteFillObject, backgroundStyle, styles.bg]}>
        {/* Left side (shown when swiping right / completing) */}
        <View style={styles.side}>
          {onComplete && (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={styles.label}>{completeLabel}</Text>
            </>
          )}
        </View>
        <View style={styles.sideRight}>
          {onDelete && (
            <>
              <Text style={styles.label}>{deleteLabel}</Text>
              <Ionicons name="trash-outline" size={20} color="#fff" />
            </>
          )}
        </View>
      </Animated.View>
      <GestureDetector gesture={pan}>
        <Animated.View style={rowStyle}>{children}</Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 16,
  },
  bg: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    borderRadius: 16,
  },
  side: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sideRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginLeft: "auto",
  },
  label: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 12,
    ...Platform.select({
      ios: { letterSpacing: 0.3 },
      default: {},
    }),
  },
});
