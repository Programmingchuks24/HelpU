import { images } from "@/constants/images";
import { router } from "expo-router";
import React from "react";
import {
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

const signup = () => {
  const navfunc = () => {
    router.push("/login/login");
  };
  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ alignItems: "center", paddingTop: 128, paddingBottom: 40 }}
      scrollEnabled={true}
    >
      <Image source={images.logo} />

      <View className="flex gap-20">
        <TextInput
          placeholder="Enter email"
          keyboardType="email-address"
          textContentType="emailAddress"
          className="border-b px-[15rem]"
          style={{
            width: "85%",
            textAlign: "left",
            paddingLeft: 4,
            textAlignVertical: "center",
          }}
          placeholderTextColor="#999"
        />

        <TextInput
          placeholder="Password"
          secureTextEntry
          textContentType="password"
          className="border-b px-[15rem]"
          style={{
            width: "85%",
            textAlign: "left",
            paddingLeft: 4,
            textAlignVertical: "center",
          }}
          placeholderTextColor="#999"
        />

        <TextInput
          placeholder="Password"
          secureTextEntry
          textContentType="password"
          className="border-b px-[15rem]"
          style={{
            width: "85%",
            textAlign: "left",
            paddingLeft: 4,
            textAlignVertical: "center",
          }}
          placeholderTextColor="#999"
        />

        <Pressable className="bg-black px-20 py-3 rounded-full justify-center items-center">
          <Text className="text-white font-bold">Signup</Text>
        </Pressable>
      </View>

      <View className="mt-8 gap-8">
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

export default signup;
