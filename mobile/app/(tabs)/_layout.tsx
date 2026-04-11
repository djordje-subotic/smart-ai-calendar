import { Tabs } from "expo-router";
import { View, Text } from "react-native";
import { colors } from "../../src/constants/colors";

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = { calendar: "📅", today: "☀️", tasks: "✅", ai: "✨", settings: "⚙️" };
  return (
    <View style={{ alignItems: "center", gap: 2 }}>
      <Text style={{ fontSize: 20 }}>{icons[name] || "·"}</Text>
      <Text style={{ fontSize: 9, fontWeight: "600", color: focused ? colors.primary : colors.muted, textTransform: "capitalize" }}>
        {name}
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
          height: 80,
          paddingBottom: 20,
          paddingTop: 8,
        },
        tabBarShowLabel: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
      }}
    >
      <Tabs.Screen name="calendar" options={{ tabBarIcon: ({ focused }) => <TabIcon name="calendar" focused={focused} /> }} />
      <Tabs.Screen name="today" options={{ tabBarIcon: ({ focused }) => <TabIcon name="today" focused={focused} /> }} />
      <Tabs.Screen name="ai" options={{ tabBarIcon: ({ focused }) => <TabIcon name="ai" focused={focused} /> }} />
      <Tabs.Screen name="tasks" options={{ tabBarIcon: ({ focused }) => <TabIcon name="tasks" focused={focused} /> }} />
      <Tabs.Screen name="settings" options={{ tabBarIcon: ({ focused }) => <TabIcon name="settings" focused={focused} /> }} />
    </Tabs>
  );
}
