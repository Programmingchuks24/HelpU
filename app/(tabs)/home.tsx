import { images } from "@/constants/images";
import { supabase } from "@/lib/supabase"; // Adjust path if needed
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function Home() {
  const insets = useSafeAreaInsets();

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);

  const fetchAppointments = async (userId: string, role: string) => {
    const column = role === "student" ? "student_id" : "counsellor_id";

    // We want to fetch the 'other' person's name
    // If I'm a student, join the counsellor's name.
    // If I'm a counsellor, join the student's name.
    const profileJoin = role === "student" ? "counsellor_id" : "student_id";

    const { data, error } = await supabase
      .from("appointments")
      .select(
        `
      *,
      person: ${profileJoin} (full_name, username)
    `,
      )
      .eq(column, userId)
      .order("appointment_date", { ascending: true });

    if (!error) setAppointments(data);
  };

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

      // 3. Fetch Appointments
      if (userData?.role) {
        await fetchAppointments(user.id, userData.role);
      }
    }
    setLoading(false);
  };

  const bookAppointment = async (
    counsellorId: string,
    date: string,
    time: string,
  ) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { error } = await supabase.from("appointments").insert({
      student_id: user.id,
      counsellor_id: counsellorId,
      appointment_date: date, // e.g., '2026-04-12'
      appointment_time: time, // e.g., '10:00:00'
    });

    if (error) {
      if (error.code === "23505") {
        Alert.alert("Error", "This slot is already booked!");
      } else {
        Alert.alert("Error", error.message);
      }
    } else {
      Alert.alert("Success", "Appointment requested!");
    }
  };

  const updateStatus = async (appointmentId: string, newStatus: string) => {
    console.log(`Attempting to update ${appointmentId} to ${newStatus}`);

    const { error } = await supabase
      .from("appointments")
      .update({ status: newStatus })
      .eq("id", appointmentId);

    if (error) {
      console.error("Update Error:", error.message);
      Alert.alert("Update Failed", error.message);
    } else {
      console.log("Update successful in database");
      // Update local UI immediately
      setAppointments((prev) =>
        prev.map((a) =>
          a.id === appointmentId ? { ...a, status: newStatus } : a,
        ),
      );
    }
  };

  useEffect(() => {
    if (!profile?.id) return;

    // Subscribe to changes in the appointments table
    const subscription = supabase
      .channel("appointment_updates")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "appointments",
          filter: `student_id=eq.${profile.id}`,
        },
        (payload) => {
          // When a change happens, update the local state
          setAppointments((current) =>
            current.map((apt) =>
              apt.id === payload.new.id ? { ...apt, ...payload.new } : apt,
            ),
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [profile?.id]);
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
                matches.map((item) => {
                  const existingApt = appointments.find(
                    (a) => a.counsellor_id === item.id,
                  );

                  return (
                    <View
                      key={item.id}
                      className="bg-white p-5 rounded-2xl mb-4 shadow-sm"
                    >
                      <View className="flex-row justify-between items-center">
                        <View>
                          <Text className="text-lg font-bold">
                            {item.full_name}
                          </Text>
                          {existingApt && (
                            <Text className="text-[#00822F] text-xs font-bold">
                              Status: {existingApt.status}
                            </Text>
                          )}
                        </View>

                        <Pressable
                          disabled={!!existingApt} // Disable button if already booked
                          onPress={() =>
                            router.push(`/counsellor/${item.id}` as any)
                          }
                          className={`px-4 py-2 rounded-full ${existingApt ? "bg-gray-300" : "bg-black"}`}
                        >
                          <Text className="text-white text-sm font-bold">
                            {existingApt ? "Booked" : "Book"}
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
                  );
                })
              ) : (
                <Text className="text-gray-400 text-center mt-10">
                  No matches found for your interests yet.
                </Text>
              )}
            </View>
          )}

          {/* Appointments Section */}
          {appointments.length > 0 && (
            <View className="mb-8">
              <Text className="text-xl font-bold mb-4">Upcoming Sessions</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {appointments.map((apt) => (
                  <View
                    key={apt.id}
                    className="bg-[#00822F] p-4 rounded-2xl mr-4 w-64"
                  >
                    <Text className="text-white opacity-80 text-xs font-bold uppercase">
                      {apt.appointment_date} @ {apt.appointment_time}
                    </Text>
                    <Text className="text-white text-lg font-bold mt-1">
                      {apt.person?.full_name}
                    </Text>

                    {/* Status Badge */}
                    <View className="mt-2 self-start px-2 py-1 rounded bg-white/20">
                      <Text className="text-white text-xs capitalize">
                        {apt.status}
                      </Text>
                    </View>

                    {/* NEW: Action Buttons for Counsellors only */}
                    {profile?.role === "counsellor" &&
                      apt.status === "pending" && (
                        <View className="flex-row gap-2 mt-4">
                          <Pressable
                            onPress={() => updateStatus(apt.id, "confirmed")}
                            className="bg-white/90 px-3 py-2 rounded-lg flex-1"
                          >
                            <Text className="text-[#00822F] text-center font-bold text-xs">
                              Accept
                            </Text>
                          </Pressable>
                          <Pressable
                            onPress={() => updateStatus(apt.id, "cancelled")}
                            className="bg-red-400 px-3 py-2 rounded-lg flex-1"
                          >
                            <Text className="text-white text-center font-bold text-xs">
                              Decline
                            </Text>
                          </Pressable>
                        </View>
                      )}
                  </View>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
