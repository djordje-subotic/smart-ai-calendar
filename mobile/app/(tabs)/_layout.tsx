import { Tabs } from "expo-router";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../src/constants/colors";
import { KronCrown } from "../../src/components/KronLogo";

type IconName = keyof typeof Ionicons.glyphMap;

function TabIcon({ icon, label, focused }: { icon: IconName; label: string; focused: boolean }) {
  return (
    <View style={{ alignItems: "center", gap: 3, minWidth: 50 }}>
      <View style={{
        width: 36, height: 36, borderRadius: 12,
        backgroundColor: focused ? colors.primary + "18" : "transparent",
        justifyContent: "center", alignItems: "center",
        borderWidth: focused ? 1 : 0,
        borderColor: colors.primary + "30",
      }}>
        <Ionicons name={icon} size={20} color={focused ? colors.primary : colors.muted} />
      </View>
      <Text style={{
        fontSize: 9,
        fontWeight: focused ? "700" : "500",
        color: focused ? colors.primary : colors.muted,
        letterSpacing: 0.3,
      }}>
        {label}
      </Text>
    </View>
  );
}

function AITabIcon({ focused }: { focused: boolean }) {
  return (
    <View style={{ alignItems: "center", gap: 3, minWidth: 50 }}>
      <View style={{
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: focused ? colors.primary : colors.primary + "15",
        justifyContent: "center", alignItems: "center",
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: focused ? 0.4 : 0.1,
        shadowRadius: 8,
        elevation: focused ? 8 : 2,
        borderWidth: focused ? 0 : 1,
        borderColor: colors.primary + "30",
      }}>
        <KronCrown size={20} color={focused ? colors.primaryForeground : colors.primary} />
      </View>
      <Text style={{
        fontSize: 9,
        fontWeight: "700",
        color: focused ? colors.primary : colors.muted,
        letterSpacing: 0.3,
      }}>
        Kron AI
      </Text>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: 0.5,
          height: 88,
          paddingBottom: 24,
          paddingTop: 8,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.3,
          shadowRadius: 16,
          elevation: 20,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen name="calendar" options={{ tabBarIcon: ({ focused }) => <TabIcon icon="calendar-outline" label="Calendar" focused={focused} /> }} />
      <Tabs.Screen name="today" options={{ tabBarIcon: ({ focused }) => <TabIcon icon="sunny-outline" label="Today" focused={focused} /> }} />
      <Tabs.Screen name="ai" options={{ tabBarIcon: ({ focused }) => <AITabIcon focused={focused} /> }} />
      <Tabs.Screen name="habits" options={{ tabBarIcon: ({ focused }) => <TabIcon icon="flame-outline" label="Habits" focused={focused} /> }} />
      <Tabs.Screen name="more" options={{ tabBarIcon: ({ focused }) => <TabIcon icon="grid-outline" label="More" focused={focused} /> }} />
      <Tabs.Screen name="tasks" options={{ href: null }} />
      <Tabs.Screen name="profile" options={{ href: null }} />
      <Tabs.Screen name="friends" options={{ href: null }} />
      <Tabs.Screen name="tools" options={{ href: null }} />
      <Tabs.Screen name="settings" options={{ href: null }} />
    </Tabs>
  );
}
