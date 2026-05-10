import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
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
  const { id, name } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [myId, setMyId] = useState<string | null>(null);

  // Inside ChatDetailScreen component
useEffect(() => {
  const markAsRead = async () => {
    if (!myId || !id) return;

    // Mark messages from THEM to ME as read
    await supabase
      .from("messages")
      .update({ is_read: true })
      .match({ 
        sender_id: id, 
        receiver_id: myId, 
        is_read: false 
      });
  };

  // Run whenever messages are loaded or updated
  if (messages.length > 0) {
    markAsRead();
  }
}, [id, myId, messages]);

  useEffect(() => {
    const setupChat = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setMyId(user.id);

      // Fetch initial messages
      const { data } = await supabase
        .from("messages")
        .select("*")
        .or(
          `and(sender_id.eq.${user.id},receiver_id.eq.${id}),and(sender_id.eq.${id},receiver_id.eq.${user.id})`,
        )
        .order("created_at", { ascending: true });
      setMessages(data || []);
    };
    setupChat();
  }, [id]);

  // Realtime Logic
  useEffect(() => {
    if (!myId) return;
    const channel = supabase
      .channel(`chat_${id}_${Date.now()}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const msg = payload.new;
          if (
            (msg.sender_id === myId && msg.receiver_id === id) ||
            (msg.sender_id === id && msg.receiver_id === myId)
          ) {
            setMessages((prev) =>
              prev.some((m) => m.id === msg.id) ? prev : [...prev, msg],
            );
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [myId, id]);

  // GUARD: If no ID, don't try to render anything that might crash
  if (!id)
    return (
      <View className="flex-1 justify-center">
        <Text>Error: No User ID</Text>
      </View>
    );

  const sendMessage = async () => {
    if (!inputText.trim() || !myId) return;
    const content = inputText.trim();
    setInputText("");
    await supabase
      .from("messages")
      .insert({ content, sender_id: myId, receiver_id: id });
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#F6F4F0" }}>
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top,
          backgroundColor: "white",
          padding: 15,
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} />
        </Pressable>
        <Text style={{ fontSize: 20, fontWeight: "bold", marginLeft: 10 }}>
          {name}
        </Text>
      </View>

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        contentContainerStyle={{ padding: 20 }}
        renderItem={({ item }) => (
          <View
            style={{
              alignSelf: item.sender_id === myId ? "flex-end" : "flex-start",
              marginBottom: 10,
            }}
          >
            <View
              style={{
                backgroundColor: item.sender_id === myId ? "#00822F" : "white",
                padding: 12,
                borderRadius: 15,
              }}
            >
              <Text
                style={{ color: item.sender_id === myId ? "white" : "black" }}
              >
                {item.content}
              </Text>
            </View>
          </View>
        )}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={90}
      >
        <View
          style={{
            padding: 15,
            backgroundColor: "white",
            flexDirection: "row",
            paddingBottom: insets.bottom + 10,
          }}
        >
          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type..."
            style={{
              flex: 1,
              backgroundColor: "#f0f0f0",
              padding: 10,
              borderRadius: 20,
              marginRight: 10,
            }}
          />
          <Pressable
            onPress={sendMessage}
            style={{
              backgroundColor: "black",
              width: 45,
              height: 45,
              borderRadius: 22,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Ionicons name="send" size={20} color="white" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
