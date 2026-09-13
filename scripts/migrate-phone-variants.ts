import "dotenv/config";

import fs from "node:fs";
import path from "node:path";

import { createClient } from "@supabase/supabase-js";

/* =========================================================
   ENV
========================================================= */

const SUPABASE_URL =
  process.env.SUPABASE_URL ??
  process.env.EXPO_PUBLIC_SUPABASE_URL;

const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL) {
  throw new Error(
    "Missing SUPABASE_URL or EXPO_PUBLIC_SUPABASE_URL."
  );
}

if (!SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    "Missing SUPABASE_SERVICE_ROLE_KEY."
  );
}

/* =========================================================
   SUPABASE
========================================================= */

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

/* =========================================================
   CONSTANTS
========================================================= */

const PRODUCT_IMAGES_BUCKET =
  "product-images";

const ROOT =
  process.cwd();

/*
 * When true:
 *
 * variants that exist in Supabase but are NOT present
 * in this catalogue will be removed.
 *
 * Leave false for the first full migration.
 */
const DELETE_STALE_VARIANTS =
  false;

/*
 * Updates the product-level default image to the first
 * colour image from phones.ts.
 */
const UPDATE_DEFAULT_PRODUCT_IMAGE =
  true;

/*
 * Sync product specifications from phones.ts.
 */
const MIGRATE_SPECIFICATIONS =
  true;

/* =========================================================
   TYPES
========================================================= */

type MigrationColor = {
  name: string;
  hex: string;
  imagePath: string;
};

type MigrationStorage = {
  label: string;
  priceIncrease: number;
};

type MigrationSpecs = {
  screen: string;
  chip: string;
  camera: string;
  battery: string;
  ram: string;
  os: string;
};

type MigrationPhone = {
  slug: string;
  name: string;

  price: number;

  leaseFrom: number;

  condition:
    | "new"
    | "refurbished"
    | "used";

  tagline: string;

  colors: MigrationColor[];

  storage: MigrationStorage[];

  specs: MigrationSpecs;
};

type ExistingVariant = {
  id: string;

  storage: string;
  color: string;

  stock: number | null;
  available: boolean | null;

  purchase_price:
    | number
    | null;

  promotional_price:
    | number
    | null;

  refurbished_purchase_price:
    | number
    | null;

  refurbished_sale_price:
    | number
    | null;

  refurbished_promotional_price:
    | number
    | null;
};

/* =========================================================
   COMPLETE PHONES.TS CATALOGUE
========================================================= */

