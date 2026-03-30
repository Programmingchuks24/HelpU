import { Image, Pressable, Text, View, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { images } from "@/constants/images";
import { useRouter } from "expo-router";

export default function Index() {
  const buttonfunction = () => {
     router.push("/landingscreens/register");
  };

  const handleclick = () => {
    router.push("/landingscreens/register");
  };

  const router = useRouter();
  
  return (
    <SafeAreaView className="flex-1 bg-[#F6F4F0]">
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
      <View className="w-full bg-[#00822F] pt-10">
        <View className="flex flex-row justify-between p-4">
          <Text
            className="text-white text-2xl font-irish"
          >
            Helpu
          </Text>
          <Pressable onPress={buttonfunction} className="p-4 px-9 bg-[#F6F4F0] rounded-full">
            <Text className = "font-bold">Login</Text>
          </Pressable>

          
        </View>
        <Image
            source={images.man}
            className="self-center w-[400px] h-[400px]"
          />
      </View>

      <View className="justify-center items-center pt-10">
        <View className="justify-center items-center gap-4">
          <Text className="text-[#324137] text-3xl font-bold">Speak to a Professional</Text>
          <Text className="text-black text-center font-bold">Talk to someone in the Nile counselling department about your issues, Don&apos;t Keep it within. Get started now </Text>

        </View>

        <View className = "flex justify-center items-center mt-14 gap-5">
          <Pressable className="p-5 px-36  bg-black rounded-full justify-center items-center" onPress={handleclick}>
            <Text className="text-white">Start Now</Text>
          </Pressable>

          <Text className="font-bold text-lg">Take a look at the counsellors</Text>
        </View>
        
      </View>
      </ScrollView>
    </SafeAreaView>
  );
}
