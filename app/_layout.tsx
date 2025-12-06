import { useEffect, useState } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { supabase } from "../lib/supabase";
import { ActivityIndicator, View } from "react-native";
import { useFonts } from "expo-font";
import {
  Karla_300Light,
  Karla_400Regular,
  Karla_500Medium,
  Karla_600SemiBold,
  Karla_700Bold,
  Karla_800ExtraBold,
} from "@expo-google-fonts/karla";

export default function RootLayout() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();

  // Load fonts
  const [fontsLoaded] = useFonts({
    Karla_300Light,
    Karla_400Regular,
    Karla_500Medium,
    Karla_600SemiBold,
    Karla_700Bold,
    Karla_800ExtraBold,
  });

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (loading || !fontsLoaded) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!session && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (session && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [session, segments, loading, fontsLoaded]);

  // Wait for both auth and fonts to load
  if (loading || !fontsLoaded) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#fff",
        }}
      >
        <ActivityIndicator size="large" color="#d97706" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="add-review" options={{ presentation: "modal" }} />
    </Stack>
  );
}