const phones: MigrationPhone[] = [
  /* =======================================================
     APPLE
  ======================================================= */

  {
    slug: "iphone-16-pro-max",

    name: "iPhone 16 Pro Max",

    price: 1299,

    leaseFrom: 49.99,

    condition: "new",

    tagline:
      "Apple’s most advanced iPhone with a premium titanium design, powerful camera system and excellent battery life.",

    colors: [
      {
        name: "Desert Titanium",
        hex: "#C7B29A",
        imagePath:
          "assets/images/phones/apple/iPhone_16_Pro_Max_gold.png",
      },
      {
        name: "Black Titanium",
        hex: "#2C2C2E",
        imagePath:
          "assets/images/phones/apple/Iphone16promax_black.png",
      },
      {
        name: "Natural Titanium",
        hex: "#B8B2A8",
        imagePath:
          "assets/images/phones/apple/Iphone16promax_titanium_natural.png",
      },
      {
        name: "White Titanium",
        hex: "#F1F1ED",
        imagePath:
          "assets/images/phones/apple/Iphone16promax_white.png",
      },
    ],

    storage: [
      {
        label: "256GB",
        priceIncrease: 0,
      },
      {
        label: "512GB",
        priceIncrease: 210,
      },
      {
        label: "1TB",
        priceIncrease: 440,
      },
    ],

    specs: {
      screen: "6.9 OLED 120Hz",
      chip: "A18 Pro",
      camera:
        "48MP Fusion camera system",
      battery:
        "Up to 33 hours video playback",
      ram: "8GB",
      os: "iOS 18",
    },
  },

  {
    slug: "iphone-16-pro",

    name: "iPhone 16 Pro",

    price: 929,

    leaseFrom: 44.99,

    condition: "new",

    tagline:
      "A compact Pro iPhone with A18 Pro, titanium design, powerful cameras and premium performance.",

    colors: [
      {
        name: "Natural Titanium",
        hex: "#B8B2A8",
        imagePath:
          "assets/images/phones/apple/iphone16pro.png",
      },
      {
        name: "Desert Titanium",
        hex: "#C7B29A",
        imagePath:
          "assets/images/phones/apple/iphone16pro_desert_titanium.png",
      },
      {
        name: "Black Titanium",
        hex: "#2C2C2E",
        imagePath:
          "assets/images/phones/apple/iphone-16-pro-black-titanium.png",
      },
      {
        name: "White Titanium",
        hex: "#F1F1ED",
        imagePath:
          "assets/images/phones/apple/iphone-16-pro-white-titanium.png",
      },
    ],

    storage: [
      {
        label: "128GB",
        priceIncrease: 0,
      },
      {
        label: "256GB",
        priceIncrease: 95,
      },
      {
        label: "512GB",
        priceIncrease: 240,
      },
      {
        label: "1TB",
        priceIncrease: 430,
      },
    ],

    specs: {
      screen: "6.3 OLED 120Hz",
      chip: "A18 Pro",
      camera:
        "48MP Pro camera system",
      battery:
        "Up to 27 hours video playback",
      ram: "8GB",
      os: "iOS 18",
    },
  },

  {
    slug: "iphone-16",

    name: "iPhone 16",

    price: 879,

    leaseFrom: 36.99,

    condition: "new",

    tagline:
      "A modern iPhone with A18 chip, Camera Control, strong battery life and a bright OLED display.",

    colors: [
      {
        name: "Black",
        hex: "#1F2329",
        imagePath:
          "assets/images/phones/apple/iphone16_black.png",
      },
      {
        name: "Green",
        hex: "#4CA6A8",
        imagePath:
          "assets/images/phones/apple/iphone16_green.png",
      },
      {
        name: "Ultramarine",
        hex: "#5468D4",
        imagePath:
          "assets/images/phones/apple/iphone16_blue.png",
      },
      {
        name: "White",
        hex: "#F4F1EA",
        imagePath:
          "assets/images/phones/apple/iphone16_white.png",
      },
      {
        name: "Pink",
        hex: "#F5B8C8",
        imagePath:
          "assets/images/phones/apple/iphone16_pink.png",
      },
    ],

    storage: [
      {
        label: "128GB",
        priceIncrease: 0,
      },
      {
        label: "256GB",
        priceIncrease: 80,
      },
      {
        label: "512GB",
        priceIncrease: 160,
      },
    ],

    specs: {
      screen: "6.1 OLED 60Hz",
      chip: "A18",
      camera:
        "48MP dual camera system",
      battery:
        "Up to 22 hours video playback",
      ram: "8GB",
      os: "iOS 18",
    },
  },

  {
    slug: "iphone-15-pro-max",

    name: "iPhone 15 Pro Max",

    price: 719,

    leaseFrom: 39.99,

    condition: "refurbished",

    tagline:
      "A large titanium Pro iPhone with A17 Pro, USB-C, excellent battery life and a professional camera system.",

    colors: [
      {
        name: "Natural Titanium",
        hex: "#B8B2A8",
        imagePath:
          "assets/images/phones/apple/iphone-15-pro-max-256-gb-titanio-natural.png",
      },
      {
        name: "Black Titanium",
        hex: "#2C2C2E",
        imagePath:
          "assets/images/phones/apple/iphone-15-pro-max-black-titanium.png",
      },
      {
        name: "White Titanium",
        hex: "#F1F1ED",
        imagePath:
          "assets/images/phones/apple/iphone-15-pro-max-white-titanium-.png",
      },
      {
        name: "Blue Titanium",
        hex: "#59677D",
        imagePath:
          "assets/images/phones/apple/iphone-15-pro-max-blue-titanium-256-gb.jpg.png",
      },
    ],

    storage: [
      {
        label: "256GB",
        priceIncrease: 0,
      },
      {
        label: "512GB",
        priceIncrease: 150,
      },
      {
        label: "1TB",
        priceIncrease: 310,
      },
    ],

    specs: {
      screen: "6.7 OLED 120Hz",
      chip: "A17 Pro",
      camera:
        "48MP Pro camera system",
      battery:
        "Up to 29 hours video playback",
      ram: "8GB",
      os: "iOS 18",
    },
  },

  {
    slug: "iphone-15-pro",

    name: "iPhone 15 Pro",

    price: 639,

    leaseFrom: 34.99,

    condition: "refurbished",

    tagline:
      "A premium iPhone with a lightweight titanium design, A17 Pro chip, USB-C, strong battery life and a professional camera system.",

    colors: [
      {
        name: "Black Titanium",
        hex: "#2C2C2E",
        imagePath:
          "assets/images/phones/apple/Iphone15pro_TitaniumBlack.png",
      },
      {
        name: "White Titanium",
        hex: "#F1F1ED",
        imagePath:
          "assets/images/phones/apple/iPhone15pro_TitaniumBlanco.png",
      },
      {
        name: "Blue Titanium",
        hex: "#59677D",
        imagePath:
          "assets/images/phones/apple/Iphone15pro_TitaniumBlue.png",
      },
      {
        name: "Natural Titanium",
        hex: "#B8B2A8",
        imagePath:
          "assets/images/phones/apple/Iphone15pro_TitaniumNatural.png",
      },
    ],

    storage: [
      {
        label: "128GB",
        priceIncrease: 0,
      },
      {
        label: "256GB",
        priceIncrease: 80,
      },
      {
        label: "512GB",
        priceIncrease: 190,
      },
      {
        label: "1TB",
        priceIncrease: 330,
      },
    ],

    specs: {
      screen: "6.1 OLED 120Hz",
      chip: "A17 Pro",
      camera:
        "48MP Pro camera system",
      battery:
        "Up to 23 hours video playback",
      ram: "8GB",
      os: "iOS 18",
    },
  },

  {
    slug: "iphone-15",

    name: "iPhone 15",

    price: 659,

    leaseFrom: 31.99,

    condition: "new",

    tagline:
      "A modern iPhone with Dynamic Island, USB-C, a bright OLED display, strong battery life and a powerful 48MP camera system.",

    colors: [
      {
        name: "Black",
        hex: "#1F2329",
        imagePath:
          "assets/images/phones/apple/Apple_iPhone_15_black.png",
      },
      {
        name: "Blue",
        hex: "#B9D7E8",
        imagePath:
          "assets/images/phones/apple/Apple_iPhone_15_blue.png",
      },
      {
        name: "Yellow",
        hex: "#F4E7A1",
        imagePath:
          "assets/images/phones/apple/Apple_iPhone_15_yellow.png",
      },
    ],

    storage: [
      {
        label: "128GB",
        priceIncrease: 0,
      },
      {
        label: "256GB",
        priceIncrease: 85,
      },
      {
        label: "512GB",
        priceIncrease: 210,
      },
    ],

    specs: {
      screen: "6.1 OLED 60Hz",
      chip: "A16 Bionic",
      camera:
        "48MP dual camera system",
      battery:
        "Up to 20 hours video playback",
      ram: "6GB",
      os: "iOS 18",
    },
  },

  {
    slug: "iphone-14-pro-max",

    name: "iPhone 14 Pro Max",

    price: 619,

    leaseFrom: 32.99,

    condition: "refurbished",

    tagline:
      "A large Pro iPhone with Dynamic Island, ProMotion display, excellent battery life and a powerful 48MP camera system.",

    colors: [
      {
        name: "Space Black",
        hex: "#252527",
        imagePath:
          "assets/images/phones/apple/iphone-14-pro-max-space-black-128-gb.jpg.png",
      },
      {
        name: "Silver",
        hex: "#F1F1ED",
        imagePath:
          "assets/images/phones/apple/iphone-14-pro-max-silver.png",
      },
      {
        name: "Gold",
        hex: "#F3D6A4",
        imagePath:
          "assets/images/phones/apple/iphone-14-pro-max-gold-128-gb.jpg.png",
      },
      {
        name: "Deep Purple",
        hex: "#594F63",
        imagePath:
          "assets/images/phones/apple/iphone14promax_deep_purple.png",
      },
    ],

    storage: [
      {
        label: "128GB",
        priceIncrease: 0,
      },
      {
        label: "256GB",
        priceIncrease: 80,
      },
      {
        label: "512GB",
        priceIncrease: 190,
      },
      {
        label: "1TB",
        priceIncrease: 330,
      },
    ],

    specs: {
      screen: "6.7 OLED 120Hz",
      chip: "A16 Bionic",
      camera:
        "48MP Pro camera system",
      battery:
        "Up to 29 hours video playback",
      ram: "6GB",
      os: "iOS 18",
    },
  },

  {
    slug: "iphone-14-pro",

    name: "iPhone 14 Pro",

    price: 519,

    leaseFrom: 29.99,

    condition: "refurbished",

    tagline:
      "A premium Pro iPhone with Dynamic Island, 120Hz display, A16 Bionic chip and a professional camera system.",

    colors: [
      {
        name: "Gold",
        hex: "#F3D6A4",
        imagePath:
          "assets/images/phones/apple/iphone-14-pro-gold.png",
      },
      {
        name: "Space Black",
        hex: "#252527",
        imagePath:
          "assets/images/phones/apple/iphone-14-pro-space-black-128-gb.jpg.png",
      },
      {
        name: "Silver",
        hex: "#F1F1ED",
        imagePath:
          "assets/images/phones/apple/iphone-14-pro-silver-128-gb.jpg.png",
      },
      {
        name: "Deep Purple",
        hex: "#594F63",
        imagePath:
          "assets/images/phones/apple/iphone-14-pro-deep-purple.png",
      },
    ],

    storage: [
      {
        label: "128GB",
        priceIncrease: 0,
      },
      {
        label: "256GB",
        priceIncrease: 75,
      },
      {
        label: "512GB",
        priceIncrease: 180,
      },
      {
        label: "1TB",
        priceIncrease: 310,
      },
    ],

    specs: {
      screen: "6.1 OLED 120Hz",
      chip: "A16 Bionic",
      camera:
        "48MP Pro camera system",
      battery:
        "Up to 23 hours video playback",
      ram: "6GB",
      os: "iOS 18",
    },
  },

  {
    slug: "iphone-14",

    name: "iPhone 14",

    price: 389,

    leaseFrom: 22.99,

    condition: "refurbished",

    tagline:
      "A reliable iPhone with a bright OLED display, strong battery life and a smooth iOS experience.",

    colors: [
      {
        name: "Blue",
        hex: "#AFCBE3",
        imagePath:
          "assets/images/phones/apple/iphone14_blue.png",
      },
      {
        name: "Midnight",
        hex: "#1F2329",
        imagePath:
          "assets/images/phones/apple/iphone14_black.jpg",
      },
      {
        name: "Starlight",
        hex: "#F4F1EA",
        imagePath:
          "assets/images/phones/apple/iphone14_white.png",
      },
      {
        name: "Yellow",
        hex: "#F4E36B",
        imagePath:
          "assets/images/phones/apple/iphone14_yellow.png",
      },
      {
        name: "Purple",
        hex: "#D8C5EA",
        imagePath:
          "assets/images/phones/apple/iphone14_purple.png",
      },
      {
        name: "Red",
        hex: "#C91F2C",
        imagePath:
          "assets/images/phones/apple/iphone14_red.jpg",
      },
    ],

    storage: [
      {
        label: "128GB",
        priceIncrease: 0,
      },
      {
        label: "256GB",
        priceIncrease: 65,
      },
      {
        label: "512GB",
        priceIncrease: 155,
      },
    ],

    specs: {
      screen: "6.1 OLED 60Hz",
      chip: "A15 Bionic",
      camera:
        "12MP dual camera system",
      battery:
        "Up to 20 hours video playback",
      ram: "6GB",
      os: "iOS 18",
    },
  },

  {
    slug: "iphone-13-pro-max",

    name: "iPhone 13 Pro Max",

    price: 489,

    leaseFrom: 26.99,

    condition: "refurbished",

    tagline:
      "A powerful Pro Max iPhone with a large OLED ProMotion display, excellent battery life, premium camera system and strong everyday performance.",

    colors: [
      {
        name: "Graphite",
        hex: "#3A3A3C",
        imagePath:
          "assets/images/phones/apple/iphone-13-pro-max-black.png",
      },
      {
        name: "Gold",
        hex: "#F3D6A4",
        imagePath:
          "assets/images/phones/apple/iPhone-13-pro-max-gold.png",
      },
      {
        name: "Sierra Blue",
        hex: "#A7B8C9",
        imagePath:
          "assets/images/phones/apple/iphone13promax_blue.png",
      },
      {
        name: "Silver",
        hex: "#F1F1ED",
        imagePath:
          "assets/images/phones/apple/iphone13promax_white.png",
      },
    ],

    storage: [
      {
        label: "128GB",
        priceIncrease: 0,
      },
      {
        label: "256GB",
        priceIncrease: 70,
      },
      {
        label: "512GB",
        priceIncrease: 165,
      },
      {
        label: "1TB",
        priceIncrease: 290,
      },
    ],

    specs: {
      screen: "6.7 OLED 120Hz",
      chip: "A15 Bionic",
      camera:
        "12MP Pro camera system",
      battery:
        "Up to 28 hours video playback",
      ram: "6GB",
      os: "iOS 18",
    },
  },

  {
    slug: "iphone-13-pro",

    name: "iPhone 13 Pro",

    price: 419,

    leaseFrom: 22.99,

    condition: "refurbished",

    tagline:
      "A premium refurbished iPhone with ProMotion display, strong camera system and reliable performance.",

    colors: [
      {
        name: "Graphite",
        hex: "#3A3A3C",
        imagePath:
          "assets/images/phones/apple/iPhone-13-pro-graphite-128gb.jpg.png",
      },
      {
        name: "Gold",
        hex: "#F3D6A4",
        imagePath:
          "assets/images/phones/apple/iPhone-13-pro-gold-256gb.jpg.png",
      },
      {
        name: "Sierra Blue",
        hex: "#A7B8C9",
        imagePath:
          "assets/images/phones/apple/iPhone-13-pro-sierra-blue-128gb.jpg.png",
      },
      {
        name: "Silver",
        hex: "#F1F1ED",
        imagePath:
          "assets/images/phones/apple/iPhone-13-pro-silver-128gb.jpg.png",
      },
      {
        name: "Alpine Green",
        hex: "#576856",
        imagePath:
          "assets/images/phones/apple/iPhone-13-pro-alpine-green-128gb.jpg.png",
      },
    ],

    storage: [
      {
        label: "128GB",
        priceIncrease: 0,
      },
      {
        label: "256GB",
        priceIncrease: 65,
      },
      {
        label: "512GB",
        priceIncrease: 155,
      },
      {
        label: "1TB",
        priceIncrease: 270,
      },
    ],

    specs: {
      screen: "6.1 OLED 120Hz",
      chip: "A15 Bionic",
      camera:
        "12MP Pro camera system",
      battery:
        "Up to 22 hours video playback",
      ram: "6GB",
      os: "iOS 18",
    },
  },

  {
    slug: "iphone-13",

    name: "iPhone 13",

    price: 329,

    leaseFrom: 17.99,

    condition: "refurbished",

    tagline:
      "A reliable iPhone with a sharp OLED display, strong battery life, dual-camera system and smooth iOS performance.",

    colors: [
      {
        name: "Blue",
        hex: "#5B7FA6",
        imagePath:
          "assets/images/phones/apple/iphone13_blue.png",
      },
      {
        name: "Midnight",
        hex: "#1F2329",
        imagePath:
          "assets/images/phones/apple/iphone13_black.png",
      },
      {
        name: "Starlight",
        hex: "#F4F1EA",
        imagePath:
          "assets/images/phones/apple/iphone13_white.png",
      },
      {
        name: "Pink",
        hex: "#F5C8C6",
        imagePath:
          "assets/images/phones/apple/iphone13_pink.png",
      },
    ],

    storage: [
      {
        label: "128GB",
        priceIncrease: 0,
      },
      {
        label: "256GB",
        priceIncrease: 55,
      },
      {
        label: "512GB",
        priceIncrease: 140,
      },
    ],

    specs: {
      screen: "6.1 OLED 60Hz",
      chip: "A15 Bionic",
      camera:
        "12MP dual camera system",
      battery:
        "Up to 19 hours video playback",
      ram: "4GB",
      os: "iOS 18",
    },
  },

  /* =======================================================
     SAMSUNG
  ======================================================= */

  {
    slug: "galaxy-s25",

    name: "Samsung Galaxy S25",

    price: 679,

    leaseFrom: 34.99,

    condition: "new",

    tagline:
      "A modern Samsung flagship with Galaxy AI, premium performance, a bright AMOLED display and a refined camera system.",

    colors: [
      {
        name: "Black",
        hex: "#1F1F1F",
        imagePath:
          "assets/images/phones/samsung/samsung_galaxy_S25_black.png",
      },
      {
        name: "Green",
        hex: "#C7E4D5",
        imagePath:
          "assets/images/phones/samsung/Samsung_Galaxy_S25_green.png",
      },
      {
        name: "Grey",
        hex: "#C9C9C9",
        imagePath:
          "assets/images/phones/samsung/Samsung_Galaxy_S25_grey.png",
      },
      {
        name: "Navy",
        hex: "#303849",
        imagePath:
          "assets/images/phones/samsung/Samsung_Galaxy_S25_navy.png",
      },
    ],

    storage: [
      {
        label: "128GB",
        priceIncrease: 0,
      },
      {
        label: "256GB",
        priceIncrease: 75,
      },
      {
        label: "512GB",
        priceIncrease: 180,
      },
    ],

    specs: {
      screen: "6.2 AMOLED 120Hz",
      chip:
        "Snapdragon 8 Elite",
      camera:
        "50MP triple camera system",
      battery: "4000mAh",
      ram: "12GB",
      os: "Android",
    },
  },

  {
    slug: "galaxy-s24-ultra",

    name: "Galaxy S24 Ultra",

    price: 799,

    leaseFrom: 44.99,

    condition: "new",

    tagline:
      "A powerful Android flagship with a premium display, strong camera system and built-in Galaxy AI features.",

    colors: [
      {
        name: "Titanium Grey",
        hex: "#8F8D91",
        imagePath:
          "assets/images/phones/samsung/Samsung_GalaxyS24Ultra_TitaniumGrey-removebg-preview.png",
      },
      {
        name: "Titanium Black",
        hex: "#2B2B2F",
        imagePath:
          "assets/images/phones/samsung/Samsung_Galaxy_S24Ultra_TitaniumBlack-removebg-preview.png",
      },
      {
        name: "Titanium Purple",
        hex: "#8C7AA9",
        imagePath:
          "assets/images/phones/samsung/Samsung_GalaxyS24_TitaniumPurple-removebg-preview.png",
      },
      {
        name: "Titanium Yellow",
        hex: "#D6C7A1",
        imagePath:
          "assets/images/phones/samsung/Samsung_GalaxyS24_Titaniumyellow-removebg-preview.png",
      },
    ],

    storage: [
      {
        label: "256GB",
        priceIncrease: 0,
      },
      {
        label: "512GB",
        priceIncrease: 115,
      },
      {
        label: "1TB",
        priceIncrease: 240,
      },
    ],

    specs: {
      screen: "6.8 AMOLED 120Hz",
      chip:
        "Snapdragon 8 Gen 3",
      camera:
        "200MP quad camera system",
      battery: "5000mAh",
      ram: "12GB",
      os: "Android",
    },
  },

  {
    slug: "galaxy-s23",

    name: "Samsung Galaxy S23",

    price: 319,

    leaseFrom: 22.99,

    condition: "refurbished",

    tagline:
      "A compact premium Samsung phone with strong performance, a bright AMOLED display and a reliable triple camera system.",

    colors: [
      {
        name: "Phantom Black",
        hex: "#1F1F1F",
        imagePath:
          "assets/images/phones/samsung/Samsung_Galaxy_S23_black.jpg",
      },
      {
        name: "Cream",
        hex: "#EFE8D8",
        imagePath:
          "assets/images/phones/samsung/Samsung_Galaxy_S23_gold.jpg",
      },
      {
        name: "Green",
        hex: "#6F7C69",
        imagePath:
          "assets/images/phones/samsung/Samsung_Galaxy_S23_green.png",
      },
      {
        name: "Lavender",
        hex: "#D8C8E8",
        imagePath:
          "assets/images/phones/samsung/Samsung_Galaxy_S23_purple.jpg",
      },
    ],

    storage: [
      {
        label: "128GB",
        priceIncrease: 0,
      },
      {
        label: "256GB",
        priceIncrease: 65,
      },
    ],

    specs: {
      screen: "6.1 AMOLED 120Hz",
      chip:
        "Snapdragon 8 Gen 2",
      camera:
        "50MP triple camera system",
      battery: "3900mAh",
      ram: "8GB",
      os: "Android",
    },
  },

  {
    slug: "galaxy-a36",

    name: "Samsung Galaxy A36",

    price: 279,

    leaseFrom: 15.99,

    condition: "new",

    tagline:
      "A practical Samsung phone with a smooth AMOLED display, strong everyday performance and affordable monthly options.",

    colors: [
      {
        name: "Awesome Black",
        hex: "#111111",
        imagePath:
          "assets/images/phones/samsung/Samsung-Galaxy-A36_black.jpg",
      },
      {
        name: "Awesome White",
        hex: "#F4F4F4",
        imagePath:
          "assets/images/phones/samsung/Samsung_Galaxy_A36_white.jpg",
      },
      {
        name: "Awesome Green",
        hex: "#C7E4D5",
        imagePath:
          "assets/images/phones/samsung/Samsung_Galaxy_A36_green-removebg-preview.png",
      },
      {
        name: "Awesome Lavender",
        hex: "#D6C5EA",
        imagePath:
          "assets/images/phones/samsung/Samsung-Galaxy_A36_purple-removebg-preview.png",
      },
    ],

    storage: [
      {
        label: "128GB",
        priceIncrease: 0,
      },
      {
        label: "256GB",
        priceIncrease: 60,
      },
    ],

    specs: {
      screen: "6.7 AMOLED 120Hz",
      chip: "Exynos 1580",
      camera:
        "50MP triple camera system",
      battery: "5000mAh",
      ram: "8GB",
      os: "Android",
    },
  },

  {
    slug: "galaxy-a26",

    name: "Samsung Galaxy A26",

    price: 229,

    leaseFrom: 12.99,

    condition: "new",

    tagline:
      "An affordable Samsung smartphone with a large display, reliable battery life and useful everyday performance.",

    colors: [
      {
        name: "Black",
        hex: "#111111",
        imagePath:
          "assets/images/phones/samsung/Samsung-Galaxy_A26_black.jpg",
      },
      {
        name: "Green",
        hex: "#C7E4D5",
        imagePath:
          "assets/images/phones/samsung/Samsung_Galaxy_A26_green.jpg",
      },
      {
        name: "White",
        hex: "#F4F4F4",
        imagePath:
          "assets/images/phones/samsung/samsung-galaxy-a26-5g-67-dual-sim-6gb128gb-branco.jpg-removebg-preview.png",
      },
    ],

    storage: [
      {
        label: "128GB",
        priceIncrease: 0,
      },
      {
        label: "256GB",
        priceIncrease: 55,
      },
    ],

    specs: {
      screen: "6.7 AMOLED 120Hz",
      chip: "Exynos 1380",
      camera:
        "50MP triple camera system",
      battery: "5000mAh",
      ram: "6GB",
      os: "Android",
    },
  },

  /* =======================================================
     XIAOMI
  ======================================================= */

  {
    slug: "xiaomi-14-ultra",

    name: "Xiaomi 14 Ultra",

    price: 789,

    leaseFrom: 39.99,

    condition: "new",

    tagline:
      "A camera-focused Android flagship with Leica optics, a premium AMOLED display, fast performance and a high-end design.",

    colors: [
      {
        name: "Black",
        hex: "#111111",
        imagePath:
          "assets/images/phones/xiaomi/Xiaomi14Ultra_black.png",
      },
      {
        name: "Silver",
        hex: "#D8D8D2",
        imagePath:
          "assets/images/phones/xiaomi/Xiaomi14Ultra_silver.png",
      },
    ],

    storage: [
      {
        label: "256GB",
        priceIncrease: 0,
      },
      {
        label: "512GB",
        priceIncrease: 110,
      },
      {
        label: "1TB",
        priceIncrease: 250,
      },
    ],

    specs: {
      screen: "6.73 AMOLED 120Hz",
      chip:
        "Snapdragon 8 Gen 3",
      camera:
        "Leica quad camera system",
      battery: "5000mAh",
      ram: "12GB",
      os: "Android",
    },
  },

  {
    slug: "poco-x7-pro",

    name: "Xiaomi POCO X7 Pro",

    price: 389,

    leaseFrom: 16.99,

    condition: "new",

    tagline:
      "A performance-focused Xiaomi phone with a smooth AMOLED display, large battery and strong value for the price.",

    colors: [
      {
        name: "Black",
        hex: "#111111",
        imagePath:
          "assets/images/phones/xiaomi/xiaomi_poco_x7_black.jpg",
      },
      {
        name: "Green",
        hex: "#63796B",
        imagePath:
          "assets/images/phones/xiaomi/xiaomi-poco-x7-pro.png",
      },
      {
        name: "Yellow",
        hex: "#E9C94A",
        imagePath:
          "assets/images/phones/xiaomi/xiaomi-poco-x7-pro-yellow.png",
      },
    ],

    storage: [
      {
        label: "256GB",
        priceIncrease: 0,
      },
      {
        label: "512GB",
        priceIncrease: 55,
      },
    ],

    specs: {
      screen: "6.67 AMOLED 120Hz",
      chip:
        "Dimensity 8400 Ultra",
      camera:
        "50MP dual camera system",
      battery: "6000mAh",
      ram: "12GB",
      os: "Android",
    },
  },

  {
    slug: "redmi-note-14-pro-plus",

    name: "Redmi Note 14 Pro+",

    price: 349,

    leaseFrom: 18.99,

    condition: "new",

    tagline:
      "A strong value smartphone with a premium curved display, powerful camera system, large battery and affordable monthly options.",

    colors: [
      {
        name: "Midnight Black",
        hex: "#111111",
        imagePath:
          "assets/images/phones/xiaomi/xiaomi-redmi-note-14-pro-midnight-black.png",
      },
      {
        name: "Lavender Purple",
        hex: "#BFA7E8",
        imagePath:
          "assets/images/phones/xiaomi/redmi-note-14-pro-plus-purple.png",
      },
    ],

    storage: [
      {
        label: "128GB",
        priceIncrease: 0,
      },
      {
        label: "256GB",
        priceIncrease: 55,
      },
      {
        label: "512GB",
        priceIncrease: 110,
      },
    ],

    specs: {
      screen: "6.67 AMOLED 120Hz",
      chip:
        "Snapdragon 7s Gen 3",
      camera:
        "200MP main camera",
      battery: "5110mAh",
      ram: "8GB",
      os: "Android",
    },
  },

  /* =======================================================
     NOTHING
  ======================================================= */

  {
    slug: "nothing-phone-3a-pro",

    name: "Nothing Phone (3a) Pro",

    price: 429,

    leaseFrom: 19.99,

    condition: "new",

    tagline:
      "A premium Nothing smartphone with a transparent design, Glyph lighting, smooth AMOLED display, strong battery life and an upgraded camera system.",

    colors: [
      {
        name: "Black",
        hex: "#222222",
        imagePath:
          "assets/images/phones/nothing/nothing3apro_black.png",
      },
      {
        name: "Grey",
        hex: "#A8A8A8",
        imagePath:
          "assets/images/phones/nothing/nothingphone3apro_grey.png",
      },
    ],

    storage: [
      {
        label: "256GB",
        priceIncrease: 0,
      },
      {
        label: "512GB",
        priceIncrease: 75,
      },
    ],

    specs: {
      screen: "6.77 AMOLED 120Hz",
      chip:
        "Snapdragon 7s Gen 3",
      camera:
        "50MP triple camera system",
      battery: "5000mAh",
      ram: "12GB",
      os: "Nothing OS",
    },
  },

  {
    slug: "nothing-phone-3a",

    name: "Nothing Phone (3a)",

    price: 379,

    leaseFrom: 16.99,

    condition: "new",

    tagline:
      "A stylish mid-range smartphone with Nothing’s transparent design language, Glyph lighting, smooth AMOLED display and strong everyday performance.",

    colors: [
      {
        name: "White",
        hex: "#F5F5F5",
        imagePath:
          "assets/images/phones/nothing/nothingphone_3a_white.png",
      },
      {
        name: "Black",
        hex: "#222222",
        imagePath:
          "assets/images/phones/nothing/nothingphone3a_black.png",
      },
    ],

    storage: [
      {
        label: "128GB",
        priceIncrease: 0,
      },
      {
        label: "256GB",
        priceIncrease: 55,
      },
    ],

    specs: {
      screen: "6.77 AMOLED 120Hz",
      chip:
        "Snapdragon 7s Gen 3",
      camera:
        "50MP triple camera system",
      battery: "5000mAh",
      ram: "8GB",
      os: "Nothing OS",
    },
  },

  {
    slug: "nothing-phone-2a-plus",

    name: "Nothing Phone (2a) Plus",

    price: 379,

    leaseFrom: 18.49,

    condition: "new",

    tagline:
      "A stylish Nothing smartphone with a transparent design, Glyph lighting, smooth AMOLED display, strong battery life and upgraded everyday performance.",

    colors: [
      {
        name: "Black",
        hex: "#222222",
        imagePath:
          "assets/images/phones/nothing/nothing2aplus_black.jpeg",
      },
      {
        name: "Silver",
        hex: "#D8D8D2",
        imagePath:
          "assets/images/phones/nothing/nothing2aplus_silver.jpeg",
      },
    ],

    storage: [
      {
        label: "256GB",
        priceIncrease: 0,
      },
      {
        label: "512GB",
        priceIncrease: 75,
      },
    ],

    specs: {
      screen: "6.7 AMOLED 120Hz",
      chip:
        "MediaTek Dimensity 7350 Pro",
      camera:
        "50MP dual camera system",
      battery: "5000mAh",
      ram: "12GB",
      os: "Nothing OS",
    },
  },

  {
    slug: "nothing-phone-2",

    name: "Nothing Phone (2)",

    price: 399,

    leaseFrom: 24.99,

    condition: "refurbished",

    tagline:
      "A unique smartphone with a transparent design, Glyph interface, clean Nothing OS experience and smooth everyday performance.",

    colors: [
      {
        name: "Black",
        hex: "#222222",
        imagePath:
          "assets/images/phones/nothing/nothingphone2_black.png",
      },
      {
        name: "White",
        hex: "#F5F5F5",
        imagePath:
          "assets/images/phones/nothing/nothingphone2_white-.png",
      },
    ],

    storage: [
      {
        label: "128GB",
        priceIncrease: 0,
      },
      {
        label: "256GB",
        priceIncrease: 60,
      },
      {
        label: "512GB",
        priceIncrease: 140,
      },
    ],

    specs: {
      screen: "6.7 OLED 120Hz",
      chip:
        "Snapdragon 8+ Gen 1",
      camera:
        "50MP dual camera",
      battery: "4700mAh",
      ram: "8GB",
      os: "Nothing OS",
    },
  },
];

