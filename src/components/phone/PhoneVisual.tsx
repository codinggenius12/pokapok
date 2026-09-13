import { Image, StyleSheet, View } from "react-native";
import { colors } from "../../theme/colors";
import type { Phone } from "../../types/phone";

type PhoneVisualVariant = "card" | "cart" | "checkout" | "product" | "hero";

type PhoneVisualProps = {
  phone: Phone;
  colorName?: string;
  variant?: PhoneVisualVariant;
};

type VariantSize = {
  frameWidth: number | `${number}%`;
  frameHeight: number;
  imageWidth: number;
  imageHeight: number;
};

const sizesByVariant: Record<PhoneVisualVariant, VariantSize> = {
  card: {
    frameWidth: 210,
    frameHeight: 230,
    imageWidth: 185,
    imageHeight: 205,
  },
  cart: {
    frameWidth: 86,
    frameHeight: 132,
    imageWidth: 74,
    imageHeight: 112,
  },
  checkout: {
    frameWidth: 110,
    frameHeight: 160,
    imageWidth: 94,
    imageHeight: 138,
  },
  product: {
    frameWidth: "100%",
    frameHeight: 470,
    imageWidth: 330,
    imageHeight: 410,
  },
  hero: {
    frameWidth: 430,
    frameHeight: 430,
    imageWidth: 360,
    imageHeight: 390,
  },
};

function getPhoneKey(phone: Phone) {
  return phone.slug || phone.id;
}

function getImageScale(phone: Phone, variant: PhoneVisualVariant) {
  const phoneKey = getPhoneKey(phone);

  const scaleOverrides: Record<
    string,
    Partial<Record<PhoneVisualVariant, number>>
  > = {
    "iphone-16-pro-max": {
      card: 1.22,
      cart: 1.05,
      checkout: 1.05,
      product: 1.05,
      hero: 1,
    },
    "iphone-16-pro": {
      card: 1.22,
      cart: 1.05,
      checkout: 1.05,
      product: 1.05,
      hero: 1,
    },
    "iphone-16": {
      card: 1.18,
      cart: 1.05,
      checkout: 1.05,
      product: 1.05,
      hero: 1,
    },
    "iphone-15-pro-max": {
      card: 1.2,
      cart: 1.05,
      checkout: 1.05,
      product: 1.05,
      hero: 1,
    },
    "iphone-15-pro": {
      card: 1.2,
      cart: 1.05,
      checkout: 1.05,
      product: 1.05,
      hero: 1,
    },
    "iphone-15": {
      card: 1.18,
      cart: 1.05,
      checkout: 1.05,
      product: 1.05,
      hero: 1,
    },
    "iphone-14-pro-max": {
      card: 1.2,
      cart: 1.05,
      checkout: 1.05,
      product: 1.05,
      hero: 1,
    },
    "iphone-14-pro": {
      card: 1.2,
      cart: 1.05,
      checkout: 1.05,
      product: 1.05,
      hero: 1,
    },
    "iphone-14": {
      card: 1.18,
      cart: 1.05,
      checkout: 1.05,
      product: 1.05,
      hero: 1,
    },
    "iphone-13-pro-max": {
      card: 1.22,
      cart: 1.05,
      checkout: 1.05,
      product: 1.05,
      hero: 1,
    },
    "iphone-13-pro": {
      card: 1.22,
      cart: 1.05,
      checkout: 1.05,
      product: 1.05,
      hero: 1,
    },
    "iphone-13": {
      card: 1.18,
      cart: 1.05,
      checkout: 1.05,
      product: 1.05,
      hero: 1,
    },

    "galaxy-s25": {
      card: 1,
      cart: 0.95,
      checkout: 0.95,
      product: 1,
      hero: 1,
    },
    "galaxy-s24-ultra": {
      card: 0.96,
      cart: 0.92,
      checkout: 0.92,
      product: 0.95,
      hero: 0.95,
    },
    "galaxy-s23": {
      card: 0.98,
      cart: 0.92,
      checkout: 0.92,
      product: 0.95,
      hero: 0.95,
    },
    "galaxy-a36": {
      card: 0.96,
      cart: 0.92,
      checkout: 0.92,
      product: 0.95,
      hero: 0.95,
    },
    "galaxy-a26": {
      card: 0.96,
      cart: 0.92,
      checkout: 0.92,
      product: 0.95,
      hero: 0.95,
    },

    "xiaomi-14-ultra": {
      card: 1,
      cart: 0.95,
      checkout: 0.95,
      product: 1,
      hero: 1,
    },
    "poco-x7-pro": {
      card: 0.95,
      cart: 0.9,
      checkout: 0.9,
      product: 0.95,
      hero: 0.95,
    },
    "redmi-note-14-pro-plus": {
      card: 0.88,
      cart: 0.86,
      checkout: 0.86,
      product: 0.9,
      hero: 0.9,
    },

    "nothing-phone-3a-pro": {
      card: 1.03,
      cart: 1.02,
      checkout: 1.02,
      product: 1.05,
      hero: 1.05,
    },
    "nothing-phone-3a": {
      card: 0.94,
      cart: 0.88,
      checkout: 0.88,
      product: 0.92,
      hero: 0.92,
    },
    "nothing-phone-2a-plus": {
      card: 0.92,
      cart: 0.86,
      checkout: 0.86,
      product: 0.9,
      hero: 0.9,
    },
    "nothing-phone-2": {
      card: 0.94,
      cart: 0.86,
      checkout: 0.86,
      product: 0.92,
      hero: 0.92,
    },
  };

  return scaleOverrides[phoneKey]?.[variant] ?? 1;
}

