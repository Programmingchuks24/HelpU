import { supabase } from "@/lib/supabase";
import type { Session } from "@supabase/supabase-js";
import { useFonts } from "expo-font";
import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as SplashScreen from 'expo-splash-screen'; // 1. Import Splash Screen
import "./globals.css";

// 2. Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [isReady, setIsReady] = useState(false);
  const segments = useSegments();
  const router = useRouter();

  const [fontsLoaded] = useFonts({
    IrishGrover: require("../assets/fonts/IrishGrover-Regular.ttf"),
  });

  useEffect(() => {
    // 3. Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsReady(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (_event === "PASSWORD_RECOVERY") {
        router.replace("/login/reset-password");
      }
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    // 4. Wait for everything to be ready before hiding Splash
    if (!isReady || !fontsLoaded) return;

    const inTabsGroup = segments[0] === "(tabs)";
    const isAllowedOutsideTabs = 
      segments[0] === "pick-interest" || 
      segments[0] === "counsellor" || 
      segments[0] === "messages";

    // Handle Auth Redirects
    if (session && !inTabsGroup && !isAllowedOutsideTabs) {
      router.replace("/(tabs)/home");
    } else if (!session && inTabsGroup) {
      router.replace("/landingscreens");
    }

    // 5. EVERYTHING IS LOADED: Hide the splash screen
    // We use a small timeout to ensure the navigation has actually happened
    const hideSplash = async () => {
      await SplashScreen.hideAsync();
    };
    hideSplash();

  }, [session, segments, isReady, fontsLoaded]);

  // 6. Return null while waiting (user only sees Splash Screen)
  if (!fontsLoaded || !isReady) return null;

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="landingscreens/index" />
        <Stack.Screen name="login/login" />
        <Stack.Screen name="login/signup" />
        <Stack.Screen name="pick-interest" options={{ presentation: "modal", headerShown: true }} />
      </Stack>
    </SafeAreaProvider>
  );
}