import { useState, useRef } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../src/lib/supabase";
import { colors } from "../../src/constants/colors";
import { speak } from "../../src/lib/voice";
import { haptic } from "../../src/lib/haptics";
import { KronCrown } from "../../src/components/KronLogo";
import { HeyKronButton } from "../../src/components/HeyKronButton";
import { format } from "date-fns";

interface ChatEvent { title: string; start_time: string; end_time: string; color: string; meeting_url?: string | null; recurrence?: any; }
interface ChatAction { type: "delete" | "move" | "update"; event_title: string; description: string; }
interface Message { role: "user" | "assistant"; content: string; events?: ChatEvent[]; actions?: ChatAction[]; eventsAdded?: boolean; }

const SUGGESTIONS = ["Plan my productive day ✨", "Trening sutra u 7 💪", "Meeting every Monday 📅", "Obrisi sve za danas 🗑️", "Focus block 90 min 🧠"];
const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

export default function AIScreen() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatHistory, setChatHistory] = useState<Array<{ role: string; content: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  async function handleSend() {
    if (!input.trim() || loading) return;
    haptic.light();
    const userMsg = input.trim();
    setInput("");
    setLoading(true);
    const newMessages: Message[] = [...messages, { role: "user", content: userMsg }];
    setMessages(newMessages);
    const newHistory = [...chatHistory, { role: "user", content: userMsg }];

    try {
      const res = await fetch(`${API_URL}/api/ai/chat`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newHistory, timezone: "Europe/Belgrade", voiceMode }),
      });
      const result = await res.json();
      if (result.error) throw new Error(result.error);
      const assistantMsg: Message = { role: "assistant", content: result.message, events: result.events || [], actions: result.actions || [] };
      setMessages([...newMessages, assistantMsg]);
      setChatHistory([...newHistory, { role: "assistant", content: result.message }]);
      if (voiceMode && result.message) { speak(result.message).catch(() => {}); }
    } catch (err: any) {
      // Fallback
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const now = new Date();
        const { error: insertErr } = await supabase.from("events").insert({ title: userMsg, start_time: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 9, 0).toISOString(), end_time: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 10, 0).toISOString(), color: "#3B82F6", user_id: user.id, source: "ai" });
        if (insertErr) { setMessages([...newMessages, { role: "assistant", content: `Failed: ${insertErr.message}` }]); }
        else { setMessages([...newMessages, { role: "assistant", content: `Added "${userMsg}" tomorrow at 9:00 AM.`, events: [{ title: userMsg, start_time: "", end_time: "", color: "#3B82F6" }] }]); }
      } else {
        setMessages([...newMessages, { role: "assistant", content: `Error: ${err?.message || "Unknown"}` }]);
      }
    } finally { setLoading(false); }
  }

  async function handleAddAllEvents(msgIdx: number, events: ChatEvent[]) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    for (const event of events) {
      await supabase.from("events").insert({ user_id: user.id, title: event.title, start_time: event.start_time, end_time: event.end_time, color: event.color || "#3B82F6", recurrence_rule: event.recurrence || null, meeting_url: event.meeting_url || null, source: "ai", status: "confirmed", all_day: false, reminder_minutes: [15] });
    }
    haptic.success();
    setMessages((prev) => prev.map((m, i) => i === msgIdx ? { ...m, eventsAdded: true } : m));
  }

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <View style={s.logoBadge}><KronCrown size={18} /></View>
          <View>
            <Text style={s.headerTitle}>Kron AI</Text>
            <Text style={s.headerSubtitle}>Your personal time manager</Text>
          </View>
        </View>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <TouchableOpacity
            style={[s.headerBtn, voiceMode && s.headerBtnActive]}
            onPress={() => setVoiceMode(!voiceMode)}
            activeOpacity={0.7}
          >
            <Text style={s.headerBtnText}>{voiceMode ? "🔊" : "🔇"}</Text>
          </TouchableOpacity>
          {messages.length > 0 && (
            <TouchableOpacity style={s.headerBtn} onPress={() => { setMessages([]); setChatHistory([]); }} activeOpacity={0.7}>
              <Text style={s.headerBtnText}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={s.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={s.empty}>
            <View style={s.emptyGlow}><KronCrown size={40} /></View>
            <Text style={s.emptyTitle}>How can I help?</Text>
            <Text style={s.emptySubtitle}>Create events, manage schedule, or ask anything</Text>
            <View style={s.suggestionsGrid}>
              {SUGGESTIONS.map((sug) => (
                <TouchableOpacity key={sug} style={s.suggestion} onPress={() => setInput(sug.replace(/[✨💪📅🗑️🧠]/g, "").trim())} activeOpacity={0.7}>
                  <Text style={s.suggestionText}>{sug}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        }
        renderItem={({ item, index }) => (
          <View style={[s.bubble, item.role === "user" ? s.userBubble : s.aiBubble]}>
            {item.role === "assistant" && <View style={s.aiIndicator}><Text style={{ fontSize: 10 }}>✨</Text></View>}
            <Text style={s.bubbleText}>{item.content}</Text>

            {/* Events */}
            {item.events && item.events.length > 0 && (
              <View style={{ marginTop: 10, gap: 6 }}>
                {item.events.map((evt: ChatEvent, idx: number) => (
                  <View key={idx} style={[s.eventCard, { borderLeftColor: evt.color }]}>
                    <View style={[s.eventDot, { backgroundColor: evt.color }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={s.eventTitle}>{evt.title}</Text>
                      {evt.start_time ? <Text style={s.eventTime}>{format(new Date(evt.start_time), "EEE MMM d · HH:mm")} – {format(new Date(evt.end_time), "HH:mm")}</Text> : null}
                    </View>
                    {evt.meeting_url && <Text style={{ fontSize: 12 }}>📹</Text>}
                  </View>
                ))}
                {!item.eventsAdded ? (
                  <TouchableOpacity style={s.addAllBtn} onPress={() => handleAddAllEvents(index, item.events!)} activeOpacity={0.8}>
                    <Text style={s.addAllText}>✓ Add all ({item.events.length}) to calendar</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={s.addedBadge}><Text style={s.addedText}>✓ Added to calendar</Text></View>
                )}
              </View>
            )}

            {/* Actions */}
            {item.actions && item.actions.length > 0 && (
              <View style={{ marginTop: 8, gap: 4 }}>
                {item.actions.map((action: ChatAction, idx: number) => (
                  <View key={idx} style={s.actionCard}>
                    <Text style={{ fontSize: 14 }}>{action.type === "delete" ? "🗑️" : action.type === "move" ? "📦" : "✏️"}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={s.actionTitle}>{action.event_title}</Text>
                      <Text style={s.actionDesc}>{action.description}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      />

      {loading && (
        <View style={s.loadingBar}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={s.loadingText}>Thinking...</Text>
        </View>
      )}

      {/* Input */}
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={90}>
        <View style={s.inputBar}>
          <TextInput
            style={s.input}
            value={input}
            onChangeText={setInput}
            placeholder="Tell Kron or hold mic..."
            placeholderTextColor={colors.muted + "60"}
            onSubmitEditing={handleSend}
            editable={!loading}
            returnKeyType="send"
          />
          {input.trim() ? (
            <TouchableOpacity
              style={[s.sendBtn, loading && { opacity: 0.3 }]}
              onPress={handleSend}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Text style={s.sendText}>↑</Text>
            </TouchableOpacity>
          ) : (
            <HeyKronButton compact onTranscript={(text) => setInput(text)} />
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 4, paddingBottom: 12, borderBottomWidth: 0.5, borderBottomColor: colors.border },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  logoBadge: { width: 36, height: 36, borderRadius: 12, backgroundColor: colors.primary + "15", justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: colors.primary + "25" },
  headerTitle: { fontSize: 18, fontWeight: "800", color: colors.foreground },
  headerSubtitle: { fontSize: 11, color: colors.muted, marginTop: 1 },
  headerBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, backgroundColor: colors.accent, borderWidth: 1, borderColor: colors.border },
  headerBtnActive: { backgroundColor: colors.primary + "15", borderColor: colors.primary + "30" },
  headerBtnText: { fontSize: 12, color: colors.muted, fontWeight: "600" },
  messagesList: { padding: 16, flexGrow: 1 },
  empty: { flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 40 },
  emptyGlow: { width: 88, height: 88, borderRadius: 44, backgroundColor: colors.primary + "08", justifyContent: "center", alignItems: "center", marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: colors.foreground },
  emptySubtitle: { fontSize: 13, color: colors.muted, marginTop: 4, textAlign: "center" },
  suggestionsGrid: { marginTop: 24, gap: 8, width: "100%" },
  suggestion: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 16, paddingHorizontal: 18, paddingVertical: 12 },
  suggestionText: { fontSize: 14, color: colors.mutedLight, textAlign: "center" },
  bubble: { maxWidth: "88%", borderRadius: 20, padding: 14, marginBottom: 10 },
  userBubble: { alignSelf: "flex-end", backgroundColor: colors.primary + "15", borderBottomRightRadius: 4 },
  aiBubble: { alignSelf: "flex-start", backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderBottomLeftRadius: 4 },
  aiIndicator: { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.primary + "15", justifyContent: "center", alignItems: "center", marginBottom: 6 },
  bubbleText: { fontSize: 15, color: colors.foreground, lineHeight: 22 },
  eventCard: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: colors.accent, borderRadius: 12, padding: 12, borderLeftWidth: 3 },
  eventDot: { width: 8, height: 8, borderRadius: 4 },
  eventTitle: { fontSize: 13, fontWeight: "700", color: colors.foreground },
  eventTime: { fontSize: 11, color: colors.muted, marginTop: 2, fontVariant: ["tabular-nums"] },
  addAllBtn: { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 12, alignItems: "center", shadowColor: colors.primary, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 8 },
  addAllText: { color: colors.primaryForeground, fontSize: 14, fontWeight: "800" },
  addedBadge: { backgroundColor: colors.green + "15", borderRadius: 12, paddingVertical: 10, alignItems: "center", borderWidth: 1, borderColor: colors.green + "30" },
  addedText: { color: colors.green, fontSize: 13, fontWeight: "700" },
  actionCard: { flexDirection: "row", alignItems: "flex-start", gap: 10, backgroundColor: colors.primary + "08", borderWidth: 1, borderColor: colors.primary + "20", borderRadius: 12, padding: 12 },
  actionTitle: { fontSize: 13, fontWeight: "700", color: colors.foreground },
  actionDesc: { fontSize: 11, color: colors.muted, marginTop: 2 },
  loadingBar: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 10, backgroundColor: colors.card, borderTopWidth: 0.5, borderTopColor: colors.border },
  loadingText: { fontSize: 13, color: colors.primary, fontWeight: "600" },
  inputBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 10, borderTopWidth: 0.5, borderTopColor: colors.border, gap: 10, backgroundColor: colors.card },
  input: { flex: 1, backgroundColor: colors.accent, borderWidth: 1.5, borderColor: colors.border, borderRadius: 20, paddingHorizontal: 18, paddingVertical: 13, fontSize: 16, color: colors.foreground },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, justifyContent: "center", alignItems: "center", shadowColor: colors.primary, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.4, shadowRadius: 8 },
  sendText: { fontSize: 20, fontWeight: "800", color: colors.primaryForeground },
});
