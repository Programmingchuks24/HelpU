import { images } from "@/constants/images";
import { supabase } from "@/lib/supabase";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

const Signup = () => {

  const ROLES = ['student', 'counsellor'];

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // NEW: Additional state for extra info
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  
  const [loading, setLoading] = useState(false);

  const [role, setRole] = useState<"student" | "counsellor" | null>('student'); // NEW: Role selection

  const navfunc = () => {
    router.push("/login/login");
  };

  const handleSignUp = async () => {
  if (!email || !password || !confirmPassword || !fullName || !username) {
    Alert.alert("Error", "Please fill in all fields.");
    return;
  }

  if (password !== confirmPassword) {
    Alert.alert("Error", "Passwords do not match.");
    return;
  }

  setLoading(true);

  // TRUST THE TRIGGER: Just send the metadata. 
  // The database SQL function we wrote handles the insertion.
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        username: username,
        role: role,
        interests: [], 
      },
    },
  });

  if (error) {
    Alert.alert("Error", error.message);
    setLoading(false);
  } else {
    // We don't need an alert here because the RootLayout 
    // will see the new session and redirect to Home automatically.
    console.log("Signup successful!");
  }
};

  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerStyle={{
        alignItems: "center",
        paddingTop: 80, // Adjusted padding to fit more fields
        paddingBottom: 40,
      }}
      scrollEnabled={true}
    >
      <Image source={images.logo} />

      <View className="flex gap-6 mt-10 w-full items-center">
        {/* NEW: Full Name Input */}
        <TextInput
          placeholder="Full Name"
          value={fullName}
          onChangeText={setFullName}
          className="border-b border-gray-300 w-[85%] py-2 text-lg"
          placeholderTextColor="#999"
        />

        {/* NEW: Username Input */}
        <TextInput
          placeholder="Username"
          autoCapitalize="none"
          value={username}
          onChangeText={setUsername}
          className="border-b border-gray-300 w-[85%] py-2 text-lg"
          placeholderTextColor="#999"
        />

        <TextInput
          placeholder="Enter email"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
          className="border-b border-gray-300 w-[85%] py-2 text-lg"
          placeholderTextColor="#999"
        />

        <TextInput
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          className="border-b border-gray-300 w-[85%] py-2 text-lg"
          placeholderTextColor="#999"
        />

        <TextInput
          placeholder="Confirm Password"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          className="border-b border-gray-300 w-[85%] py-2 text-lg"
          placeholderTextColor="#999"
        />

        <Text className="font-bold mb-2 text-gray-500">I am a...</Text>
        <View className="flex-row gap-4 mb-8">
          {ROLES.map((r) => (
            <Pressable
              key={r}
              onPress={() => setRole(r)}
              className={`flex-1 p-4 rounded-xl border-2 items-center ${
                role === r
                  ? "border-[#00822F] bg-green-50"
                  : "border-gray-100 bg-white"
              }`}
            >
              <Text
                className={`capitalize font-bold ${role === r ? "text-[#00822F]" : "text-gray-400"}`}
              >
                {r}
              </Text>
            </Pressable>
          ))}
        </View>

        <Pressable
          onPress={handleSignUp}
          disabled={loading}
          className={`px-20 py-4 mt-4 rounded-full w-[85%] justify-center items-center ${
            loading ? "bg-gray-500" : "bg-black"
          }`}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-lg">Signup</Text>
          )}
        </Pressable>
      </View>

      <View className="mt-8 gap-4">
        <Text className="text-center font-bold">
          Forgot Password?{" "}
          <Text className="text-[#00822F] font-bold">Reset here</Text>
        </Text>
        <Text className="text-center font-bold">
          Have an account?{" "}
          <Text className="text-[#00822F] font-bold" onPress={navfunc}>
            Login here
          </Text>
        </Text>
      </View>
    </ScrollView>
  );
};

export default Signup;