/* =========================================================
   HELPERS
========================================================= */

function slugify(
  value: string
) {
  return value
    .toLowerCase()
    .trim()
    .replace(
      /[^a-z0-9]+/g,
      "-"
    )
    .replace(
      /^-+|-+$/g,
      ""
    );
}

function normalizeKey(
  storage: string,
  color: string
) {
  return `${storage
    .trim()
    .toLowerCase()}::${color
    .trim()
    .toLowerCase()}`;
}

function contentTypeFromExtension(
  extension: string
) {
  switch (
    extension.toLowerCase()
  ) {
    case ".png":
      return "image/png";

    case ".webp":
      return "image/webp";

    case ".jpg":
    case ".jpeg":
      return "image/jpeg";

    case ".gif":
      return "image/gif";

    default:
      return "application/octet-stream";
  }
}

function assertLocalImageExists(
  imagePath: string
) {
  const absolutePath =
    path.join(
      ROOT,
      imagePath
    );

  if (
    !fs.existsSync(
      absolutePath
    )
  ) {
    throw new Error(
      `Image not found: ${absolutePath}`
    );
  }

  return absolutePath;
}

/* =========================================================
   PREFLIGHT IMAGE CHECK
========================================================= */

function validateAllImages() {
  console.log("");
  console.log(
    "Checking local image files..."
  );

  let imageCount =
    0;

  for (
    const phone of
    phones
  ) {
    for (
      const color of
      phone.colors
    ) {
      assertLocalImageExists(
        color.imagePath
      );

      imageCount +=
        1;
    }
  }

  console.log(
    `✓ ${imageCount} local colour images found.`
  );
}

