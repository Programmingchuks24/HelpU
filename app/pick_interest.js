import { useState } from 'react'; // Add this
import { View, Text, Pressable, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';

const CATEGORIES = ['Math', 'Science', 'Music', 'Tech', 'Art', 'Gaming', 'Business', 'Coding'];

export default function PickInterests() {
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  const toggleInterest = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter((i) => i !== interest));
    } else {
      setSelectedInterests([...selectedInterests, interest]);
    }
  };

  const handleConfirm = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const { error } = await supabase
        .from('profiles')
        .update({ interests: selectedInterests }) // Use the local state variable
        .eq('id', user.id);

      if (!error) {
        router.back(); 
      } else {
        console.error("Update error:", error.message);
      }
    }
  };

  return (
    <View className="flex-1 bg-white p-6">
      <Text className="text-xl text-gray-500 mb-2">Personalize your feed</Text>
      <Text className="text-3xl font-bold mb-8">What are you interested in?</Text>

      <View className="flex-row flex-wrap gap-3">
        {CATEGORIES.map((cat) => {
          const isSelected = selectedInterests.includes(cat);
          return (
            <Pressable
              key={cat}
              onPress={() => toggleInterest(cat)}
              className={`px-6 py-3 rounded-full border-2 ${
                isSelected ? 'bg-black border-black' : 'bg-white border-gray-200'
              }`}
            >
              <Text className={`font-bold ${isSelected ? 'text-white' : 'text-gray-500'}`}>
                {cat}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable 
        onPress={handleConfirm}
        className="mt-auto bg-[#00822F] p-5 rounded-2xl"
      >
        <Text className="text-white text-center font-bold text-lg">Confirm Selection</Text>
      </Pressable>
    </View>
  );
}