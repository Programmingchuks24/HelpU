import { useLocalSearchParams, router } from 'expo-router';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function CounsellorProfile() {
  const { id } = useLocalSearchParams();
  const [counsellor, setCounsellor] = useState<any>(null);

  useEffect(() => {
    fetchCounsellor();
  }, [id]);

  const fetchCounsellor = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();
    setCounsellor(data);
  };

  if (!counsellor) return <Text>Loading...</Text>;

  return (
    <ScrollView className="flex-1 bg-[#F6F4F0] p-6">
      <View className="bg-white p-8 rounded-3xl items-center shadow-sm">
        <View className="w-24 h-24 bg-green-100 rounded-full items-center justify-center mb-4">
          <Text className="text-3xl font-bold text-[#00822F]">
            {counsellor.full_name[0]}
          </Text>
        </View>
        <Text className="text-2xl font-bold">{counsellor.full_name}</Text>
        <Text className="text-gray-500 mb-4">@{counsellor.username}</Text>
        
        <View className="flex-row flex-wrap justify-center gap-2">
          {counsellor.interests?.map((tag: string) => (
            <Text key={tag} className="bg-gray-100 px-3 py-1 rounded-full text-xs">
              {tag}
            </Text>
          ))}
        </View>
      </View>

      {/* Booking Section */}
      <View className="mt-8">
        <Text className="text-xl font-bold mb-4">Select a Time Slot</Text>
        <View className="flex-row flex-wrap gap-3">
          {['09:00', '10:00', '11:00', '14:00', '15:00'].map((time) => (
            <Pressable 
              key={time}
              onPress={() => handleBook(time)}
              className="bg-white border border-gray-200 px-6 py-4 rounded-2xl w-[47%]"
            >
              <Text className="text-center font-bold">{time}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </ScrollView>
  );

  async function handleBook(time: string) {
    const { data: { user } } = await supabase.auth.getUser();
    const today = new Date().toISOString().split('T')[0];

    const { error } = await supabase.from('appointments').insert({
      student_id: user?.id,
      counsellor_id: id,
      appointment_date: today,
      appointment_time: time,
    });

    if (error) {
      alert("This slot is already taken!");
    } else {
      alert("Booking successful!");
      router.back();
    }
  }
}