/* =========================================================
   GET PRODUCT
========================================================= */

async function getProduct(
  phone: MigrationPhone
) {
  const {
    data,
    error,
  } = await supabase
    .from(
      "products"
    )
    .select(
      `
        id,
        name,
        slug,
        condition,
        sale_price,
        purchase_price,
        promotional_price,
        image_url,
        stock,
        available,
        published
      `
    )
    .eq(
      "slug",
      phone.slug
    )
    .maybeSingle();

  if (error) {
    throw new Error(
      `Could not find ${phone.slug}: ${error.message}`
    );
  }

  if (!data) {
    throw new Error(
      `Product "${phone.slug}" does not exist in the products table.`
    );
  }

  return data;
}

/* =========================================================
   GET EXISTING VARIANTS
========================================================= */

async function getExistingVariants(
  productId: string
): Promise<
  ExistingVariant[]
> {
  const {
    data,
    error,
  } = await supabase
    .from(
      "product_variants"
    )
    .select(
      `
        id,
        storage,
        color,
        stock,
        available,
        purchase_price,
        promotional_price,
        refurbished_purchase_price,
        refurbished_sale_price,
        refurbished_promotional_price
      `
    )
    .eq(
      "product_id",
      productId
    );

  if (error) {
    throw new Error(
      `Could not load existing variants: ${error.message}`
    );
  }

  return (
    data ??
    []
  ) as ExistingVariant[];
}

