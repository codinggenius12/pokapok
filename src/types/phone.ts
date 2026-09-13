import type { ImageSourcePropType } from "react-native";

export type PhoneBrand = "apple" | "samsung" | "xiaomi" | "nothing";

export type PhoneCondition = "new" | "refurbished";

export type PaymentMode = "buy" | "installments" | "lease";

export type PhoneColor = {
  name: string;
  hex: string;
  image?: ImageSourcePropType;
};

export type PhoneStorage = {
  label: string;
  priceIncrease: number;
};

export type PhoneSpecs = {
  screen: string;
  chip: string;
  camera: string;
  battery: string;
  ram: string;
  os: string;
};

export type Phone = {
  id: string;
  slug: string;
  name: string;
  brand: PhoneBrand;
  condition: PhoneCondition;
  featured: number;
  price: number;
  leaseFrom: number;
  tagline: string;
  colors: PhoneColor[];
  storage: PhoneStorage[];
  specs: PhoneSpecs;
};