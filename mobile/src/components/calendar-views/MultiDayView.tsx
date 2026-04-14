import { useMemo, useRef, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useWindowDimensions } from "react-native";
import { colors } from "../../constants/colors";
import { format, isSameDay, addDays, startOfWeek, isToday } from "date-fns";

interface DayEvent {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  color: string;
}

interface Props<T extends DayEvent> {
  /** Anchor date — for "week" this picks the week; for "3day" it picks a rolling 3-day window. */
  date: Date;
  /** Number of days to show horizontally (3 or 7). */
  days: 3 | 7;
  events: T[];
  onEventPress: (event: T) => void;
  onEmptyPress: (day: Date, hour: number) => void;
}

const HOUR_HEIGHT = 60;
const START_HOUR = 0;
const END_HOUR = 24;
const TIME_COL_WIDTH = 48;

export function MultiDayView<T extends DayEvent>({
  date,
  days,
  events,
  onEventPress,
  onEmptyPress,
}: Props<T>) {
  const { width } = useWindowDimensions();
  const dayColumnWidth = Math.max(80, (width - TIME_COL_WIDTH) / days);
  const scrollRef = useRef<ScrollView | null>(null);

  const windowDays = useMemo(() => {
    if (days === 7) {
      const start = startOfWeek(date, { weekStartsOn: 1 });
      return Array.from({ length: 7 }, (_, i) => addDays(start, i));
    }
    // 3-day rolling window centered-ish on the selected date
    return Array.from({ length: 3 }, (_, i) => addDays(date, i));
  }, [date, days]);

  const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);

  // Auto-scroll to ~7am on first render so users start in the productive hours
  useEffect(() => {
    const t = setTimeout(() => {
      scrollRef.current?.scrollTo({ y: 7 * HOUR_HEIGHT, animated: false });
    }, 60);
    return () => clearTimeout(t);
  }, [date, days]);

  function placeEvent(event: T) {
    const start = new Date(event.start_time);
    const end = new Date(event.end_time);
    const startMins = start.getHours() * 60 + start.getMinutes() - START_HOUR * 60;
    const durationMins = Math.max((end.getTime() - start.getTime()) / 60000, 20);
    const top = (startMins / 60) * HOUR_HEIGHT;
    const height = Math.max((durationMins / 60) * HOUR_HEIGHT - 2, 22);
    return { top, height };
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Day headers */}
      <View style={styles.headerRow}>
        <View style={{ width: TIME_COL_WIDTH }} />
        {windowDays.map((d) => {
          const today = isToday(d);
          return (
            <View key={d.toISOString()} style={[styles.dayHeader, { width: dayColumnWidth }]}>
              <Text style={[styles.dowLabel, today && { color: colors.primary }]}>
                {format(d, "EEE").toUpperCase()}
              </Text>
              <View
                style={[
                  styles.dayNumberWrap,
                  today && { backgroundColor: colors.primary },
                ]}
              >
                <Text style={[styles.dayNumber, today && { color: colors.primaryForeground }]}>
                  {format(d, "d")}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: "row", minHeight: HOUR_HEIGHT * hours.length }}>
          {/* Hour labels */}
          <View style={{ width: TIME_COL_WIDTH }}>
            {hours.map((h) => (
              <View key={h} style={[styles.hourCell, { height: HOUR_HEIGHT }]}>
                <Text style={styles.hourLabel}>
                  {h === 0 ? "" : `${h % 12 === 0 ? 12 : h % 12} ${h < 12 ? "AM" : "PM"}`}
                </Text>
              </View>
            ))}
          </View>

          {/* Day columns */}
          {windowDays.map((day) => {
            const dayEvents = events.filter((e) => isSameDay(new Date(e.start_time), day));
            return (
              <View
                key={day.toISOString()}
                style={{ width: dayColumnWidth, borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: colors.border }}
              >
                {hours.map((h) => (
                  <TouchableOpacity
                    key={h}
                    style={[styles.hourSlot, { height: HOUR_HEIGHT }]}
                    activeOpacity={0.5}
                    onPress={() => onEmptyPress(day, h)}
                  />
                ))}

                {dayEvents.map((event) => {
                  const { top, height } = placeEvent(event);
                  return (
                    <TouchableOpacity
                      key={event.id}
                      onPress={() => onEventPress(event)}
                      activeOpacity={0.85}
                      style={[
                        styles.event,
                        {
                          top,
                          height,
                          backgroundColor: (event.color || colors.primary) + "33",
                          borderLeftColor: event.color || colors.primary,
                        },
                      ]}
                    >
                      <Text numberOfLines={1} style={styles.eventTitle}>
                        {event.title}
                      </Text>
                      {height > 28 && (
                        <Text style={styles.eventTime}>
                          {format(new Date(event.start_time), "h:mm a")}
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  dayHeader: { alignItems: "center", gap: 4, paddingVertical: 4 },
  dowLabel: { fontSize: 10, fontWeight: "700", color: colors.muted, letterSpacing: 0.5 },
  dayNumberWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  dayNumber: { fontSize: 13, fontWeight: "700", color: colors.foreground },
  hourCell: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingRight: 6,
    alignItems: "flex-end",
    justifyContent: "flex-start",
    paddingTop: 2,
  },
  hourLabel: { fontSize: 10, color: colors.muted, fontVariant: ["tabular-nums"] },
  hourSlot: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  event: {
    position: "absolute",
    left: 3,
    right: 3,
    borderRadius: 6,
    borderLeftWidth: 3,
    paddingVertical: 3,
    paddingHorizontal: 6,
    overflow: "hidden",
  },
  eventTitle: { fontSize: 11, fontWeight: "700", color: colors.foreground },
  eventTime: { fontSize: 9, color: colors.muted, marginTop: 1 },
});