/* =========================================================
   UPLOAD COLOR IMAGE
========================================================= */

async function uploadColorImage(
  productId: string,
  phone: MigrationPhone,
  color: MigrationColor
) {
  const absolutePath =
    assertLocalImageExists(
      color.imagePath
    );

  const extension =
    path.extname(
      absolutePath
    );

  const fileName =
    `${slugify(
      color.name
    )}${extension.toLowerCase()}`;

  /*
   * Stable path.
   *
   * Running the migration again overwrites the same
   * Supabase Storage file instead of creating duplicates.
   */
  const storagePath =
    `${productId}/variants/catalogue/${fileName}`;

  const fileBuffer =
    fs.readFileSync(
      absolutePath
    );

  const {
    error: uploadError,
  } = await supabase.storage
    .from(
      PRODUCT_IMAGES_BUCKET
    )
    .upload(
      storagePath,
      fileBuffer,
      {
        contentType:
          contentTypeFromExtension(
            extension
          ),

        cacheControl:
          "3600",

        upsert:
          true,
      }
    );

  if (uploadError) {
    throw new Error(
      `Could not upload ${phone.name} / ${color.name}: ${uploadError.message}`
    );
  }

  const {
    data:
      publicUrlData,
  } = supabase.storage
    .from(
      PRODUCT_IMAGES_BUCKET
    )
    .getPublicUrl(
      storagePath
    );

  const publicUrl =
    publicUrlData.publicUrl;

  if (!publicUrl) {
    throw new Error(
      `Could not generate public URL for ${phone.name} / ${color.name}.`
    );
  }

  return publicUrl;
}

