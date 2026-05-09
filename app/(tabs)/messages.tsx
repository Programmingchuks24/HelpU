import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function MessagesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [chats, setChats] = useState<any[]>([]);

  const fetchConversations = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // This complex query gets the last message from every unique person you've talked to
    const { data, error } = await supabase.rpc('get_conversations', { user_id: user.id });
    
    // Fallback: If you haven't set up the RPC function yet, let's just fetch profiles 
    // of people involved in appointments as a "Start Chat" list
    if (error) {
      const { data: appointments } = await supabase
        .from('appointments')
        .select(`student_id, counsellor_id, student:student_id(full_name), counsellor:counsellor_id(full_name)`)
        .or(`student_id.eq.${user.id},counsellor_id.eq.${user.id}`);
      
      const uniquePeople = new Map();
      appointments?.forEach(apt => {
        const otherUser = apt.student_id === user.id ? apt.counsellor : apt.student;
        const otherId = apt.student_id === user.id ? apt.counsellor_id : apt.student_id;
        if (otherUser) uniquePeople.set(otherId, { id: otherId, ...otherUser });
      });
      setChats(Array.from(uniquePeople.values()));
    } else {
      setChats(data);
    }
    setLoading(false);
  };

  useEffect(() => { fetchConversations(); }, []);

  if (loading) return <View className="flex-1 justify-center"><ActivityIndicator color="#00822F" /></View>;

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
      <View className="px-6 py-4 border-b border-gray-100">
        <Text className="text-3xl font-extrabold text-gray-900">Messages</Text>
      </View>

      <FlatList
        data={chats}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/messages/${item.id}?name=${item.full_name}`)}
            className="flex-row items-center p-4 mb-3 bg-gray-50 rounded-3xl"
          >
            <View className="w-14 h-14 bg-green-100 rounded-full items-center justify-center">
              <Text className="text-green-700 font-bold text-lg">
                {item.full_name?.charAt(0)}
              </Text>
            </View>
            <View className="flex-1 ml-4">
              <View className="flex-row justify-between items-center">
                <Text className="font-bold text-gray-900 text-lg">{item.full_name}</Text>
                <Text className="text-gray-400 text-xs">Now</Text>
              </View>
              <Text className="text-gray-500 text-sm mt-1" numberOfLines={1}>
                Tap to start chatting...
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#CCC" />
          </Pressable>
        )}
        ListEmptyComponent={
          <View className="items-center mt-20 px-10">
            <Ionicons name="chatbubbles-outline" size={64} color="#EEE" />
            <Text className="text-gray-400 text-center mt-4">No active conversations. Start a meeting to message your counsellor.</Text>
          </View>
        }
      />
    </View>
  );
}