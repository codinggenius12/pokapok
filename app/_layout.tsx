import { Analytics } from "@vercel/analytics/react";
import { Stack } from "expo-router";

import AnalyticsTracker from "@/components/analytics/AnalyticsTracker";
import { CartProvider } from "../src/context/CartContext";
import { LanguageProvider } from "../src/context/LanguageContext";

export default function RootLayout() {
  return (
    <LanguageProvider>
      <CartProvider>
        <AnalyticsTracker />
        <>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: {
                backgroundColor: "#F4F3EE",
              },
            }}
          />

          <Analytics />
        </>
      </CartProvider>
    </LanguageProvider>
  );
}