/* =========================================================
   PRODUCT METADATA
========================================================= */

async function updateProductMetadata(
  productId: string,
  phone: MigrationPhone,
  defaultImageUrl: string | null
) {
  const lowestStorage =
    phone.storage[
      0
    ];

  const basePrice =
    phone.price +
    (
      lowestStorage
        ?.priceIncrease ??
      0
    );

  const payload: Record<
    string,
    unknown
  > = {
    name:
      phone.name,

    condition:
      phone.condition,

    description:
      phone.tagline,

    /*
     * Product price remains a compatibility fallback.
     *
     * Variant sale_price is authoritative.
     */
    sale_price:
      basePrice,

    lease_monthly_price:
      phone.leaseFrom,

    lease_enabled:
      phone.leaseFrom >
      0,
  };

  if (
    UPDATE_DEFAULT_PRODUCT_IMAGE &&
    defaultImageUrl
  ) {
    payload.image_url =
      defaultImageUrl;
  }

  const {
    error,
  } = await supabase
    .from(
      "products"
    )
    .update(
      payload
    )
    .eq(
      "id",
      productId
    );

  if (error) {
    throw new Error(
      `Could not update product metadata for ${phone.name}: ${error.message}`
    );
  }
}

/* =========================================================
   SPECIFICATIONS
========================================================= */

