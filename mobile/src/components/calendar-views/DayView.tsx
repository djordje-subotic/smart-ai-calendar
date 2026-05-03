import { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, PanResponder, Animated } from "react-native";
import { colors } from "../../constants/colors";
import { format, isSameDay } from "date-fns";
import { haptic } from "../../lib/haptics";

interface DayEvent {
  id: string; title: string; start_time: string; end_time: string; color: string;
}

interface Props<T extends DayEvent> {
  date: Date;
  events: T[];
  onEventPress: (event: T) => void;
  onEventMove?: (eventId: string, newStart: Date) => void;
  onEmptyPress: (hour: number) => void;
}

const HOUR_HEIGHT = 60;
const START_HOUR = 0;
const END_HOUR = 24;
const TIME_COL = 56;

export function DayView<T extends DayEvent>({ date, events, onEventPress, onEventMove, onEmptyPress }: Props<T>) {
  const dayEvents = events.filter((e) => isSameDay(new Date(e.start_time), date));
  const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  function getEventStyle(event: T) {
    const start = new Date(event.start_time);
    const end = new Date(event.end_time);
    const startMins = start.getHours() * 60 + start.getMinutes() - START_HOUR * 60;
    const durationMins = (end.getTime() - start.getTime()) / 60000;
    const top = (startMins / 60) * HOUR_HEIGHT;
    const height = Math.max((durationMins / 60) * HOUR_HEIGHT - 2, 24);
    return { top, height };
  }

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={s.dayHeader}>
        <Text style={s.dayOfWeek}>{format(date, "EEE").toUpperCase()}</Text>
        <Text style={s.dayNumber}>{format(date, "d")}</Text>
      </View>

      <View style={s.timelineContainer}>
        {/* Hour rows */}
        {hours.map((h) => (
          <TouchableOpacity
            key={h}
            style={s.hourRow}
            onPress={() => onEmptyPress(h)}
            activeOpacity={0.6}
          >
            <View style={s.timeCol}>
              <Text style={s.timeText}>{h.toString().padStart(2, "0")}:00</Text>
            </View>
            <View style={s.hourLine} />
          </TouchableOpacity>
        ))}

        {/* Events positioned absolutely */}
        {dayEvents.map((event) => {
          const style = getEventStyle(event);
          return (
            <DraggableEvent
              key={event.id}
              event={event}
              top={style.top}
              height={style.height}
              onPress={() => onEventPress(event)}
              onLongPress={() => {
                haptic.medium();
                setDraggingId(event.id);
              }}
              onDragEnd={(newTop) => {
                if (!onEventMove) return;
                const newHour = Math.round(newTop / HOUR_HEIGHT * 4) / 4; // snap to 15min
                const newStart = new Date(date);
                newStart.setHours(Math.floor(newHour), (newHour % 1) * 60, 0, 0);
                onEventMove(event.id, newStart);
                setDraggingId(null);
              }}
              isDragging={draggingId === event.id}
            />
          );
        })}

        {/* Now line (if today) */}
        {isSameDay(date, new Date()) && <NowLine />}
      </View>
    </ScrollView>
  );
}

function DraggableEvent({
  event, top, height, onPress, onLongPress, onDragEnd, isDragging,
}: {
  event: DayEvent; top: number; height: number;
  onPress: () => void; onLongPress: () => void; onDragEnd: (newTop: number) => void; isDragging: boolean;
}) {
  const [pan] = useState(() => new Animated.Value(0));
  const [active, setActive] = useState(false);
  const latestTop = useRef(top);
  // Keep the latest closures available to the long-lived PanResponder.
  const stateRef = useRef({ active, top, onDragEnd });
  useEffect(() => {
    stateRef.current = { active, top, onDragEnd };
  }, [active, top, onDragEnd]);

  const [panResponder] = useState(() =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: () => stateRef.current.active,
      onPanResponderGrant: () => {
        pan.setValue(0);
      },
      onPanResponderMove: (_, gesture) => {
        pan.setValue(gesture.dy);
        latestTop.current = stateRef.current.top + gesture.dy;
      },
      onPanResponderRelease: () => {
        stateRef.current.onDragEnd(latestTop.current);
        setActive(false);
        pan.setValue(0);
        haptic.success();
      },
      onPanResponderTerminate: () => {
        setActive(false);
        pan.setValue(0);
      },
    })
  );

  return (
    <Animated.View
      style={[
        s.event,
        {
          top,
          height,
          backgroundColor: event.color + (active ? "60" : "30"),
          borderLeftColor: event.color,
          transform: [{ translateY: pan }, { scale: active ? 1.02 : 1 }],
          zIndex: active ? 100 : 1,
          shadowOpacity: active ? 0.4 : 0,
          elevation: active ? 8 : 0,
        },
      ]}
      {...panResponder.panHandlers}
    >
      <TouchableOpacity
        style={{ flex: 1, paddingHorizontal: 8, paddingVertical: 4 }}
        onPress={onPress}
        onLongPress={() => { onLongPress(); setActive(true); }}
        delayLongPress={300}
        activeOpacity={0.8}
      >
        <Text style={s.eventTitle} numberOfLines={height < 30 ? 1 : 2}>
          {event.title}
        </Text>
        {height > 36 && (
          <Text style={s.eventTime}>
            {format(new Date(event.start_time), "HH:mm")} – {format(new Date(event.end_time), "HH:mm")}
          </Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

function NowLine() {
  const now = new Date();
  const mins = now.getHours() * 60 + now.getMinutes() - START_HOUR * 60;
  const top = (mins / 60) * HOUR_HEIGHT;
  return (
    <View style={[s.nowLine, { top }]}>
      <View style={s.nowDot} />
      <View style={s.nowStripe} />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  dayHeader: { flexDirection: "row", alignItems: "center", gap: 16, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: colors.border },
  dayOfWeek: { fontSize: 11, fontWeight: "700", color: colors.primary, letterSpacing: 0.5 },
  dayNumber: { fontSize: 28, fontWeight: "900", color: colors.foreground },
  timelineContainer: { position: "relative" },
  hourRow: { flexDirection: "row", height: HOUR_HEIGHT, borderBottomWidth: 0.5, borderBottomColor: colors.border + "30" },
  timeCol: { width: TIME_COL, alignItems: "flex-end", paddingRight: 6, paddingTop: -6 },
  timeText: { fontSize: 10, color: colors.muted, fontVariant: ["tabular-nums"], marginTop: -6, fontWeight: "600" },
  hourLine: { flex: 1 },
  event: {
    position: "absolute",
    left: TIME_COL + 4,
    right: 8,
    borderRadius: 8,
    borderLeftWidth: 3,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
  },
  eventTitle: { fontSize: 12, fontWeight: "700", color: colors.foreground },
  eventTime: { fontSize: 10, color: colors.foreground + "99", marginTop: 2, fontVariant: ["tabular-nums"] },
  nowLine: { position: "absolute", left: TIME_COL, right: 0, flexDirection: "row", alignItems: "center", zIndex: 50 },
  nowDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary, marginLeft: -5 },
  nowStripe: { flex: 1, height: 2, backgroundColor: colors.primary },
});
