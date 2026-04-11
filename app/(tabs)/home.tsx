import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  ScrollView,
  Image,
} from "react-native";
import { supabase } from "@/lib/supabase"; // Adjust path if needed
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { use, useCallback, useEffect, useState } from "react";
import { images } from "@/constants/images";
import { router, useFocusEffect } from "expo-router";

export default function Home() {
  const insets = useSafeAreaInsets();

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState<any[]>([]); // NEW: State for matched counsellor/teacher

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.log("Error logging out:", error.message);
    // You don't need router.replace here.
    // The RootLayout listener will see the session is null and kick you to the landing page!
  };

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, []),
  );

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    if (!profile) setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      // 1. Get Logged-in User Profile
      const { data: userData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      setProfile(userData);

      // 2. Fetch Matching Users
      if (userData?.interests && userData.interests.length > 0) {
        // If I am a student, find counsellors. If I am a counsellor, find students.
        const targetRole =
          userData.role === "student" ? "counsellor" : "student";

        const { data: matchData, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("role", targetRole)
          .overlaps("interests", userData.interests);

        if (!error) setMatches(matchData);
      }
    }
    setLoading(false);
  };
  if (loading) return <ActivityIndicator className="flex-1" />;

  return (
    <View className="flex-1 bg-[#F6F4F0]" style={{ paddingTop: insets.top }}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 20 }}
      >
        {/* Header Section */}
        <View className="flex-row justify-between items-center mb-6">
          <Image source={images.logo} className="w-20 h-20" />
          <Pressable
            onPress={handleSignOut}
            className="bg-red-500 px-4 py-2 rounded-full"
          >
            <Text className="text-white font-bold">Sign Out</Text>
          </Pressable>
        </View>

        <Text className="text-xl font-semibold">
          Hello, {profile?.full_name || "User"}!
        </Text>

        <View className="mt-14">
          <Text className="text-2xl font-bold">Home</Text>

          <Text className="mt-3 text-xl font-bold">
            {profile?.role === "counsellor"
              ? "Student Matches"
              : "Counsellor Matches"}
          </Text>
          {/* CHECK: If user has no interests, show the "Match" UI */}
          {!profile?.interests || profile?.interests?.length === 0 ? (
            <View className="justify-center items-center mt-14 bg-white p-8 rounded-3xl shadow-sm">
              <Text className="text-lg font-semibold text-center">
                You haven&apos;t matched with a counsellor yet.
              </Text>
              <Text className="text-gray-400 text-center mt-2">
                Pick your interests to find the right person for you.
              </Text>

              <Pressable
                onPress={() => router.push("/pick-interest")} // Open the modal
                className="bg-black px-8 py-4 rounded-full mt-6 justify-center items-center"
              >
                <Text className="text-white font-bold">Click to match</Text>
              </Pressable>
            </View>
          ) : (
            // SUCCESS STATE: Show matches or a different welcome message
            <View className="mt-10">
              <Text className="text-lg font-bold text-[#00822F]">
                Matching active for: {profile.interests.join(", ")}
              </Text>
              {/* This is where you would map through your Teachers/Counsellors list */}

              {matches.length > 0 ? (
                matches.map((item) => (
                  <View
                    key={item.id}
                    className="bg-white p-5 rounded-2xl mb-4 shadow-sm"
                  >
                    <View className="flex-row justify-between items-center">
                      <View>
                        <Text className="text-lg font-bold">
                          {item.full_name}
                        </Text>
                        <Text className="text-xs text-green-600 font-semibold uppercase tracking-wider">
                          {item.role}
                        </Text>
                      </View>
                      <Pressable className="bg-black px-4 py-2 rounded-full">
                        <Text className="text-white text-sm font-bold">
                          Message
                        </Text>
                      </Pressable>
                    </View>

                    <View className="flex-row flex-wrap mt-3 gap-2">
                      {item.interests.map((tag: string) => (
                        <View
                          key={tag}
                          className="bg-gray-100 px-3 py-1 rounded-full"
                        >
                          <Text className="text-gray-600 text-xs">{tag}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ))
              ) : (
                <Text className="text-gray-400 text-center mt-10">
                  No matches found for your interests yet.
                </Text>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
