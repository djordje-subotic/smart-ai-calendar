import { useEffect, useState } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useAuthStore } from "../src/stores/authStore";
import { supabase } from "../src/lib/supabase";
import { registerForPushNotifications, setupNotificationHandlers } from "../src/lib/notifications";
import { initDeepLinks } from "../src/lib/deepLinks";
import { OfflineBanner } from "../src/components/OfflineBanner";
import { colors } from "../src/constants/colors";
import { useTheme } from "../src/hooks/useTheme";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export default function RootLayout() {
  const { setSession } = useAuthStore();
  const { theme } = useTheme();
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Keep cached data usable while offline — React Query keeps it
            // in memory, offlineCache.ts persists across app restarts.
            staleTime: 60_000,
            gcTime: 10 * 60_000,
            retry: 2,
            retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 15_000),
            refetchOnReconnect: true,
            refetchOnWindowFocus: false,
            networkMode: "offlineFirst",
          },
          mutations: {
            retry: 0,
            networkMode: "offlineFirst",
          },
        },
      })
  );

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        registerForPushNotifications().catch(() => {});
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        registerForPushNotifications().catch(() => {});
      }
    });

    // Setup notification tap handler
    const cleanupNotifs = setupNotificationHandlers();

    // Setup deep link handler
    const cleanupLinks = initDeepLinks();

    return () => {
      subscription.unsubscribe();
      cleanupNotifs?.();
      cleanupLinks?.();
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
      <QueryClientProvider client={queryClient}>
        <StatusBar style={theme === "dark" ? "light" : "dark"} />
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.background },
              animation: "fade",
            }}
          />
          <OfflineBanner />
        </View>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
