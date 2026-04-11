import { images } from "@/constants/images";
import { router } from "expo-router";
import React, { useState } from "react";
import { Image, Pressable, ScrollView, Text, TextInput, View, ActivityIndicator } from "react-native";
import ToastManager, { Toast } from "toastify-react-native";
// IMPORT SUPABASE
import { supabase } from "@/lib/supabase"; 

const Login = () => {
  const [newVal, setNewVal] = useState(''); // Email
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const navcool = () => {
    router.push("/login/signup");
  };

  const main = async () => {
    if (!newVal || !password) {
      Toast.error("Please enter both email and password!");
      return;
    }

    setLoading(true);

    // CALL SUPABASE SIGN IN
    const { error } = await supabase.auth.signInWithPassword({
      email: newVal,
      password: password,
    });

    if (error) {
      Toast.error(error.message);
      setLoading(false);
    } else {
      Toast.success("Login successful!");
      // No need for a timeout/router.replace here IF you implemented 
      // the RootLayout listener we discussed earlier. 
      // It will auto-redirect when it detects the session!
    }
  };

  return (
    <ScrollView  
      className="flex-1 bg-white"
      contentContainerStyle={{ alignItems: "center", paddingTop: 100, paddingBottom: 40 }}>
      
      <Image source={images.logo} />

      <View className="flex gap-10 mt-10 w-full items-center">
        <TextInput
          placeholder="Enter email"
          value={newVal}
          onChangeText={setNewVal}
          autoCapitalize="none"
          className="border-b border-gray-300 w-[85%] py-2 text-lg"
        />

        <TextInput
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          className="border-b border-gray-300 w-[85%] py-2 text-lg"
        />

        <Pressable 
          className={`px-20 py-4 rounded-full w-[85%] justify-center items-center ${loading ? 'bg-gray-500' : 'bg-black'}`} 
          onPress={main}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold">Login</Text>
          )}
        </Pressable>
      </View>

      <View className="mt-8 gap-4">
        <Text className="text-center font-bold">
          Forgot Password?{" "}
          <Text className="text-[#00822F]">Reset here</Text>
        </Text>
        <View className="flex-row justify-center">
          <Text className="font-bold text-center">Don&apos;t have an account? </Text>
          <Pressable onPress={navcool}>
            <Text className="text-[#00822F] font-bold">Register here</Text>
          </Pressable>
        </View>
      </View>
      <ToastManager />
    </ScrollView>
  );
};

export default Login;