async function migrateSpecifications(
  productId: string,
  phone: MigrationPhone
) {
  if (
    !MIGRATE_SPECIFICATIONS
  ) {
    return;
  }

  const specifications = [
    {
      name: "Display",
      value:
        phone.specs.screen,
      sort_order: 0,
    },
    {
      name: "Processor",
      value:
        phone.specs.chip,
      sort_order: 1,
    },
    {
      name: "Camera",
      value:
        phone.specs.camera,
      sort_order: 2,
    },
    {
      name: "Battery",
      value:
        phone.specs.battery,
      sort_order: 3,
    },
    {
      name: "RAM",
      value:
        phone.specs.ram,
      sort_order: 4,
    },
    {
      name:
        "Operating system",
      value:
        phone.specs.os,
      sort_order: 5,
    },
  ];

  /*
   * For these migrated phones, phones.ts is currently
   * our catalogue source of truth for these six specs.
   *
   * Removing old rows prevents duplicate Display,
   * Processor, Camera, etc. entries.
   */
  const migratedSpecNames =
    specifications.map(
      (
        specification
      ) =>
        specification.name
    );

  const {
    error:
      deleteError,
  } = await supabase
    .from(
      "product_specifications"
    )
    .delete()
    .eq(
      "product_id",
      productId
    )
    .in(
      "name",
      migratedSpecNames
    );

  if (deleteError) {
    throw new Error(
      `Could not clean specifications for ${phone.name}: ${deleteError.message}`
    );
  }

  const rows =
    specifications.map(
      (
        specification
      ) => ({
        product_id:
          productId,

        ...specification,
      })
    );

  const {
    error:
      insertError,
  } = await supabase
    .from(
      "product_specifications"
    )
    .insert(
      rows
    );

  if (insertError) {
    throw new Error(
      `Could not migrate specifications for ${phone.name}: ${insertError.message}`
    );
  }
}

/* =========================================================
   REMOVE STALE VARIANTS
========================================================= */

async function deleteStaleVariants(
  productId: string,
  existingVariants:
    ExistingVariant[],
  expectedKeys:
    Set<string>
) {
  if (
    !DELETE_STALE_VARIANTS
  ) {
    return;
  }

  const staleIds =
    existingVariants
      .filter(
        (
          variant
        ) =>
          !expectedKeys.has(
            normalizeKey(
              variant.storage,
              variant.color
            )
          )
      )
      .map(
        (
          variant
        ) =>
          variant.id
      );

  if (
    staleIds.length ===
    0
  ) {
    return;
  }

  const {
    error,
  } = await supabase
    .from(
      "product_variants"
    )
    .delete()
    .eq(
      "product_id",
      productId
    )
    .in(
      "id",
      staleIds
    );

  if (error) {
    throw new Error(
      `Could not delete stale variants: ${error.message}`
    );
  }

  console.log(
    `  Removed ${staleIds.length} stale variant(s).`
  );
}

/* =========================================================
   SYNC PRODUCT STOCK
========================================================= */

async function syncProductStock(
  productId: string
) {
  const {
    data,
    error,
  } = await supabase
    .from(
      "product_variants"
    )
    .select(
      "stock, available"
    )
    .eq(
      "product_id",
      productId
    );

  if (error) {
    throw new Error(
      `Could not calculate product stock: ${error.message}`
    );
  }

  const variants =
    data ??
    [];

  const totalStock =
    variants.reduce(
      (
        total,
        variant
      ) =>
        total +
        Math.max(
          0,
          Number(
            variant.stock ??
            0
          )
        ),
      0
    );

  const hasAvailableVariant =
    variants.some(
      (
        variant
      ) =>
        Boolean(
          variant.available
        ) &&
        Number(
          variant.stock ??
          0
        ) >
          0
    );

  const {
    error:
      updateError,
  } = await supabase
    .from(
      "products"
    )
    .update({
      stock:
        totalStock,

      available:
        hasAvailableVariant,
    })
    .eq(
      "id",
      productId
    );

  if (updateError) {
    throw new Error(
      `Could not sync product stock: ${updateError.message}`
    );
  }
}

/* =========================================================
   MIGRATE ONE PHONE
========================================================= */

