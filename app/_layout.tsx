import { Stack } from "expo-router";
import { CartProvider } from "../src/context/CartContext";

export default function RootLayout() {
  return (
    <CartProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#F4F3EE" },
        }}
      />
    </CartProvider>
  );
}