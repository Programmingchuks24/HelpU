import React, { useState, useEffect } from "react";
import { View, TextInput, Pressable, Text, ActivityIndicator } from "react-native";
import { supabase } from "@/lib/supabase";
import { router } from "expo-router";
import ToastManager, { Toast } from "toastify-react-native";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUpdatePassword = async () => {
    if (password.length < 6) {
      Toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    // This updates the password for the currently "logged in" user 
    // (Supabase logs them in automatically via the email link)
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      Toast.error(error.message);
      setLoading(false);
    } else {
      Toast.success("Password updated successfully!");
      // Send them back to login to sign in with the new password
      router.replace("/login/login");
    }
  };

  return (
    <View className="flex-1 bg-white items-center justify-center p-6">
      <Text className="text-2xl font-bold mb-2">New Password</Text>
      <Text className="text-gray-500 mb-8 text-center">
        Please enter a secure new password for your account.
      </Text>
      
      <TextInput
        placeholder="Enter new password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        className="border-b border-gray-300 w-full py-2 text-lg mb-10"
      />

      <Pressable 
        onPress={handleUpdatePassword}
        disabled={loading}
        className={`w-full py-4 rounded-full ${loading ? 'bg-gray-500' : 'bg-black'}`}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white text-center font-bold text-lg">Update Password</Text>
        )}
      </Pressable>
      <ToastManager />
    </View>
  );
}