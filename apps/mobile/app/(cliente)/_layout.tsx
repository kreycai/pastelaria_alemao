import { Tabs } from "expo-router";
import { Text } from "react-native";

export default function ClienteLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: "#0c0c0f", borderTopColor: "#18181c", borderTopWidth: 1 },
        tabBarActiveTintColor: "#dc2626",
        tabBarInactiveTintColor: "#52525b",
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="cardapio"
        options={{ title: "Cardápio", tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, opacity: color === "#dc2626" ? 1 : 0.5 }}>🥟</Text> }}
      />
      <Tabs.Screen
        name="fiado"
        options={{ title: "Meu Fiado", tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, opacity: color === "#dc2626" ? 1 : 0.5 }}>📒</Text> }}
      />
    </Tabs>
  );
}
