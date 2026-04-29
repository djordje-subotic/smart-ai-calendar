import { useRef, useEffect, useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { colors } from "../constants/colors";
import { addMonths, format, isSameMonth } from "date-fns";

interface Props {
  selected: Date;
  onSelect: (date: Date) => void;
}

export function MonthPicker({ selected, onSelect }: Props) {
  const scrollRef = useRef<ScrollView>(null);

  const now = useMemo(() => new Date(), []);
  const months = useMemo(
    () => Array.from({ length: 18 }, (_, i) => addMonths(now, i - 3)),
    [now],
  );

  useEffect(() => {
    const idx = months.findIndex((m) => isSameMonth(m, selected));
    if (idx >= 0 && scrollRef.current) {
      const t = setTimeout(() => scrollRef.current?.scrollTo({ x: idx * 72, animated: true }), 100);
      return () => clearTimeout(t);
    }
  }, [selected, months]);

  return (
    <View style={s.wrap}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.container}
      >
        {months.map((m) => {
          const active = isSameMonth(m, selected);
          return (
            <TouchableOpacity
              key={m.toISOString()}
              style={[s.chip, active && s.chipActive]}
              onPress={() => onSelect(m)}
              activeOpacity={0.7}
            >
              <Text style={[s.chipText, active && s.chipTextActive]}>
                {format(m, "MMM")}
              </Text>
              {format(m, "yyyy") !== format(now, "yyyy") && (
                <Text style={[s.yearText, active && { color: colors.primary }]}>
                  {format(m, "yy")}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { height: 48, maxHeight: 48 },
  container: { paddingHorizontal: 12, gap: 6, alignItems: "center", height: 48 },
  chip: {
    minWidth: 64,
    height: 32,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "transparent",
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 3,
  },
  chipActive: { backgroundColor: colors.primary + "18", borderColor: colors.primary },
  chipText: { fontSize: 13, color: colors.muted, fontWeight: "600" },
  chipTextActive: { color: colors.primary, fontWeight: "700" },
  yearText: { fontSize: 9, color: colors.muted, fontWeight: "500" },
});
