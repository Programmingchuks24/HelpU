import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

const _layout = () => {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#00822F",
        tabBarInactiveTintColor: "gray",
        tabBarIcon: ({ color, size }) => {
          const icons: Record<string, JSX.Element> = {
            home: <MaterialIcons name="home" size={size} color={color} />,
            meetings: <FontAwesome name="calendar" size={size} color={color} />,
            messages: <MaterialIcons name="chat" size={size} color={color} />,
            profile: <FontAwesome name="user" size={size} color={color} />,
          };

          return (
            icons[route.name] ?? (
              <MaterialIcons name="circle" size={size} color={color} />
            )
          );
        },
      })}
    >
      <Tabs.Screen name="home" />
      <Tabs.Screen name="meetings" />
      <Tabs.Screen name="messages" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
};

export default _layout;