export default function PhoneVisual({
  phone,
  colorName,
  variant = "card",
}: PhoneVisualProps) {
  const selectedColor = colorName
    ? phone.colors.find((color) => color.name === colorName) ?? phone.colors[0]
    : phone.colors[0];

  const image = selectedColor?.image;
  const size = sizesByVariant[variant];
  const imageScale = getImageScale(phone, variant);

  const imageWidth = size.imageWidth * imageScale;
  const imageHeight = size.imageHeight * imageScale;

  if (image) {
    return (
      <View
        style={[
          styles.imageFrame,
          {
            width: size.frameWidth,
            height: size.frameHeight,
          },
        ]}
      >
        <Image
          source={image}
          resizeMode="contain"
          style={[
            styles.image,
            {
              width: imageWidth,
              height: imageHeight,
            },
          ]}
        />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.mockFrame,
        {
          width: size.frameWidth,
          height: size.frameHeight,
        },
      ]}
    >
      <View
        style={[
          styles.mockPhone,
          {
            width: imageWidth * 0.62,
            height: imageHeight,
          },
          variant === "hero" && styles.heroMockRotation,
          variant === "card" && styles.cardMockRotation,
        ]}
      >
        <View style={styles.mockScreen}>
          <View style={styles.island} />
          <View style={styles.orbOne} />
          <View style={styles.orbTwo} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  imageFrame: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  image: {
    zIndex: 2,
  },

  mockFrame: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  mockPhone: {
    backgroundColor: "#dfe4ee",
    padding: 7,
    borderRadius: 32,
  },
  cardMockRotation: {
    transform: [{ rotate: "-3deg" }],
  },
  heroMockRotation: {
    transform: [{ rotate: "5deg" }],
  },

  mockScreen: {
    flex: 1,
    borderRadius: 24,
    backgroundColor: colors.blue,
    overflow: "hidden",
  },
  island: {
    position: "absolute",
    top: 8,
    alignSelf: "center",
    width: 34,
    height: 9,
    borderRadius: 999,
    backgroundColor: "#050509",
    zIndex: 4,
  },
  orbOne: {
    position: "absolute",
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(255,255,255,0.20)",
    top: 35,
    left: -20,
  },
  orbTwo: {
    position: "absolute",
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(143,255,0,0.22)",
    bottom: 20,
    right: -18,
  },
});