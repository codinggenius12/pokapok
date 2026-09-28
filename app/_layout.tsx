import { Stack } from "expo-router";

import { CartProvider } from "../src/context/CartContext";
import { LanguageProvider } from "../src/context/LanguageContext";

export default function RootLayout() {
  return (
    <LanguageProvider>
      <CartProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: {
              backgroundColor: "#F4F3EE",
            },
          }}
        />
      </CartProvider>
    </LanguageProvider>
  );
}