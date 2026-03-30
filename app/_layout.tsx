import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import "./globals.css";

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    IrishGrover: require("../assets/fonts/IrishGrover-Regular.ttf"),
  });
  if (!fontsLoaded) {
    return null; // or a loading spinner
  }
  return (
    <Stack>
      <Stack.Screen
        name="landingscreens/index"
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="landingscreens/register"
        options={{ headerShown: false }}
      />

    </Stack>
  );
}
