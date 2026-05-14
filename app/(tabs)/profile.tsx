import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  Image,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { supabase } from "@/lib/supabase";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
export default function ProfileScreen() {
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    setProfile(data);
  }

  const uploadAvatar = async () => {
  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true, // <--- Add this!
    });

    if (result.canceled || !result.assets[0].base64) return;

    setLoading(true);
    const file = result.assets[0];
    const fileExt = file.uri.split('.').pop()?.toLowerCase() ?? 'jpg';
    const filePath = `${profile.id}/${Date.now()}.${fileExt}`;

    // Upload using the base64 string converted to an ArrayBuffer
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, decode(file.base64), {
        contentType: `image/${fileExt}`,
        upsert: true
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', profile.id);
    
    setProfile({ ...profile, avatar_url: publicUrl });
    Alert.alert("Success", "Profile updated!");

  } catch (error: any) {
    console.error('Upload Error:', error);
    Alert.alert('Upload Failed', error.message);
  } finally {
    setLoading(false);
  }
};

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/(auth)/login");
  };

  if (!profile) return <ActivityIndicator style={{ flex: 1 }} />;

  return (
    <ScrollView className="flex-1 bg-[#F6F4F0] p-6">
      <View className="items-center mt-10">
        <Pressable onPress={uploadAvatar} className="relative">
          <View className="w-32 h-32 rounded-full bg-gray-200 overflow-hidden border-4 border-white shadow-sm">
            {profile.avatar_url ? (
              <Image
                source={{ uri: profile.avatar_url }}
                className="w-full h-full"
              />
            ) : (
              <View className="items-center justify-center flex-1">
                <Ionicons name="person" size={60} color="#ccc" />
              </View>
            )}
          </View>
          <View className="absolute bottom-0 right-0 bg-[#00822F] p-2 rounded-full border-2 border-white">
            <Ionicons name="camera" size={18} color="white" />
          </View>
        </Pressable>

        <Text className="text-2xl font-extrabold mt-4 text-gray-900">
          {profile.full_name}
        </Text>
        <View className="bg-green-100 px-4 py-1 rounded-full mt-1">
          <Text className="text-[#00822F] font-bold text-xs uppercase">
            {profile.role}
          </Text>
        </View>
      </View>

      <View className="mt-10 space-y-4">
        {/* If Counsellor, show availability button */}
        {profile.role === "counsellor" && (
          <Pressable
            onPress={() => router.push("/profile/availability")}
            className="bg-white p-4 rounded-2xl flex-row items-center shadow-sm"
          >
            <View className="bg-blue-100 p-2 rounded-lg mr-4">
              <Ionicons name="time" size={24} color="#2563EB" />
            </View>
            <Text className="flex-1 font-bold text-gray-700">
              Set Active Times
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </Pressable>
        )}

        <Pressable
          onPress={handleLogout}
          className="bg-white p-4 rounded-2xl flex-row items-center shadow-sm"
        >
          <View className="bg-red-100 p-2 rounded-lg mr-4">
            <Ionicons name="log-out" size={24} color="#EF4444" />
          </View>
          <Text className="flex-1 font-bold text-red-600">Log Out</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
