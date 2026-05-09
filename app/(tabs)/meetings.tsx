import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
  DateTimePickerAndroid,
} from "@react-native-community/datetimepicker";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function MeetingsScreen() {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [upcoming, setUpcoming] = useState<any[]>([]);
  const [past, setPast] = useState<any[]>([]);
  const [pending, setPending] = useState<any[]>([]);
  const [userRole, setUserRole] = useState("");
  const [now, setNow] = useState(new Date());
  const [isModalVisible, setModalVisible] = useState(false);
  const [counsellors, setCounsellors] = useState<any[]>([]);
  const [selectedCounsellor, setSelectedCounsellor] = useState<any>(null);
  const [bookingDate, setBookingDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const fetchCounsellors = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, username")
      .eq("role", "counsellor");
    if (!error) setCounsellors(data);
  };

  const fetchMeetings = async () => {
  setLoading(true);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  setUserRole(profile?.role || "");

  const column = profile?.role === "student" ? "student_id" : "counsellor_id";
  const profileJoin = profile?.role === "student" ? "counsellor_id" : "student_id";

  const { data, error } = await supabase
    .from("appointments")
    .select(`*, person: ${profileJoin} (full_name, username)`)
    .eq(column, user.id)
    .order("appointment_date", { ascending: true });

  if (!error && data) {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset to start of today for date-only comparison

    const pendingList: any[] = [];
    const upcomingList: any[] = [];
    const pastList: any[] = [];

    data.forEach(apt => {
      const status = apt.status?.toLowerCase().trim();
      
      // Parse the date components manually to avoid timezone shifts
      const [year, month, day] = apt.appointment_date.split('-').map(Number);
      const aptDate = new Date(year, month - 1, day);

      if (status === "pending") {
        pendingList.push(apt);
      } else if (status === "confirmed") {
        // If the appointment is today or in the future, show in Upcoming
        if (aptDate >= today) {
          upcomingList.push(apt);
        } else {
          pastList.push(apt);
        }
      } else if (status === "cancelled") {
        pastList.push(apt);
      }
    });

    setPending(pendingList);
    setUpcoming(upcomingList);
    setPast(pastList);
  }
  setLoading(false);
};

  useFocusEffect(
    useCallback(() => {
      fetchMeetings();
    }, []),
  );

  // --- ANDROID STABLE PICKER LOGIC ---
  const onDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") setShowPicker(false);
    if (selectedDate) setBookingDate(selectedDate);
  };

  const showAndroidPicker = (mode: "date" | "time") => {
    DateTimePickerAndroid.open({
      value: bookingDate,
      onChange: onDateChange,
      mode: mode,
      is24Hour: true,
      minimumDate: new Date(),
    });
  };

  const handleFinalBooking = async () => {
    if (!selectedCounsellor)
      return Alert.alert("Error", "Please select a counsellor");
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase.from("appointments").insert({
      student_id: user?.id,
      counsellor_id: selectedCounsellor.id,
      appointment_date: bookingDate.toISOString().split("T")[0],
      appointment_time: bookingDate.toTimeString().split(" ")[0],
      status: "pending",
    });

    if (!error) {
      Alert.alert("Success", "Request sent!");
      setModalVisible(false);
      fetchMeetings();
    }
  };

  const isJoinable = (dateStr: string, timeStr: string) => {
    const [year, month, day] = dateStr.split("-").map(Number);
    const [hour, minute] = timeStr.split(":").map(Number);
    const meetingTime = new Date(year, month - 1, day, hour, minute).getTime();
    const currentTime = new Date().getTime();

    // Allow joining from 10 mins before until 2 hours after start
    return (
      currentTime >= meetingTime - 10 * 60 * 1000 &&
      currentTime <= meetingTime + 120 * 60 * 1000
    );
  };
  const handleStatusUpdate = async (id: string, status: string) => {
  const { error } = await supabase
    .from("appointments")
    .update({ status })
    .eq("id", id);

  if (error) {
    Alert.alert("Error", error.message);
  } else {
    fetchMeetings(); // Refresh the list immediately
  }
};

  const renderMeetingCard = (
    apt: any,
    type: "upcoming" | "pending" | "past",
  ) => {
    const isPast = type === "past";
    const isPending = type === "pending";
    const canJoin =
      type === "upcoming" &&
      isJoinable(apt.appointment_date, apt.appointment_time);

    return (
      <View
        key={apt.id}
        className={`p-4 rounded-3xl mb-4 border ${isPast ? "bg-gray-100 border-gray-200" : "bg-white border-green-100 shadow-sm"}`}
      >
        <View className="flex-row justify-between items-start">
          <View className="flex-1">
            <Text
              className={`text-xs font-bold uppercase ${isPast ? "text-gray-400" : "text-[#00822F]"}`}
            >
              {apt.appointment_date} @ {apt.appointment_time}
            </Text>
            <Text className="text-lg font-bold text-gray-800">
              {apt.person?.full_name || "Unknown"}
            </Text>
            <Text className="text-gray-500 text-sm italic capitalize">
              {apt.status}
            </Text>
          </View>

          {canJoin && (
            <Pressable
              onPress={() => Alert.alert("Joining...", "Launching session")}
              className="bg-[#00822F] px-4 py-2 rounded-full flex-row items-center"
            >
              <Ionicons name="videocam" size={16} color="white" />
              <Text className="text-white font-bold ml-2">Join</Text>
            </Pressable>
          )}
        </View>

        {/* COUNSELLOR ACTIONS: Show only if user is counsellor AND it's a pending card */}
        {userRole === "counsellor" && isPending && (
          <View className="flex-row mt-4 pt-4 border-t border-gray-100 space-x-2">
            <Pressable
              onPress={() => handleStatusUpdate(apt.id, "confirmed")}
              className="flex-1 bg-[#00822F] py-3 rounded-xl items-center justify-center flex-row"
            >
              <Ionicons name="checkmark-circle" size={18} color="white" />
              <Text className="text-white font-bold ml-2">Accept</Text>
            </Pressable>
            <Pressable
              onPress={() => handleStatusUpdate(apt.id, "cancelled")}
              className="flex-1 bg-red-50 py-3 rounded-xl items-center justify-center flex-row border border-red-100"
            >
              <Ionicons name="close-circle" size={18} color="#EF4444" />
              <Text className="text-red-600 font-bold ml-2">Decline</Text>
            </Pressable>
          </View>
        )}
      </View>
    );
  };
  if (loading)
    return (
      <View className="flex-1 justify-center">
        <ActivityIndicator size="large" color="#00822F" />
      </View>
    );

  return (
    <View className="flex-1 bg-[#F6F4F0]" style={{ paddingTop: insets.top }}>
      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <Text className="text-3xl font-extrabold text-gray-900 mb-6">
          Meetings
        </Text>

        {/* Schedule Button */}
        {userRole === "student" && (
          <Pressable
            onPress={() => {
              fetchCounsellors();
              setModalVisible(true);
            }}
            className="bg-black flex-row items-center justify-center py-4 rounded-2xl mb-10 shadow-lg"
          >
            <Ionicons name="add-circle" size={24} color="white" />
            <Text className="text-white font-bold ml-2 text-lg">
              Schedule New Meeting
            </Text>
          </Pressable>
        )}

        {/* 1. PENDING REQUESTS SECTION */}
        {/* 1. PENDING REQUESTS SECTION */}
        <View className="mb-8">
          <View className="flex-row items-center mb-4">
            <Ionicons name="hourglass-outline" size={20} color="#F59E0B" />
            <Text className="text-xl font-bold ml-2 text-gray-800">
              Pending Requests
            </Text>
          </View>

          {pending.length > 0 ? (
            pending.map((apt) => renderMeetingCard(apt, "pending")) // USE THE RENDER FUNCTION HERE
          ) : (
            <View className="bg-gray-50 border border-dashed border-gray-200 p-6 rounded-3xl items-center">
              <Text className="text-gray-400 italic">No pending requests.</Text>
            </View>
          )}
        </View>

        {/* 2. UPCOMING SECTION */}
        <View className="mb-8">
          <View className="flex-row items-center mb-4">
            <Ionicons name="calendar" size={20} color="#00822F" />
            <Text className="text-xl font-bold ml-2 text-gray-800">
              Confirmed Sessions
            </Text>
          </View>
          {upcoming.length > 0 ? (
            upcoming.map((apt) => renderMeetingCard(apt, "upcoming"))
          ) : (
            <Text className="text-gray-400 italic ml-1">
              No confirmed sessions yet.
            </Text>
          )}
        </View>

        {/* 3. HISTORY SECTION */}
        <View>
          <View className="flex-row items-center mb-4">
            <Ionicons name="time-outline" size={20} color="gray" />
            <Text className="text-xl font-bold ml-2 text-gray-500">
              Past History
            </Text>
          </View>
          {past.length > 0 ? (
            past.map((apt) => renderMeetingCard(apt, "past"))
          ) : (
            <Text className="text-gray-400 italic ml-1">
              Your history will appear here.
            </Text>
          )}
        </View>
      </ScrollView>

      {/* BOOKING MODAL */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View className="flex-1 bg-[#F6F4F0] p-6">
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-2xl font-bold">New Appointment</Text>
            <Pressable onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={28} color="black" />
            </Pressable>
          </View>

          <Text className="text-sm font-bold text-gray-400 uppercase mb-3">
            Select Counsellor
          </Text>
          <View className="h-40">
            <FlatList
              data={counsellors}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => setSelectedCounsellor(item)}
                  className={`mr-3 p-4 rounded-2xl border-2 w-32 items-center justify-center ${selectedCounsellor?.id === item.id ? "border-[#00822F] bg-green-50" : "border-transparent bg-white"}`}
                >
                  <View className="w-12 h-12 bg-gray-200 rounded-full mb-2 items-center justify-center">
                    <Ionicons name="person" size={24} color="gray" />
                  </View>
                  <Text
                    numberOfLines={1}
                    className="font-bold text-center text-xs"
                  >
                    {item.full_name}
                  </Text>
                </Pressable>
              )}
            />
          </View>

          <Text className="text-sm font-bold text-gray-400 uppercase mt-6 mb-3">
            Choose Date & Time
          </Text>
          <View className="flex-row space-x-2 mb-8">
            <Pressable
              onPress={() =>
                Platform.OS === "android"
                  ? showAndroidPicker("date")
                  : setShowPicker(true)
              }
              className="flex-1 bg-white p-4 rounded-2xl flex-row items-center justify-between shadow-sm mr-2"
            >
              <Text className="font-medium">
                {bookingDate.toLocaleDateString()}
              </Text>
              <Ionicons name="calendar-outline" size={20} color="#00822F" />
            </Pressable>
            <Pressable
              onPress={() =>
                Platform.OS === "android"
                  ? showAndroidPicker("time")
                  : setShowPicker(true)
              }
              className="flex-1 bg-white p-4 rounded-2xl flex-row items-center justify-between shadow-sm"
            >
              <Text className="font-medium">
                {bookingDate.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
              <Ionicons name="time-outline" size={20} color="#00822F" />
            </Pressable>
          </View>

          {Platform.OS === "ios" && showPicker && (
            <DateTimePicker
              value={bookingDate}
              mode="datetime"
              display="spinner"
              onChange={onDateChange}
              minimumDate={new Date()}
            />
          )}

          <Pressable
            onPress={handleFinalBooking}
            className="bg-black py-4 rounded-2xl items-center mt-auto"
          >
            <Text className="text-white font-bold text-lg">
              Send Booking Request
            </Text>
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}
