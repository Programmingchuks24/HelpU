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
  Modal,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";


export default function ChatDetailScreen() {
  const { id, name } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [myId, setMyId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.5,
    });

    if (!result.canceled) {
      setPreviewImage(result.assets[0].uri);
    }
  };

  // 2. The function that actually uploads
  const uploadAndSendImage = async () => {
    if (!previewImage || !myId) return;
    setIsUploading(true);

    const fileExt = previewImage.split(".").pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${myId}/${fileName}`;

    const formData = new FormData();
    formData.append("file", {
      uri: previewImage,
      name: fileName,
      type: `image/${fileExt}`,
    } as any);

    const { data, error } = await supabase.storage
      .from("chat-attachments")
      .upload(filePath, formData);

    if (data) {
      const { data: { publicUrl } } = supabase.storage
        .from("chat-attachments")
        .getPublicUrl(filePath);

      await supabase.from("messages").insert({
        content: inputText.trim() || "Sent an image", // Attach the text here!
        sender_id: myId,
        receiver_id: id,
        image_url: publicUrl,
      });

      setPreviewImage(null); // Close modal
      setInputText(""); // Clear text
    }
    setIsUploading(false);
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
                onPress={() => item.image_url && setSelectedImage(item.image_url)}
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

      <Modal visible={!!previewImage} animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'black', paddingTop: insets.top }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 20 }}>
             <Pressable onPress={() => setPreviewImage(null)}>
               <Ionicons name="close" size={30} color="white" />
             </Pressable>
             <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>Send Image</Text>
             <View style={{ width: 30 }} />
          </View>
          
          <Image 
            source={{ uri: previewImage || undefined }} 
            style={{ flex: 1, resizeMode: 'contain' }} 
          />

          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>
            <View style={{ padding: 20, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.8)' }}>
              <TextInput
                value={inputText}
                onChangeText={setInputText}
                placeholder="Add a caption..."
                placeholderTextColor="#999"
                style={{ flex: 1, color: 'white', backgroundColor: '#333', padding: 12, borderRadius: 25, marginRight: 10 }}
              />
              <Pressable 
                onPress={uploadAndSendImage} 
                disabled={isUploading}
                style={{ backgroundColor: '#00822F', width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' }}
              >
                {isUploading ? (
                   <ActivityIndicator color="white" />
                ) : (
                  <Ionicons name="send" size={24} color="white" />
                )}
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <Modal visible={!!selectedImage} transparent={false} animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'black' }}>
          <Pressable 
            onPress={() => setSelectedImage(null)}
            style={{ position: 'absolute', top: insets.top + 10, right: 20, zIndex: 10, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20, padding: 5 }}
          >
            <Ionicons name="close" size={30} color="white" />
          </Pressable>
          <Image 
            source={{ uri: selectedImage || undefined }} 
            style={{ flex: 1, resizeMode: 'contain' }} 
          />
        </View>
      </Modal>



      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={90}>
        <View style={{ padding: 15, backgroundColor: "white", flexDirection: "row", alignItems: 'center', paddingBottom: insets.bottom + 10 }}>
          
          {/* Image Picker Button */}
          <Pressable onPress={pickImage} style={{ marginRight: 10 }}>
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
   
