import { View, Text, StyleSheet } from "react-native";
import Svg, { Path, Circle, Rect, Defs, LinearGradient, Stop } from "react-native-svg";
import { colors } from "../constants/colors";

interface KrownaLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  showTagline?: boolean;
}

const SIZES = { sm: 24, md: 32, lg: 40, xl: 56 };

export function KrownaLogo({ size = "md", showText = true, showTagline = false }: KrownaLogoProps) {
  const s = SIZES[size];

  return (
    <View style={styles.container}>
      <Svg width={s} height={s} viewBox="0 0 40 40" fill="none">
        <Defs>
          <LinearGradient id="kg1" x1="0" y1="0" x2="40" y2="40">
            <Stop offset="0%" stopColor="#F59E0B" />
            <Stop offset="40%" stopColor="#EAB308" />
            <Stop offset="100%" stopColor="#F97316" />
          </LinearGradient>
          <LinearGradient id="kg2" x1="8" y1="8" x2="32" y2="32">
            <Stop offset="0%" stopColor="#FCD34D" />
            <Stop offset="100%" stopColor="#F59E0B" />
          </LinearGradient>
          <LinearGradient id="kg3" x1="20" y1="0" x2="20" y2="40">
            <Stop offset="0%" stopColor="#FBBF24" />
            <Stop offset="100%" stopColor="#D97706" />
          </LinearGradient>
        </Defs>
        <Rect x="4" y="6" width="32" height="30" rx="6" fill="url(#kg1)" opacity="0.08" />
        <Path
          d="M8 24L12 12L16.5 18L20 10L23.5 18L28 12L32 24"
          stroke="url(#kg3)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path d="M9 24L31 24" stroke="url(#kg2)" strokeWidth="2.5" strokeLinecap="round" />
        <Rect x="9" y="25" width="22" height="5" rx="2" fill="url(#kg1)" opacity="0.15" />
        <Rect x="9" y="25" width="22" height="5" rx="2" stroke="url(#kg2)" strokeWidth="1" opacity="0.3" />
        <Circle cx="20" cy="10" r="2" fill="url(#kg2)" />
        <Circle cx="12" cy="12.5" r="1.5" fill="#FBBF24" opacity="0.7" />
        <Circle cx="28" cy="12.5" r="1.5" fill="#FBBF24" opacity="0.7" />
        <Circle cx="15" cy="27.5" r="1" fill="#FCD34D" opacity="0.5" />
        <Circle cx="20" cy="27.5" r="1" fill="#FCD34D" opacity="0.7" />
        <Circle cx="25" cy="27.5" r="1" fill="#FCD34D" opacity="0.5" />
      </Svg>
      {showText && (
        <View>
          {/* Tightened type sizing — keeps the wordmark balanced next to the crown. */}
          <Text style={[styles.logoText, size === "xl" && { fontSize: 24 }, size === "lg" && { fontSize: 20 }]}>krowna</Text>
          {showTagline && <Text style={styles.tagline}>RULE YOUR TIME</Text>}
        </View>
      )}
    </View>
  );
}

// Small crown icon for tab bars and badges
export function KrownaCrown({ size = 20, color = colors.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 16L7 6L10 10L12 4L14 10L17 6L20 16"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M5 16L19 16" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Circle cx="12" cy="4.5" r="1.2" fill={color} />
    </Svg>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: "row", alignItems: "center", gap: 8 },
  logoText: { fontSize: 16, fontWeight: "900", color: colors.primary, letterSpacing: -1.2 },
  tagline: { fontSize: 8, fontWeight: "700", color: colors.muted, letterSpacing: 3, marginTop: 1 },
});