async function migratePhone(
  phone: MigrationPhone
) {
  console.log("");
  console.log(
    "--------------------------------------------------"
  );

  console.log(
    `Migrating: ${phone.name}`
  );

  console.log(
    `Slug: ${phone.slug}`
  );

  const product =
    await getProduct(
      phone
    );

  console.log(
    `Product ID: ${product.id}`
  );

  const existingVariants =
    await getExistingVariants(
      product.id
    );

  const existingMap =
    new Map<
      string,
      ExistingVariant
    >();

  for (
    const variant of
    existingVariants
  ) {
    existingMap.set(
      normalizeKey(
        variant.storage,
        variant.color
      ),
      variant
    );
  }

  /* =======================================================
     UPLOAD IMAGES
  ======================================================= */

  const imageUrls =
    new Map<
      string,
      string
    >();

  console.log(
    `Uploading ${phone.colors.length} colour image(s)...`
  );

  for (
    const color of
    phone.colors
  ) {
    const url =
      await uploadColorImage(
        product.id,
        phone,
        color
      );

    imageUrls.set(
      color.name,
      url
    );

    console.log(
      `  ✓ ${color.name}`
    );
  }

  /* =======================================================
     CREATE VARIANT MATRIX
  ======================================================= */

  const expectedVariantCount =
    phone.colors.length *
    phone.storage.length;

  const expectedKeys =
    new Set<string>();

  const variants =
    phone.colors.flatMap(
      (
        color
      ) =>
        phone.storage.map(
          (
            storage
          ) => {
            const key =
              normalizeKey(
                storage.label,
                color.name
              );

            expectedKeys.add(
              key
            );

            const existing =
              existingMap.get(
                key
              );

            const salePrice =
              phone.price +
              storage.priceIncrease;

            return {
              product_id:
                product.id,

              storage:
                storage.label,

              color:
                color.name,

              color_hex:
                color.hex,

              sku:
                `${phone.slug}-${storage.label}-${slugify(
                  color.name
                )}`
                  .toUpperCase()
                  .replace(
                    /[^A-Z0-9-]/g,
                    "-"
                  ),

              /*
               * Keep any purchase price that has already
               * been entered manually in the dashboard.
               */
              purchase_price:
                existing
                  ?.purchase_price ??
                null,

              /*
               * Authoritative storefront selling price.
               */
              sale_price:
                salePrice,

              /*
               * Preserve manually-configured promotion.
               */
              promotional_price:
                existing
                  ?.promotional_price ??
                null,

              /*
               * Preserve any additional refurbished pricing
               * already configured through the dashboard.
               */
              refurbished_purchase_price:
                existing
                  ?.refurbished_purchase_price ??
                null,

              refurbished_sale_price:
                existing
                  ?.refurbished_sale_price ??
                null,

              refurbished_promotional_price:
                existing
                  ?.refurbished_promotional_price ??
                null,

              /*
               * Legacy compatibility for old storefront code.
               */
              price_adjustment:
                storage.priceIncrease,

              /*
               * NEVER destroy existing inventory while
               * migrating catalogue information.
               */
              stock:
                Math.max(
                  0,
                  Number(
                    existing
                      ?.stock ??
                    0
                  )
                ),

              available:
                existing
                  ? Boolean(
                      existing.available
                    )
                  : false,

              /*
               * Same colour image URL is intentionally reused
               * across all storage capacities.
               */
              image_url:
                imageUrls.get(
                  color.name
                ) ??
                null,
            };
          }
        )
    );

  if (
    variants.length !==
    expectedVariantCount
  ) {
    throw new Error(
      `${phone.name}: expected ${expectedVariantCount} variants but generated ${variants.length}.`
    );
  }

  console.log(
    `Generated ${variants.length} storage × colour variants.`
  );

  /* =======================================================
     UPSERT VARIANTS
  ======================================================= */

  const {
    data:
      savedVariants,
    error:
      upsertError,
  } = await supabase
    .from(
      "product_variants"
    )
    .upsert(
      variants,
      {
        onConflict:
          "product_id,storage,color",

        ignoreDuplicates:
          false,
      }
    )
    .select(
      `
        id,
        product_id,
        storage,
        color,
        color_hex,
        sku,
        purchase_price,
        sale_price,
        promotional_price,
        refurbished_purchase_price,
        refurbished_sale_price,
        refurbished_promotional_price,
        price_adjustment,
        stock,
        available,
        image_url
      `
    );

  if (upsertError) {
    throw new Error(
      `${phone.name} variant migration failed: ${upsertError.message}`
    );
  }

  console.log(
    `✓ ${savedVariants?.length ?? 0} variants upserted`
  );

  /* =======================================================
     REMOVE STALE VARIANTS
  ======================================================= */

  await deleteStaleVariants(
    product.id,
    existingVariants,
    expectedKeys
  );

  /* =======================================================
     UPDATE PRODUCT DEFAULT IMAGE / METADATA
  ======================================================= */

  const firstColor =
    phone.colors[
      0
    ];

  const defaultImageUrl =
    firstColor
      ? imageUrls.get(
          firstColor.name
        ) ??
        null
      : null;

  await updateProductMetadata(
    product.id,
    phone,
    defaultImageUrl
  );

  /* =======================================================
     SPECIFICATIONS
  ======================================================= */

  await migrateSpecifications(
    product.id,
    phone
  );

  /* =======================================================
     STOCK
  ======================================================= */

  await syncProductStock(
    product.id
  );

  /* =======================================================
     VERIFY
  ======================================================= */

  const {
    data:
      verification,
    error:
      verificationError,
  } = await supabase
    .from(
      "product_variants"
    )
    .select(
      `
        id,
        storage,
        color,
        color_hex,
        sale_price,
        image_url
      `
    )
    .eq(
      "product_id",
      product.id
    );

  if (
    verificationError
  ) {
    throw new Error(
      `${phone.name} verification failed: ${verificationError.message}`
    );
  }

  const catalogueVariants =
    (
      verification ??
      []
    ).filter(
      (
        variant
      ) =>
        expectedKeys.has(
          normalizeKey(
            variant.storage,
            variant.color
          )
        )
    );

  const variantsWithoutImage =
    catalogueVariants.filter(
      (
        variant
      ) =>
        !variant.image_url
    );

  const variantsWithoutPrice =
    catalogueVariants.filter(
      (
        variant
      ) =>
        !variant.sale_price ||
        Number(
          variant.sale_price
        ) <=
          0
    );

  console.log(
    `Verification: ${catalogueVariants.length}/${expectedVariantCount} expected variants`
  );

  console.log(
    `Missing images: ${variantsWithoutImage.length}`
  );

  console.log(
    `Missing selling prices: ${variantsWithoutPrice.length}`
  );

  if (
    catalogueVariants.length !==
    expectedVariantCount
  ) {
    throw new Error(
      `${phone.name}: expected ${expectedVariantCount} catalogue variants in Supabase but found ${catalogueVariants.length}.`
    );
  }

  if (
    variantsWithoutImage.length >
    0
  ) {
    throw new Error(
      `${phone.name}: ${variantsWithoutImage.length} variants do not have image_url.`
    );
  }

  if (
    variantsWithoutPrice.length >
    0
  ) {
    throw new Error(
      `${phone.name}: ${variantsWithoutPrice.length} variants do not have sale_price.`
    );
  }

  console.log(
    `✓ ${phone.name} migration verified`
  );

  return {
    product:
      phone.name,

    variants:
      expectedVariantCount,

    colors:
      phone.colors.length,

    images:
      phone.colors.length,
  };
}

/* =========================================================
   MIGRATE ALL PHONES
========================================================= */

async function migrate() {
  console.log("");
  console.log(
    "==============================================="
  );

  console.log(
    "Lumina Phones — Full Catalogue Migration"
  );

  console.log(
    "==============================================="
  );

  console.log("");
  console.log(
    `Phones in migration catalogue: ${phones.length}`
  );

  /*
   * Fail BEFORE changing Supabase if any path in the
   * catalogue is incorrect.
   */
  validateAllImages();

  const results: {
    product: string;
    variants: number;
    colors: number;
    images: number;
  }[] = [];

  const failures: {
    product: string;
    error: string;
  }[] = [];

  for (
    let index = 0;
    index <
    phones.length;
    index +=
      1
  ) {
    const phone =
      phones[
        index
      ];

    console.log("");
    console.log(
      `[${index + 1}/${phones.length}]`
    );

    try {
      const result =
        await migratePhone(
          phone
        );

      results.push(
        result
      );
    } catch (
      error: any
    ) {
      const message =
        error?.message ??
        String(
          error
        );

      failures.push({
        product:
          phone.name,

        error:
          message,
      });

      console.error(
        `✗ ${phone.name}: ${message}`
      );
    }
  }

  /* =======================================================
     FINAL SUMMARY
  ======================================================= */

  const totalVariants =
    results.reduce(
      (
        total,
        result
      ) =>
        total +
        result.variants,
      0
    );

  const totalImages =
    results.reduce(
      (
        total,
        result
      ) =>
        total +
        result.images,
      0
    );

  console.log("");
  console.log(
    "==============================================="
  );

  console.log(
    "Migration summary"
  );

  console.log(
    "==============================================="
  );

  console.log(
    `Successful products: ${results.length}/${phones.length}`
  );

  console.log(
    `Catalogue variants migrated: ${totalVariants}`
  );

  console.log(
    `Colour images uploaded: ${totalImages}`
  );

  console.log(
    `Failed products: ${failures.length}`
  );

  if (
    failures.length >
    0
  ) {
    console.log("");
    console.log(
      "Failures:"
    );

    for (
      const failure of
      failures
    ) {
      console.log(
        `- ${failure.product}: ${failure.error}`
      );
    }

    throw new Error(
      `${failures.length} product migration(s) failed. See errors above.`
    );
  }

  console.log("");
  console.log(
    "✓ Every catalogue product migrated successfully."
  );

  console.log(
    "✓ Every storage × colour combination now exists in product_variants."
  );

  console.log(
    "✓ Every migrated variant has an image_url."
  );

  console.log(
    "✓ Every migrated variant has a sale_price."
  );

  console.log(
    "✓ Product default images were synced."
  );

  console.log(
    "✓ Product specifications were synced."
  );
}

/* =========================================================
   RUN
========================================================= */

migrate()
  .then(
    () => {
      console.log("");
      console.log(
        "Done."
      );

      process.exit(
        0
      );
    }
  )
  .catch(
    (
      error
    ) => {
      console.error("");
      console.error(
        "Migration failed:"
      );

      console.error(
        error
      );

      process.exit(
        1
      );
    }
  );