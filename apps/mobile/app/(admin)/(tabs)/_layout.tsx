import { Tabs } from "expo-router";
import { useEffect, useState } from "react";
import { router } from "expo-router";
import { View, ActivityIndicator, Text } from "react-native";
import { getAdminSession } from "@/lib/store";
import { registerForPushNotifications } from "@/lib/notifications";

function TabIcon({ emoji, color }: { emoji: string; color: string }) {
  return <Text style={{ fontSize: 20, opacity: color === "#dc2626" ? 1 : 0.5 }}>{emoji}</Text>;
}

export default function AdminTabsLayout() {
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    getAdminSession().then((ok) => {
      if (!ok) router.replace("/(admin)/login");
      else {
        setChecking(false);
        registerForPushNotifications();
      }
    });
  }, []);

  if (checking) {
    return (
      <View style={{ flex: 1, backgroundColor: "#09090b", alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color="#dc2626" />
      </View>
    );
  }

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
      <Tabs.Screen name="pedidos" options={{ title: "Pedidos", tabBarIcon: ({ color }) => <TabIcon emoji="🧾" color={color} /> }} />
      <Tabs.Screen name="novo-pedido" options={{ title: "Novo Pedido", tabBarIcon: ({ color }) => <TabIcon emoji="➕" color={color} /> }} />
      <Tabs.Screen name="estoque" options={{ title: "Estoque", tabBarIcon: ({ color }) => <TabIcon emoji="🛒" color={color} /> }} />
      <Tabs.Screen name="cozinha" options={{ title: "Cozinha", tabBarIcon: ({ color }) => <TabIcon emoji="🍳" color={color} /> }} />
    </Tabs>
  );
}
