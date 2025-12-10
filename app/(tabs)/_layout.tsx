import { Tabs } from "expo-router";
import { Camera, MapPin, User } from "lucide-react-native";
import { Colors, Fonts } from "../../constants/Styles";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textLight,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
        },
        tabBarLabelStyle: {
          fontFamily: Fonts.medium,
          fontSize: 12,
        },
        headerStyle: {
          backgroundColor: Colors.primaryLight,
        },
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Camera size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: "Map",
          headerTitle: "Bakery Map",
          headerTitleStyle: {
            fontFamily: Fonts.bold,
            color: Colors.primary,
            marginBottom: 8,
          },
          tabBarIcon: ({ color, size }) => <MapPin size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          headerShown: false,
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
