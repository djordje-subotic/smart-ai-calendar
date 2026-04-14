import { View, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useNetworkStatus } from "../hooks/useNetworkStatus";

/**
 * Floating banner that appears at the top of the screen when offline.
 * Uses absolute positioning so it overlays any screen without disturbing
 * their own safe-area handling.
 */
export function OfflineBanner() {
  const online = useNetworkStatus();
  const insets = useSafeAreaInsets();

  if (online) return null;

  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        paddingTop: insets.top,
        backgroundColor: "#facc15",
        zIndex: 1000,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          paddingVertical: 6,
          paddingHorizontal: 12,
        }}
      >
        <Feather name="wifi-off" size={12} color="#1f1a0b" />
        <Text style={{ fontSize: 11, fontWeight: "600", color: "#1f1a0b" }}>
          You&apos;re offline — showing cached data
        </Text>
      </View>
    </View>
  );
}
