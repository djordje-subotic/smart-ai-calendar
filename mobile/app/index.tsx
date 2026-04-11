import { Redirect } from "expo-router";
import { useAuthStore } from "../src/stores/authStore";
import { View, ActivityIndicator } from "react-native";
import { colors } from "../src/constants/colors";

export default function Index() {
  const { session, loading } = useAuthStore();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (session) {
    return <Redirect href="/(tabs)/calendar" />;
  }

  return <Redirect href="/(auth)/login" />;
}
