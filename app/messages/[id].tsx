import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState, useRef } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ChatDetailScreen() {
  const { id: receiverId, name } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    setupChat();
    
    // REAL-TIME SUBSCRIPTION
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'messages' }, 
        (payload) => {
          setMessages((prev) => [...prev, payload.new]);
          setTimeout(() => flatListRef.current?.scrollToEnd(), 100);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const setupChat = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setCurrentUserId(user.id);

    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: true });

    if (data) setMessages(data);
  };

  const sendMessage = async () => {
    if (!inputText.trim() || !currentUserId) return;

    const newMessage = {
      content: inputText.trim(),
      sender_id: currentUserId,
      receiver_id: receiverId,
    };

    setInputText("");
    const { error } = await supabase.from('messages').insert(newMessage);
    if (error) console.error(error);
  };

  return (
    <View className="flex-1 bg-[#F6F4F0]">
      {/* Custom Header */}
      <View style={{ paddingTop: insets.top }} className="bg-white border-b border-gray-100 p-4 flex-row items-center">
        <Pressable onPress={() => router.back()} className="p-2">
          <Ionicons name="arrow-back" size={24} color="black" />
        </Pressable>
        <Text className="text-xl font-bold ml-2">{name}</Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 20 }}
        renderItem={({ item }) => {
          const isMe = item.sender_id === currentUserId;
          return (
            <View className={`mb-4 flex-row ${isMe ? "justify-end" : "justify-start"}`}>
              <View className={`max-w-[80%] p-4 rounded-3xl ${isMe ? "bg-[#00822F] rounded-tr-none" : "bg-white rounded-tl-none border border-gray-100"}`}>
                <Text className={`${isMe ? "text-white" : "text-gray-800"}`}>{item.content}</Text>
              </View>
            </View>
          );
        }}
      />

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={10}>
        <View className="p-4 bg-white border-t border-gray-100 flex-row items-center" style={{ paddingBottom: insets.bottom + 10 }}>
          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type a message..."
            className="flex-1 bg-gray-100 p-4 rounded-2xl mr-3"
            multiline
          />
          <Pressable onPress={sendMessage} className="bg-black w-12 h-12 rounded-full items-center justify-center">
            <Ionicons name="send" size={20} color="white" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}