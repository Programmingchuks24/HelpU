import { View, Text, ScrollView, Image, Pressable } from 'react-native'
import React from 'react'
import { images } from '@/constants/images'
import { useRouter } from "expo-router";

const Register = () => {

  const router = useRouter();

    const handleclick = () => {
        router.push("/login/login");
      };

  return (
    <ScrollView className="bg-[#F6F4F0]">

            <View className="w-full h-[80%] bg-[#00822F] pt-10 items-center justify-center">
             <Image
                 source={images.girl}
                 className="self-center w-[400px] h-[400px]"
               />
           </View>
     
     
             <View className = "flex justify-center items-center mt-24 gap-5">

               <Pressable className="py-3 px-24  bg-white rounded-full justify-center items-center border border-black flex flex-row gap-10" onPress={handleclick}>
                <Image source={images.headphones} className="w-10 h-10"/>
                 <Text className="text-black font-bold">Register as a Student</Text>
               </Pressable>
               
               <Pressable className=" py-3 px-24  bg-white rounded-full justify-center items-center border border-black flex flex-row gap-10" onPress={handleclick}>
                  <Image source = {images.book} className = "w-10 h-10 "/>
                 <Text className="text-black font-bold">Register as a counsellor</Text>
               </Pressable>
               
             </View>
             
    
    </ScrollView>
  )
}

export default Register
