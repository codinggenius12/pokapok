import type { Phone } from "../types/phone";

export const phones: Phone[] = [
  {
    id: "iphone-16-pro-max",
    slug: "iphone-16-pro-max",
    name: "iPhone 16 Pro Max",
    brand: "apple",
    condition: "new",
    featured: 100,
    price: 1299,
    leaseFrom: 49.99,
    tagline:
      "Apple’s most advanced iPhone with a premium titanium design, powerful camera system and excellent battery life.",
    colors: [
      {
        name: "Desert Titanium",
        hex: "#C7B29A",
        image: require("../../assets/images/phones/apple/iPhone_16_Pro_Max_gold.png"),
      },
      {
        name: "Black Titanium",
        hex: "#2C2C2E",
        image: require("../../assets/images/phones/apple/Iphone16promax_black.png"),
      },
      {
        name: "Natural Titanium",
        hex: "#B8B2A8",
        image: require("../../assets/images/phones/apple/Iphone16promax_titanium_natural.png"),
      },
      {
        name: "White Titanium",
        hex: "#F1F1ED",
        image: require("../../assets/images/phones/apple/Iphone16promax_white.png"),
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
      camera: "48MP Fusion camera system",
      battery: "Up to 33 hours video playback",
      ram: "8GB",
      os: "iOS 18",
    },
  },

  {
    id: "iphone-16-pro",
    slug: "iphone-16-pro",
    name: "iPhone 16 Pro",
    brand: "apple",
    condition: "new",
    featured: 98,
    price: 929,
    leaseFrom: 44.99,
    tagline:
      "A compact Pro iPhone with A18 Pro, titanium design, powerful cameras and premium performance.",
    colors: [
      {
        name: "Natural Titanium",
        hex: "#B8B2A8",
        image: require("../../assets/images/phones/apple/iphone16pro.png"),
      },
      {
        name: "Desert Titanium",
        hex: "#C7B29A",
        image: require("../../assets/images/phones/apple/iphone16pro_desert_titanium.png"),
      },
      {
        name: "Black Titanium",
        hex: "#2C2C2E",
        image: require("../../assets/images/phones/apple/iphone-16-pro-black-titanium.png"),
      },
      {
        name: "White Titanium",
        hex: "#F1F1ED",
        image: require("../../assets/images/phones/apple/iphone-16-pro-white-titanium.png"),
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
      camera: "48MP Pro camera system",
      battery: "Up to 27 hours video playback",
      ram: "8GB",
      os: "iOS 18",
    },
  },

  {
    id: "iphone-16",
    slug: "iphone-16",
    name: "iPhone 16",
    brand: "apple",
    condition: "new",
    featured: 92,
    price: 879,
    leaseFrom: 36.99,
    tagline:
      "A modern iPhone with A18 chip, Camera Control, strong battery life and a bright OLED display.",
    colors: [
      {
        name: "Black",
        hex: "#1F2329",
        image: require("../../assets/images/phones/apple/iphone16_black.png"),
      },
      {
        name: "Green",
        hex: "#4CA6A8",
        image: require("../../assets/images/phones/apple/iphone16_green.png"),
      },
      {
        name: "Ultramarine",
        hex: "#5468D4",
        image: require("../../assets/images/phones/apple/iphone16_blue.png"),
      },
      {
        name: "White",
        hex: "#F4F1EA",
        image: require("../../assets/images/phones/apple/iphone16_white.png"),
      },
      {
        name: "Pink",
        hex: "#F5B8C8",
        image: require("../../assets/images/phones/apple/iphone16_pink.png"),
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
      camera: "48MP dual camera system",
      battery: "Up to 22 hours video playback",
      ram: "8GB",
      os: "iOS 18",
    },
  },

  {
    id: "iphone-15-pro-max",
    slug: "iphone-15-pro-max",
    name: "iPhone 15 Pro Max",
    brand: "apple",
    condition: "refurbished",
    featured: 91,
    price: 719,
    leaseFrom: 39.99,
    tagline:
      "A large titanium Pro iPhone with A17 Pro, USB-C, excellent battery life and a professional camera system.",
    colors: [
      {
        name: "Natural Titanium",
        hex: "#B8B2A8",
        image: require("../../assets/images/phones/apple/iphone-15-pro-max-256-gb-titanio-natural.png"),
      },
      {
        name: "Black Titanium",
        hex: "#2C2C2E",
        image: require("../../assets/images/phones/apple/iphone-15-pro-max-black-titanium.png"),
      },
      {
        name: "White Titanium",
        hex: "#F1F1ED",
        image: require("../../assets/images/phones/apple/iphone-15-pro-max-white-titanium-.png"),
      },
      {
        name: "Blue Titanium",
        hex: "#59677D",
        image: require("../../assets/images/phones/apple/iphone-15-pro-max-blue-titanium-256-gb.jpg.png"),
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
      camera: "48MP Pro camera system",
      battery: "Up to 29 hours video playback",
      ram: "8GB",
      os: "iOS 18",
    },
  },

  {
    id: "iphone-15-pro",
    slug: "iphone-15-pro",
    name: "iPhone 15 Pro",
    brand: "apple",
    condition: "refurbished",
    featured: 90,
    price: 639,
    leaseFrom: 34.99,
    tagline:
      "A premium iPhone with a lightweight titanium design, A17 Pro chip, USB-C, strong battery life and a professional camera system.",
    colors: [
      {
        name: "Black Titanium",
        hex: "#2C2C2E",
        image: require("../../assets/images/phones/apple/Iphone15pro_TitaniumBlack.png"),
      },
      {
        name: "White Titanium",
        hex: "#F1F1ED",
        image: require("../../assets/images/phones/apple/iPhone15pro_TitaniumBlanco.png"),
      },
      {
        name: "Blue Titanium",
        hex: "#59677D",
        image: require("../../assets/images/phones/apple/Iphone15pro_TitaniumBlue.png"),
      },
      {
        name: "Natural Titanium",
        hex: "#B8B2A8",
        image: require("../../assets/images/phones/apple/Iphone15pro_TitaniumNatural.png"),
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
      camera: "48MP Pro camera system",
      battery: "Up to 23 hours video playback",
      ram: "8GB",
      os: "iOS 18",
    },
  },

  {
    id: "iphone-15",
    slug: "iphone-15",
    name: "iPhone 15",
    brand: "apple",
    condition: "new",
    featured: 88,
    price: 659,
    leaseFrom: 31.99,
    tagline:
      "A modern iPhone with Dynamic Island, USB-C, a bright OLED display, strong battery life and a powerful 48MP camera system.",
    colors: [
      {
        name: "Black",
        hex: "#1F2329",
        image: require("../../assets/images/phones/apple/Apple_iPhone_15_black.png"),
      },
      {
        name: "Blue",
        hex: "#B9D7E8",
        image: require("../../assets/images/phones/apple/Apple_iPhone_15_blue.png"),
      },
      {
        name: "Yellow",
        hex: "#F4E7A1",
        image: require("../../assets/images/phones/apple/Apple_iPhone_15_yellow.png"),
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
      camera: "48MP dual camera system",
      battery: "Up to 20 hours video playback",
      ram: "6GB",
      os: "iOS 18",
    },
  },

  {
    id: "iphone-14-pro-max",
    slug: "iphone-14-pro-max",
    name: "iPhone 14 Pro Max",
    brand: "apple",
    condition: "refurbished",
    featured: 86,
    price: 619,
    leaseFrom: 32.99,
    tagline:
      "A large Pro iPhone with Dynamic Island, ProMotion display, excellent battery life and a powerful 48MP camera system.",
    colors: [
      {
        name: "Space Black",
        hex: "#252527",
        image: require("../../assets/images/phones/apple/iphone-14-pro-max-space-black-128-gb.jpg.png"),
      },
      {
        name: "Silver",
        hex: "#F1F1ED",
        image: require("../../assets/images/phones/apple/iphone-14-pro-max-silver.png"),
      },
      {
        name: "Gold",
        hex: "#F3D6A4",
        image: require("../../assets/images/phones/apple/iphone-14-pro-max-gold-128-gb.jpg.png"),
      },
      {
        name: "Deep Purple",
        hex: "#594F63",
        image: require("../../assets/images/phones/apple/iphone14promax_deep_purple.png"),
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
      camera: "48MP Pro camera system",
      battery: "Up to 29 hours video playback",
      ram: "6GB",
      os: "iOS 18",
    },
  },

  {
    id: "iphone-14-pro",
    slug: "iphone-14-pro",
    name: "iPhone 14 Pro",
    brand: "apple",
    condition: "refurbished",
    featured: 84,
    price: 519,
    leaseFrom: 29.99,
    tagline:
      "A premium Pro iPhone with Dynamic Island, 120Hz display, A16 Bionic chip and a professional camera system.",
    colors: [
      {
        name: "Gold",
        hex: "#F3D6A4",
        image: require("../../assets/images/phones/apple/iphone-14-pro-gold.png"),
      },
      {
        name: "Space Black",
        hex: "#252527",
        image: require("../../assets/images/phones/apple/iphone-14-pro-space-black-128-gb.jpg.png"),
      },
      {
        name: "Silver",
        hex: "#F1F1ED",
        image: require("../../assets/images/phones/apple/iphone-14-pro-silver-128-gb.jpg.png"),
      },
      {
        name: "Deep Purple",
        hex: "#594F63",
        image: require("../../assets/images/phones/apple/iphone-14-pro-deep-purple.png"),
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
      camera: "48MP Pro camera system",
      battery: "Up to 23 hours video playback",
      ram: "6GB",
      os: "iOS 18",
    },
  },

  {
    id: "iphone-14",
    slug: "iphone-14",
    name: "iPhone 14",
    brand: "apple",
    condition: "refurbished",
    featured: 73,
    price: 389,
    leaseFrom: 22.99,
    tagline:
      "A reliable iPhone with a bright OLED display, strong battery life and a smooth iOS experience.",
    colors: [
      {
        name: "Blue",
        hex: "#AFCBE3",
        image: require("../../assets/images/phones/apple/iphone14_blue.png"),
      },
      {
        name: "Midnight",
        hex: "#1F2329",
        image: require("../../assets/images/phones/apple/iphone14_black.jpg"),
      },
      {
        name: "Starlight",
        hex: "#F4F1EA",
        image: require("../../assets/images/phones/apple/iphone14_white.png"),
      },
      {
        name: "Yellow",
        hex: "#F4E36B",
        image: require("../../assets/images/phones/apple/iphone14_yellow.png"),
      },
      {
        name: "Purple",
        hex: "#D8C5EA",
        image: require("../../assets/images/phones/apple/iphone14_purple.png"),
      },
      {
        name: "Red",
        hex: "#C91F2C",
        image: require("../../assets/images/phones/apple/iphone14_red.jpg"),
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
      camera: "12MP dual camera system",
      battery: "Up to 20 hours video playback",
      ram: "6GB",
      os: "iOS 18",
    },
  },

  {
    id: "iphone-13-pro-max",
    slug: "iphone-13-pro-max",
    name: "iPhone 13 Pro Max",
    brand: "apple",
    condition: "refurbished",
    featured: 72,
    price: 489,
    leaseFrom: 26.99,
    tagline:
      "A powerful Pro Max iPhone with a large OLED ProMotion display, excellent battery life, premium camera system and strong everyday performance.",
    colors: [
      {
        name: "Graphite",
        hex: "#3A3A3C",
        image: require("../../assets/images/phones/apple/iphone-13-pro-max-black.png"),
      },
      {
        name: "Gold",
        hex: "#F3D6A4",
        image: require("../../assets/images/phones/apple/iPhone-13-pro-max-gold.png"),
      },
      {
        name: "Sierra Blue",
        hex: "#A7B8C9",
        image: require("../../assets/images/phones/apple/iphone13promax_blue.png"),
      },
      {
        name: "Silver",
        hex: "#F1F1ED",
        image: require("../../assets/images/phones/apple/iphone13promax_white.png"),
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
      camera: "12MP Pro camera system",
      battery: "Up to 28 hours video playback",
      ram: "6GB",
      os: "iOS 18",
    },
  },

  {
    id: "iphone-13-pro",
    slug: "iphone-13-pro",
    name: "iPhone 13 Pro",
    brand: "apple",
    condition: "refurbished",
    featured: 69,
    price: 419,
    leaseFrom: 22.99,
    tagline:
      "A premium refurbished iPhone with ProMotion display, strong camera system and reliable performance.",
    colors: [
      {
        name: "Graphite",
        hex: "#3A3A3C",
        image: require("../../assets/images/phones/apple/iPhone-13-pro-graphite-128gb.jpg.png"),
      },
      {
        name: "Gold",
        hex: "#F3D6A4",
        image: require("../../assets/images/phones/apple/iPhone-13-pro-gold-256gb.jpg.png"),
      },
      {
        name: "Sierra Blue",
        hex: "#A7B8C9",
        image: require("../../assets/images/phones/apple/iPhone-13-pro-sierra-blue-128gb.jpg.png"),
      },
      {
        name: "Silver",
        hex: "#F1F1ED",
        image: require("../../assets/images/phones/apple/iPhone-13-pro-silver-128gb.jpg.png"),
      },
      {
        name: "Alpine Green",
        hex: "#576856",
        image: require("../../assets/images/phones/apple/iPhone-13-pro-alpine-green-128gb.jpg.png"),
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
      camera: "12MP Pro camera system",
      battery: "Up to 22 hours video playback",
      ram: "6GB",
      os: "iOS 18",
    },
  },

  {
    id: "iphone-13",
    slug: "iphone-13",
    name: "iPhone 13",
    brand: "apple",
    condition: "refurbished",
    featured: 68,
    price: 329,
    leaseFrom: 17.99,
    tagline:
      "A reliable iPhone with a sharp OLED display, strong battery life, dual-camera system and smooth iOS performance.",
    colors: [
      {
        name: "Blue",
        hex: "#5B7FA6",
        image: require("../../assets/images/phones/apple/iphone13_blue.png"),
      },
      {
        name: "Midnight",
        hex: "#1F2329",
        image: require("../../assets/images/phones/apple/iphone13_black.png"),
      },
      {
        name: "Starlight",
        hex: "#F4F1EA",
        image: require("../../assets/images/phones/apple/iphone13_white.png"),
      },
      {
        name: "Pink",
        hex: "#F5C8C6",
        image: require("../../assets/images/phones/apple/iphone13_pink.png"),
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
      camera: "12MP dual camera system",
      battery: "Up to 19 hours video playback",
      ram: "4GB",
      os: "iOS 18",
    },
  },

  {
    id: "galaxy-s25",
    slug: "galaxy-s25",
    name: "Samsung Galaxy S25",
    brand: "samsung",
    condition: "new",
    featured: 94,
    price: 679,
    leaseFrom: 34.99,
    tagline:
      "A modern Samsung flagship with Galaxy AI, premium performance, a bright AMOLED display and a refined camera system.",
    colors: [
      {
        name: "Black",
        hex: "#1F1F1F",
        image: require("../../assets/images/phones/samsung/samsung_galaxy_S25_black.png"),
      },
      {
        name: "Green",
        hex: "#C7E4D5",
        image: require("../../assets/images/phones/samsung/Samsung_Galaxy_S25_green.png"),
      },
      {
        name: "Grey",
        hex: "#C9C9C9",
        image: require("../../assets/images/phones/samsung/Samsung_Galaxy_S25_grey.png"),
      },
      {
        name: "Navy",
        hex: "#303849",
        image: require("../../assets/images/phones/samsung/Samsung_Galaxy_S25_navy.png"),
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
      chip: "Snapdragon 8 Elite",
      camera: "50MP triple camera system",
      battery: "4000mAh",
      ram: "12GB",
      os: "Android",
    },
  },

  {
    id: "galaxy-s24-ultra",
    slug: "galaxy-s24-ultra",
    name: "Galaxy S24 Ultra",
    brand: "samsung",
    condition: "new",
    featured: 95,
    price: 799,
    leaseFrom: 44.99,
    tagline:
      "A powerful Android flagship with a premium display, strong camera system and built-in Galaxy AI features.",
    colors: [
      {
        name: "Titanium Grey",
        hex: "#8F8D91",
        image: require("../../assets/images/phones/samsung/Samsung_GalaxyS24Ultra_TitaniumGrey-removebg-preview.png"),
      },
      {
        name: "Titanium Black",
        hex: "#2B2B2F",
        image: require("../../assets/images/phones/samsung/Samsung_Galaxy_S24Ultra_TitaniumBlack-removebg-preview.png"),
      },
      {
        name: "Titanium Purple",
        hex: "#8C7AA9",
        image: require("../../assets/images/phones/samsung/Samsung_GalaxyS24_TitaniumPurple-removebg-preview.png"),
      },
      {
        name: "Titanium Yellow",
        hex: "#D6C7A1",
        image: require("../../assets/images/phones/samsung/Samsung_GalaxyS24_Titaniumyellow-removebg-preview.png"),
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
      chip: "Snapdragon 8 Gen 3",
      camera: "200MP quad camera system",
      battery: "5000mAh",
      ram: "12GB",
      os: "Android",
    },
  },

  {
    id: "galaxy-s23",
    slug: "galaxy-s23",
    name: "Samsung Galaxy S23",
    brand: "samsung",
    condition: "refurbished",
    featured: 76,
    price: 319,
    leaseFrom: 22.99,
    tagline:
      "A compact premium Samsung phone with strong performance, a bright AMOLED display and a reliable triple camera system.",
    colors: [
      {
        name: "Phantom Black",
        hex: "#1F1F1F",
        image: require("../../assets/images/phones/samsung/Samsung_Galaxy_S23_black.jpg"),
      },
      {
        name: "Cream",
        hex: "#EFE8D8",
        image: require("../../assets/images/phones/samsung/Samsung_Galaxy_S23_gold.jpg"),
      },
      {
        name: "Green",
        hex: "#6F7C69",
        image: require("../../assets/images/phones/samsung/Samsung_Galaxy_S23_green.png"),
      },
      {
        name: "Lavender",
        hex: "#D8C8E8",
        image: require("../../assets/images/phones/samsung/Samsung_Galaxy_S23_purple.jpg"),
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
      chip: "Snapdragon 8 Gen 2",
      camera: "50MP triple camera system",
      battery: "3900mAh",
      ram: "8GB",
      os: "Android",
    },
  },

  {
    id: "galaxy-a36",
    slug: "galaxy-a36",
    name: "Samsung Galaxy A36",
    brand: "samsung",
    condition: "new",
    featured: 58,
    price: 279,
    leaseFrom: 15.99,
    tagline:
      "A practical Samsung phone with a smooth AMOLED display, strong everyday performance and affordable monthly options.",
    colors: [
      {
        name: "Awesome Black",
        hex: "#111111",
        image: require("../../assets/images/phones/samsung/Samsung-Galaxy-A36_black.jpg"),
      },
      {
        name: "Awesome White",
        hex: "#F4F4F4",
        image: require("../../assets/images/phones/samsung/Samsung_Galaxy_A36_white.jpg"),
      },
      {
        name: "Awesome Green",
        hex: "#C7E4D5",
        image: require("../../assets/images/phones/samsung/Samsung_Galaxy_A36_green-removebg-preview.png"),
      },
      {
        name: "Awesome Lavender",
        hex: "#D6C5EA",
        image: require("../../assets/images/phones/samsung/Samsung-Galaxy_A36_purple-removebg-preview.png"),
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
      camera: "50MP triple camera system",
      battery: "5000mAh",
      ram: "8GB",
      os: "Android",
    },
  },

  {
    id: "galaxy-a26",
    slug: "galaxy-a26",
    name: "Samsung Galaxy A26",
    brand: "samsung",
    condition: "new",
    featured: 52,
    price: 229,
    leaseFrom: 12.99,
    tagline:
      "An affordable Samsung smartphone with a large display, reliable battery life and useful everyday performance.",
    colors: [
      {
        name: "Black",
        hex: "#111111",
        image: require("../../assets/images/phones/samsung/Samsung-Galaxy_A26_black.jpg"),
      },
      {
        name: "Green",
        hex: "#C7E4D5",
        image: require("../../assets/images/phones/samsung/Samsung_Galaxy_A26_green.jpg"),
      },
      {
        name: "White",
        hex: "#F4F4F4",
        image: require("../../assets/images/phones/samsung/samsung-galaxy-a26-5g-67-dual-sim-6gb128gb-branco.jpg-removebg-preview.png"),
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
      camera: "50MP triple camera system",
      battery: "5000mAh",
      ram: "6GB",
      os: "Android",
    },
  },

  {
    id: "xiaomi-14-ultra",
    slug: "xiaomi-14-ultra",
    name: "Xiaomi 14 Ultra",
    brand: "xiaomi",
    condition: "new",
    featured: 85,
    price: 789,
    leaseFrom: 39.99,
    tagline:
      "A camera-focused Android flagship with Leica optics, a premium AMOLED display, fast performance and a high-end design.",
    colors: [
      {
        name: "Black",
        hex: "#111111",
        image: require("../../assets/images/phones/xiaomi/Xiaomi14Ultra_black.png"),
      },
      {
        name: "Silver",
        hex: "#D8D8D2",
        image: require("../../assets/images/phones/xiaomi/Xiaomi14Ultra_silver.png"),
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
      chip: "Snapdragon 8 Gen 3",
      camera: "Leica quad camera system",
      battery: "5000mAh",
      ram: "12GB",
      os: "Android",
    },
  },

  {
    id: "poco-x7-pro",
    slug: "poco-x7-pro",
    name: "Xiaomi POCO X7 Pro",
    brand: "xiaomi",
    condition: "new",
    featured: 64,
    price: 389,
    leaseFrom: 16.99,
    tagline:
      "A performance-focused Xiaomi phone with a smooth AMOLED display, large battery and strong value for the price.",
    colors: [
      {
        name: "Black",
        hex: "#111111",
        image: require("../../assets/images/phones/xiaomi/xiaomi_poco_x7_black.jpg"),
      },
      {
        name: "Green",
        hex: "#63796B",
        image: require("../../assets/images/phones/xiaomi/xiaomi-poco-x7-pro.png"),
      },
      {
        name: "Yellow",
        hex: "#E9C94A",
        image: require("../../assets/images/phones/xiaomi/xiaomi-poco-x7-pro-yellow.png"),
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
      chip: "Dimensity 8400 Ultra",
      camera: "50MP dual camera system",
      battery: "6000mAh",
      ram: "12GB",
      os: "Android",
    },
  },

  {
    id: "redmi-note-14-pro-plus",
    slug: "redmi-note-14-pro-plus",
    name: "Redmi Note 14 Pro+",
    brand: "xiaomi",
    condition: "new",
    featured: 60,
    price: 349,
    leaseFrom: 18.99,
    tagline:
      "A strong value smartphone with a premium curved display, powerful camera system, large battery and affordable monthly options.",
    colors: [
      {
        name: "Midnight Black",
        hex: "#111111",
        image: require("../../assets/images/phones/xiaomi/xiaomi-redmi-note-14-pro-midnight-black.png"),
      },
      {
        name: "Lavender Purple",
        hex: "#BFA7E8",
        image: require("../../assets/images/phones/xiaomi/redmi-note-14-pro-plus-purple.png"),
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
      chip: "Snapdragon 7s Gen 3",
      camera: "200MP main camera",
      battery: "5110mAh",
      ram: "8GB",
      os: "Android",
    },
  },

  {
    id: "nothing-phone-3a-pro",
    slug: "nothing-phone-3a-pro",
    name: "Nothing Phone (3a) Pro",
    brand: "nothing",
    condition: "new",
    featured: 82,
    price: 429,
    leaseFrom: 19.99,
    tagline:
      "A premium Nothing smartphone with a transparent design, Glyph lighting, smooth AMOLED display, strong battery life and an upgraded camera system.",
    colors: [
      {
        name: "Black",
        hex: "#222222",
        image: require("../../assets/images/phones/nothing/nothing3apro_black.png"),
      },
      {
        name: "Grey",
        hex: "#A8A8A8",
        image: require("../../assets/images/phones/nothing/nothingphone3apro_grey.png"),
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
      chip: "Snapdragon 7s Gen 3",
      camera: "50MP triple camera system",
      battery: "5000mAh",
      ram: "12GB",
      os: "Nothing OS",
    },
  },

  {
    id: "nothing-phone-3a",
    slug: "nothing-phone-3a",
    name: "Nothing Phone (3a)",
    brand: "nothing",
    condition: "new",
    featured: 78,
    price: 379,
    leaseFrom: 16.99,
    tagline:
      "A stylish mid-range smartphone with Nothing’s transparent design language, Glyph lighting, smooth AMOLED display and strong everyday performance.",
    colors: [
      {
        name: "White",
        hex: "#F5F5F5",
        image: require("../../assets/images/phones/nothing/nothingphone_3a_white.png"),
      },
      {
        name: "Black",
        hex: "#222222",
        image: require("../../assets/images/phones/nothing/nothingphone3a_black.png"),
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
      chip: "Snapdragon 7s Gen 3",
      camera: "50MP triple camera system",
      battery: "5000mAh",
      ram: "8GB",
      os: "Nothing OS",
    },
  },

  {
    id: "nothing-phone-2a-plus",
    slug: "nothing-phone-2a-plus",
    name: "Nothing Phone (2a) Plus",
    brand: "nothing",
    condition: "new",
    featured: 74,
    price: 379,
    leaseFrom: 18.49,
    tagline:
      "A stylish Nothing smartphone with a transparent design, Glyph lighting, smooth AMOLED display, strong battery life and upgraded everyday performance.",
    colors: [
      {
        name: "Black",
        hex: "#222222",
        image: require("../../assets/images/phones/nothing/nothing2aplus_black.jpeg"),
      },
      {
        name: "Silver",
        hex: "#D8D8D2",
        image: require("../../assets/images/phones/nothing/nothing2aplus_silver.jpeg"),
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
      chip: "MediaTek Dimensity 7350 Pro",
      camera: "50MP dual camera system",
      battery: "5000mAh",
      ram: "12GB",
      os: "Nothing OS",
    },
  },

  {
    id: "nothing-phone-2",
    slug: "nothing-phone-2",
    name: "Nothing Phone (2)",
    brand: "nothing",
    condition: "refurbished",
    featured: 70,
    price: 399,
    leaseFrom: 24.99,
    tagline:
      "A unique smartphone with a transparent design, Glyph interface, clean Nothing OS experience and smooth everyday performance.",
    colors: [
      {
        name: "Black",
        hex: "#222222",
        image: require("../../assets/images/phones/nothing/nothingphone2_black.png"),
      },
      {
        name: "White",
        hex: "#F5F5F5",
        image: require("../../assets/images/phones/nothing/nothingphone2_white-.png"),
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
      chip: "Snapdragon 8+ Gen 1",
      camera: "50MP dual camera",
      battery: "4700mAh",
      ram: "8GB",
      os: "Nothing OS",
    },
  },
];