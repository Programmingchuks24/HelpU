import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { type ReactElement } from "react";

// Moving this outside avoids recreation on every render
const ICONS: Record<string, (props: { color: string; size: number }) => ReactElement> = {
  home: (props) => <MaterialIcons name="home" {...props} />, 
  meetings: (props) => <FontAwesome name="calendar" {...props} />, 
  "messages/index": (props) => <MaterialIcons name="chat" {...props} />, // Ensure chat icon for messages tab
  profile: (props) => <FontAwesome name="user" {...props} />, 
};

const Layout = () => {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#00822F",
        tabBarInactiveTintColor: "gray",
        tabBarIcon: ({ color, size }) => {
          const IconRenderer = ICONS[route.name];
          return IconRenderer ? 
            <IconRenderer color={color} size={size} /> : 
            <MaterialIcons name="circle" size={size} color={color} />;
        },
      })}
    >
      <Tabs.Screen name="home" options={{ title: "Home" }} />
      <Tabs.Screen name="meetings" options={{ title: "Meetings" }} />
      <Tabs.Screen name="messages/index" options={{ title: "Messages" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
};

export default Layout;