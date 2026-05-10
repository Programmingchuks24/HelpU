import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  Pressable,
  Text,
  View,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function MessagesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("conversation_summary")
      .select("*")
      .order("last_sent_at", { ascending: false });

    if (!error && data) {
      const formatted = data.map((item) => ({
        id: item.contact_id,
        full_name: item.contact_name,
        // Fallback text if no message exists
        lastMessage:
          item.last_text || "No messages yet. Tap to start chatting!",
        isUnread: item.receiver_id === user.id && !item.is_read,
        // Fallback time if no message exists
        time: item.last_sent_at
          ? new Date(item.last_sent_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "",
      }));
      setChats(formatted);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchConversations();

    // Listen for new messages to update the list live
    const channel = supabase
      .channel("inbox_updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        () => {
          fetchConversations();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) return <ActivityIndicator className="flex-1" color="#00822F" />;

  return (
    <View style={{ flex: 1, paddingTop: insets.top, backgroundColor: "white" }}>
      <Text style={{ fontSize: 28, fontWeight: "bold", padding: 20 }}>
        Messages
      </Text>
      <FlatList
        data={chats}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            onPress={() =>
              router.push({
                pathname: "/messages/[id]",
                params: { id: item.id, name: item.full_name },
              })
            }
            style={{
              flexDirection: "row",
              alignItems: "center",
              padding: 15,
              borderBottomWidth: 1,
              borderBottomColor: "#f0f0f0",
              backgroundColor: item.isUnread ? "#F7F9F7" : "white",
            }}
          >
            <View
              style={{
                width: 55,
                height: 55,
                borderRadius: 27.5,
                backgroundColor: "#00822F",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text
                style={{ color: "white", fontWeight: "bold", fontSize: 18 }}
              >
                {item.full_name?.charAt(0)}
              </Text>
            </View>

            <View style={{ flex: 1, marginLeft: 15 }}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <Text
                  style={{
                    fontSize: 17,
                    fontWeight: item.isUnread ? "800" : "600",
                  }}
                >
                  {item.full_name}
                </Text>
                <Text style={{ fontSize: 12, color: "#888" }}>{item.time}</Text>
              </View>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginTop: 4,
                }}
              >
                <Text
                  numberOfLines={1}
                  style={{
                    flex: 1,
                    color: item.isUnread ? "#000" : "#666",
                    fontWeight: item.isUnread ? "600" : "400",
                  }}
                >
                  {item.lastMessage}
                </Text>
                {item.isUnread && (
                  <View
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 5,
                      backgroundColor: "#00822F",
                      marginLeft: 10,
                    }}
                  />
                )}
              </View>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}
