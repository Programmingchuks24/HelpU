import { supabase } from "@/lib/supabase"; // Path to your connection file
import type { Session } from "@supabase/supabase-js";
import { useFonts } from "expo-font";
import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "./globals.css";

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [isReady, setIsReady] = useState(false);
  const segments = useSegments();
  const router = useRouter();

  const [fontsLoaded] = useFonts({
    IrishGrover: require("../assets/fonts/IrishGrover-Regular.ttf"),
  });

  // 1. Listen for Auth Changes
  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsReady(true);
    });

    // Watch for login/logout events
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. Handle Redirects automatically
  useEffect(() => {
    if (!isReady || !fontsLoaded) return;

    const inTabsGroup = segments[0] === "(tabs)";
    const isPickInterest = segments[0] === "pick-interest";
    const isAllowedModal =
      segments[0] === "pick-interest" || segments[0] === "counsellor";

    if (session && !inTabsGroup && !isAllowedModal) {
      // User is logged in but not in the dashboard or allowed modal? Move them there.
      router.replace("/(tabs)/home");
    } else if (!session && inTabsGroup) {
      // User is NOT logged in but trying to see dashboard? Move to landing.
      router.replace("/landingscreens");
    }
  }, [session, segments, isReady, fontsLoaded, router]);

  if (!fontsLoaded || !isReady) return null;

  return (
    <SafeAreaProvider>
      <Stack>
        <Stack.Screen
          name="landingscreens/index"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="landingscreens/register"
          options={{ headerShown: false }}
        />
        <Stack.Screen name="login/login" options={{ headerShown: false }} />
        <Stack.Screen name="login/signup" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="pick-interest"
          options={{
            presentation: "modal",
            headerShown: true,
            title: "Select Interests",
          }}
        />
      </Stack>
    </SafeAreaProvider>
  );
}
