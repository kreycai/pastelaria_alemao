import * as SecureStore from "expo-secure-store";

const ADMIN_KEY = "admin_session";

export async function saveAdminSession(): Promise<void> {
  await SecureStore.setItemAsync(ADMIN_KEY, "1");
}

export async function clearAdminSession(): Promise<void> {
  await SecureStore.deleteItemAsync(ADMIN_KEY);
}

export async function getAdminSession(): Promise<boolean> {
  const val = await SecureStore.getItemAsync(ADMIN_KEY);
  return val === "1";
}
