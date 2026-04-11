import { useState, useRef } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../src/lib/supabase";
import { colors } from "../../src/constants/colors";
import { format } from "date-fns";

interface Message {
  role: "user" | "assistant";
  content: string;
  events?: Array<{ title: string; start_time: string; end_time: string; color: string; recurrence?: any }>;
}

export default function AIScreen() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  async function handleSend() {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setLoading(true);

    const newMessages: Message[] = [...messages, { role: "user", content: userMsg }];
    setMessages(newMessages);

    try {
      // Call Supabase edge function or direct API
      // For now, create event directly from simple parsing
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Simple local parsing as fallback
      const now = new Date();
      const eventData = {
        title: userMsg,
        start_time: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 9, 0).toISOString(),
        end_time: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 10, 0).toISOString(),
        color: "#3B82F6",
        user_id: user.id,
        source: "ai",
      };

      const { error } = await supabase.from("events").insert(eventData);

      if (error) throw error;

      setMessages([...newMessages, {
        role: "assistant",
        content: `Added "${userMsg}" to your calendar for tomorrow at 9:00 AM.`,
        events: [{ title: userMsg, start_time: eventData.start_time, end_time: eventData.end_time, color: "#3B82F6" }],
      }]);
    } catch (err: any) {
      setMessages([...newMessages, { role: "assistant", content: `Error: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Kron AI</Text>
        <Text style={styles.subtitle}>Tell me what to schedule</Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ fontSize: 40, marginBottom: 16 }}>👑</Text>
            <Text style={styles.emptyTitle}>How can I help?</Text>
            <View style={styles.suggestions}>
              {["Rucak sutra u 13h", "Meeting every Monday 10am", "Napravi mi raspored"].map((s) => (
                <TouchableOpacity key={s} style={styles.suggestion} onPress={() => setInput(s)}>
                  <Text style={styles.suggestionText}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.msgBubble, item.role === "user" ? styles.userBubble : styles.aiBubble]}>
            <Text style={styles.msgText}>{item.content}</Text>
            {item.events?.map((evt: { title: string; start_time: string; end_time: string; color: string }, idx: number) => (
              <View key={idx} style={styles.eventCard}>
                <View style={[styles.eventDot, { backgroundColor: evt.color }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.eventTitle}>{evt.title}</Text>
                  <Text style={styles.eventTime}>
                    {format(new Date(evt.start_time), "EEE MMM d · HH:mm")} – {format(new Date(evt.end_time), "HH:mm")}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      />

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={90}>
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Tell Kron what you need..."
            placeholderTextColor={colors.muted}
            onSubmitEditing={handleSend}
            editable={!loading}
          />
          <TouchableOpacity style={styles.sendBtn} onPress={handleSend} disabled={loading || !input.trim()}>
            {loading ? (
              <ActivityIndicator size="small" color={colors.primaryForeground} />
            ) : (
              <Text style={styles.sendText}>↑</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12, borderBottomWidth: 0.5, borderBottomColor: colors.border },
  title: { fontSize: 20, fontWeight: "800", color: colors.foreground },
  subtitle: { fontSize: 12, color: colors.muted, marginTop: 2 },
  messagesList: { padding: 16, flexGrow: 1 },
  empty: { flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 80 },
  emptyTitle: { fontSize: 16, fontWeight: "600", color: colors.muted },
  suggestions: { marginTop: 20, gap: 8 },
  suggestion: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10 },
  suggestionText: { fontSize: 13, color: colors.muted },
  msgBubble: { maxWidth: "85%", borderRadius: 16, padding: 12, marginBottom: 10 },
  userBubble: { alignSelf: "flex-end", backgroundColor: `${colors.primary}20` },
  aiBubble: { alignSelf: "flex-start", backgroundColor: colors.card },
  msgText: { fontSize: 14, color: colors.foreground, lineHeight: 20 },
  eventCard: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: colors.accent, borderRadius: 10, padding: 10, marginTop: 8 },
  eventDot: { width: 8, height: 8, borderRadius: 4 },
  eventTitle: { fontSize: 13, fontWeight: "600", color: colors.foreground },
  eventTime: { fontSize: 11, color: colors.muted, marginTop: 2, fontVariant: ["tabular-nums"] },
  inputBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 0.5, borderTopColor: colors.border, gap: 10 },
  input: { flex: 1, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 24, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, color: colors.foreground },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary, justifyContent: "center", alignItems: "center" },
  sendText: { fontSize: 18, fontWeight: "700", color: colors.primaryForeground },
});
