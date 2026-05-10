import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
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

  const pickAndSendImage = async () => {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.5,
  });

  if (result.canceled) return;

  const image = result.assets[0];
  const fileExt = image.uri.split(".").pop();
  const fileName = `${Date.now()}.${fileExt}`; // Use timestamp for unique names
  const filePath = `${myId}/${fileName}`;

  // NATIVE FIX: Ensure the URI is clean for the upload
  const cleanUri = Platform.OS === 'ios' ? image.uri.replace('file://', '') : image.uri;

  const formData = new FormData();
  formData.append("file", {
    uri: image.uri, // Some environments prefer the full URI, some the clean one. Try both if one fails.
    name: fileName,
    type: `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`, // Standardize jpeg
  } as any);

  try {
    const { data, error } = await supabase.storage
      .from("chat-attachments")
      .upload(filePath, formData, {
        contentType: `image/${fileExt}`,
        upsert: false
      });

    if (error) {
      console.error("Storage Upload Error:", error.message);
      Alert.alert("Upload Failed", error.message);
      return;
    }

    if (data) {
      const { data: { publicUrl } } = supabase.storage
        .from("chat-attachments")
        .getPublicUrl(filePath);

      await supabase.from("messages").insert({
        content: "Sent an image",
        sender_id: myId,
        receiver_id: id,
        image_url: publicUrl,
      });
    }
  } catch (err) {
    console.error("Upload Catch:", err);
  }
};

  const deleteMessage = async (messageId: string) => {
    const { error } = await supabase
      .from("messages")
      .delete()
      .eq("id", messageId)
      .eq("sender_id", myId); // Security: Only delete your own messages

    if (!error) {
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    }
  };

  // Inside ChatDetailScreen component
  useEffect(() => {
    const markAsRead = async () => {
      if (!myId || !id) return;

      // Mark messages from THEM to ME as read
      await supabase.from("messages").update({ is_read: true }).match({
        sender_id: id,
        receiver_id: myId,
        is_read: false,
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
      .channel(`chat_${id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" }, // Listen for ALL events (*)
        (payload) => {
          if (payload.eventType === "INSERT") {
            const msg = payload.new;
            if (
              (msg.sender_id === myId && msg.receiver_id === id) ||
              (msg.sender_id === id && msg.receiver_id === myId)
            ) {
              setMessages((prev) =>
                prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]
              );
            }
          } else if (payload.eventType === "DELETE") {
            // Handle real-time deletion
            setMessages((prev) => prev.filter((m) => m.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
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
        keyExtractor={(item) => item.id?.toString()}
        contentContainerStyle={{ padding: 20 }}
        renderItem={({ item }) => {
          const isMine = item.sender_id === myId;
          return (
            <View style={{ alignSelf: isMine ? "flex-end" : "flex-start", marginBottom: 12, maxWidth: '80%' }}>
              <Pressable
                onLongPress={() => {
                  if (!isMine) return; // Only delete your own
                  Alert.alert("Delete Message", "Delete this message for everyone?", [
                    { text: "Cancel", style: "cancel" },
                    { text: "Delete", style: "destructive", onPress: () => deleteMessage(item.id) },
                  ]);
                }}
                style={{
                  backgroundColor: isMine ? "#00822F" : "white",
                  padding: item.image_url ? 4 : 12, // Less padding for images
                  borderRadius: 15,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.1,
                  shadowRadius: 2,
                  elevation: 2,
                }}
              >
                {item.image_url && (
                  <Image
                    source={{ uri: item.image_url }}
                    style={{ width: 220, height: 220, borderRadius: 12 }}
                    resizeMode="cover"
                  />
                )}
                {/* Hide text bubble if it's just the 'Sent an image' fallback */}
                {(item.content && item.content !== "Sent an image") || !item.image_url ? (
                  <Text style={{ 
                    color: isMine ? "white" : "black", 
                    padding: item.image_url ? 8 : 0,
                    fontSize: 16 
                  }}>
                    {item.content}
                  </Text>
                ) : null}
              </Pressable>
            </View>
          );
        }}
      />

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={90}>
        <View style={{ padding: 15, backgroundColor: "white", flexDirection: "row", alignItems: 'center', paddingBottom: insets.bottom + 10 }}>
          
          {/* Image Picker Button */}
          <Pressable onPress={pickAndSendImage} style={{ marginRight: 10 }}>
            <Ionicons name="add-circle-outline" size={32} color="#00822F" />
          </Pressable>

          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type a message..."
            style={{ flex: 1, backgroundColor: "#f0f0f0", padding: 12, borderRadius: 25, marginRight: 10, fontSize: 16 }}
          />

          <Pressable
            onPress={sendMessage}
            style={{ backgroundColor: "black", width: 45, height: 45, borderRadius: 22, justifyContent: "center", alignItems: "center" }}
          >
            <Ionicons name="send" size={20} color="white" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
   
