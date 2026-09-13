import type { PaymentMode, Phone } from "./phone";

export type CartItem = {
  id: string;
  phone: Phone;
  colorName: string;
  storageLabel: string;
  paymentMode: PaymentMode;
  months: number;
  insurance: boolean;
  unitPrice: number;
  monthlyPrice: number;
  quantity: number;
};