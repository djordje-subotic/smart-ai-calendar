import { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Image, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { router } from "expo-router";
import { supabase } from "../../src/lib/supabase";
import { colors } from "../../src/constants/colors";
import { AvatarPicker, getDiceBearUrl, parseAvatarPreset } from "../../src/components/AvatarPicker";
import { format } from "date-fns";

const GOALS = ["Stay fit", "Learn new skills", "Read more", "Be productive", "Work-life balance", "Side project", "Eat healthier", "Save money"];
const HABITS = ["Morning workout", "Meditation", "Reading", "Journaling", "Walk", "Deep work", "Meal prep", "No phone before bed"];
const HOBBIES = ["Gaming", "Cooking", "Music", "Photography", "Hiking", "Drawing", "Writing", "Cycling"];
const PRIORITIES = ["Family time", "Career growth", "Health", "Learning", "Social life", "Rest", "Side projects"];
const CONSTRAINTS = ["Kids pickup at 16:00", "No meetings before 10", "Gym MWF only", "No work weekends"];

const MOTIVATION_STYLES = [
  { id: "friendly", label: "Friendly", desc: "Warm, supportive" },
  { id: "strict", label: "Strict Coach", desc: "Push you hard" },
  { id: "professional", label: "Professional", desc: "Clean, efficient" },
  { id: "hype", label: "Hype Man", desc: "Maximum energy!" },
] as const;

export default function ProfileScreen() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [displayName, setDisplayName] = useState("");
  const [avatarPreset, setAvatarPreset] = useState<string | null>(null);
  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(null);
  const [occupation, setOccupation] = useState("");
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [motto, setMotto] = useState("");
  const [motivationStyle, setMotivationStyle] = useState<string>("friendly");
  const [goals, setGoals] = useState<string[]>([]);
  const [habits, setHabits] = useState<string[]>([]);
  const [hobbies, setHobbies] = useState<string[]>([]);
  const [priorities, setPriorities] = useState<string[]>([]);
  const [constraints, setConstraints] = useState<string[]>([]);
  const [idealDay, setIdealDay] = useState("");

  useEffect(() => { load(); }, []);

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    if (data) {
      setDisplayName(data.display_name || "");
      setAvatarPreset(data.avatar_preset || null);
      setDateOfBirth(data.date_of_birth ? new Date(data.date_of_birth) : null);
      setOccupation(data.occupation || "");
      setBio(data.bio || "");
      setCity(data.city || "");
      setMotto(data.motto || "");
      setMotivationStyle(data.motivation_style || "friendly");
      setGoals(data.goals || []);
      setHabits(data.daily_habits || []);
      setHobbies(data.hobbies || []);
      setPriorities(data.priorities || []);
      setConstraints(data.constraints || []);
      setIdealDay(data.ideal_day || "");
    }
    setLoading(false);
  }

  function toggle(list: string[], setList: (v: string[]) => void, item: string) {
    setList(list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);
  }

  async function handleSave() {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("profiles").update({
        display_name: displayName || null,
        avatar_preset: avatarPreset,
        date_of_birth: dateOfBirth ? dateOfBirth.toISOString().split("T")[0] : null,
        occupation: occupation || null,
        bio: bio || null,
        city: city || null,
        motto: motto || null,
        motivation_style: motivationStyle,
        goals,
        daily_habits: habits,
        hobbies,
        priorities,
        constraints,
        ideal_day: idealDay || null,
        onboarding_completed: true,
      }).eq("id", user.id);
    }
    setSaving(false);
  }

  if (loading) {
    return <SafeAreaView style={[s.container, { justifyContent: "center", alignItems: "center" }]}><ActivityIndicator color={colors.primary} /></SafeAreaView>;
  }

  const avatarUrl = avatarPreset && avatarPreset.includes(":")
    ? getDiceBearUrl(avatarPreset.split(":")[0], avatarPreset.split(":")[1], 200)
    : null;

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.6}>
          <Ionicons name="chevron-back" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>My Profile</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color={colors.primary} size="small" /> : <Text style={s.saveLink}>Save</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Avatar + Identity */}
        <View style={s.avatarSection}>
          <TouchableOpacity onPress={() => setAvatarPickerOpen(true)} style={s.avatarWrap} activeOpacity={0.8}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={s.avatar} />
            ) : (
              <View style={s.avatarPlaceholder}>
                <Text style={s.avatarPlaceholderText}>{(displayName || "K")[0]?.toUpperCase()}</Text>
              </View>
            )}
            <View style={s.avatarEdit}>
              <Ionicons name="camera" size={14} color={colors.primaryForeground} />
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setAvatarPickerOpen(true)}>
            <Text style={s.changeAvatar}>Change avatar</Text>
          </TouchableOpacity>
        </View>

        {/* Profile Info */}
        <SectionTitle>Profile Info</SectionTitle>
        <Field label="Display name" value={displayName} onChange={setDisplayName} placeholder="How should Kron call you?" />

        <View style={s.row}>
          <View style={{ flex: 1 }}>
            <Label>Birthday</Label>
            <TouchableOpacity style={s.input} onPress={() => setShowDatePicker(true)}>
              <Text style={[s.inputText, !dateOfBirth && { color: colors.muted + "80" }]}>
                {dateOfBirth ? format(dateOfBirth, "MMM d, yyyy") : "Select date"}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={{ flex: 1 }}>
            <Label>City</Label>
            <TextInput style={s.input} value={city} onChangeText={setCity} placeholder="City" placeholderTextColor={colors.muted + "60"} />
          </View>
        </View>

        <Field label="Occupation" value={occupation} onChange={setOccupation} placeholder="Software Engineer..." />
        <Field label="Motto" value={motto} onChange={setMotto} placeholder="Discipline equals freedom..." />
        <Field label="Bio" value={bio} onChange={setBio} placeholder="Tell Kron about yourself..." multiline />

        {/* AI Personalization */}
        <SectionTitle>AI Personalization</SectionTitle>

        <Label>Kron's personality</Label>
        <View style={s.motivationGrid}>
          {MOTIVATION_STYLES.map((style) => (
            <TouchableOpacity
              key={style.id}
              style={[s.motivationCard, motivationStyle === style.id && s.motivationCardActive]}
              onPress={() => setMotivationStyle(style.id)}
            >
              <Text style={[s.motivationLabel, motivationStyle === style.id && { color: colors.primary }]}>{style.label}</Text>
              <Text style={s.motivationDesc}>{style.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <ChipSection label="Goals" items={GOALS} selected={goals} onToggle={(item) => toggle(goals, setGoals, item)} />
        <ChipSection label="Life Priorities" items={PRIORITIES} selected={priorities} onToggle={(item) => toggle(priorities, setPriorities, item)} />
        <ChipSection label="Daily Habits" items={HABITS} selected={habits} onToggle={(item) => toggle(habits, setHabits, item)} />
        <ChipSection label="Hobbies" items={HOBBIES} selected={hobbies} onToggle={(item) => toggle(hobbies, setHobbies, item)} />
        <ChipSection label="Constraints & Rules" items={CONSTRAINTS} selected={constraints} onToggle={(item) => toggle(constraints, setConstraints, item)} />

        <Field label="Your Ideal Day" value={idealDay} onChange={setIdealDay} placeholder="Wake 7, gym 7:30, deep work 9-12..." multiline />

        <TouchableOpacity style={s.saveBtn} onPress={handleSave} disabled={saving} activeOpacity={0.8}>
          {saving ? <ActivityIndicator color={colors.primaryForeground} /> : <Text style={s.saveBtnText}>Save Profile</Text>}
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>

      <AvatarPicker
        visible={avatarPickerOpen}
        currentPreset={avatarPreset}
        onSelect={setAvatarPreset}
        onClose={() => setAvatarPickerOpen(false)}
      />

      {showDatePicker && (
        <DateTimePicker
          value={dateOfBirth || new Date(2000, 0, 1)}
          mode="date"
          display={Platform.OS === "ios" ? "inline" : "default"}
          onChange={(_, date) => {
            setShowDatePicker(Platform.OS === "ios");
            if (date) setDateOfBirth(date);
          }}
        />
      )}
    </SafeAreaView>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <Text style={s.sectionTitle}>{children}</Text>;
}

function Label({ children }: { children: React.ReactNode }) {
  return <Text style={s.label}>{children}</Text>;
}

function Field({ label, value, onChange, placeholder, multiline }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; multiline?: boolean }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Label>{label}</Label>
      <TextInput
        style={[s.input, multiline && { height: 90, textAlignVertical: "top", paddingTop: 12 }]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.muted + "60"}
        multiline={multiline}
      />
    </View>
  );
}

function ChipSection({ label, items, selected, onToggle }: { label: string; items: string[]; selected: string[]; onToggle: (item: string) => void }) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Label>{label}</Label>
      <View style={s.chipGrid}>
        {items.map((item) => (
          <TouchableOpacity
            key={item}
            style={[s.chip, selected.includes(item) && s.chipActive]}
            onPress={() => onToggle(item)}
          >
            {selected.includes(item) && <Ionicons name="checkmark" size={11} color={colors.primary} />}
            <Text style={[s.chipText, selected.includes(item) && { color: colors.primary, fontWeight: "700" }]}>{item}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: colors.border },
  backBtn: { width: 40, height: 40, justifyContent: "center" },
  headerTitle: { fontSize: 16, fontWeight: "800", color: colors.foreground },
  saveLink: { fontSize: 15, color: colors.primary, fontWeight: "700" },
  scroll: { padding: 20 },

  avatarSection: { alignItems: "center", marginBottom: 24 },
  avatarWrap: { position: "relative" },
  avatar: { width: 100, height: 100, borderRadius: 28, backgroundColor: colors.accent },
  avatarPlaceholder: { width: 100, height: 100, borderRadius: 28, backgroundColor: colors.primary, justifyContent: "center", alignItems: "center" },
  avatarPlaceholderText: { fontSize: 42, fontWeight: "900", color: colors.primaryForeground },
  avatarEdit: { position: "absolute", bottom: -4, right: -4, width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primary, justifyContent: "center", alignItems: "center", borderWidth: 3, borderColor: colors.background },
  changeAvatar: { fontSize: 12, color: colors.primary, fontWeight: "700", marginTop: 10 },

  sectionTitle: { fontSize: 11, fontWeight: "800", color: colors.primary, letterSpacing: 1.5, textTransform: "uppercase", marginTop: 16, marginBottom: 12 },
  label: { fontSize: 12, fontWeight: "600", color: colors.mutedLight, marginBottom: 6 },
  input: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: colors.foreground },
  inputText: { fontSize: 15, color: colors.foreground },
  row: { flexDirection: "row", gap: 10, marginBottom: 12 },

  motivationGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  motivationCard: { width: "48%", backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 12 },
  motivationCardActive: { borderColor: colors.primary + "50", backgroundColor: colors.primary + "08" },
  motivationLabel: { fontSize: 13, fontWeight: "700", color: colors.foreground },
  motivationDesc: { fontSize: 10, color: colors.muted, marginTop: 2 },

  chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: { flexDirection: "row", alignItems: "center", gap: 4, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7 },
  chipActive: { borderColor: colors.primary + "50", backgroundColor: colors.primary + "10" },
  chipText: { fontSize: 12, color: colors.muted },

  saveBtn: { backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 16, alignItems: "center", marginTop: 20, shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12 },
  saveBtnText: { color: colors.primaryForeground, fontSize: 15, fontWeight: "800" },
});
