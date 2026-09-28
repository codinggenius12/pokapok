import type {
  PaymentMode,
  Phone,
} from "./phone";

export type CartItem = {
  id: string;

  /* =======================================================
     SUPABASE SOURCE IDS

     These are the authoritative database IDs used by
     checkout and the create-order Edge Function.
  ======================================================= */

  productId: string;

  variantId:
    | string
    | null;

  /* =======================================================
     DISPLAY / CART DATA
  ======================================================= */

  phone: Phone;

  colorName: string;

  storageLabel: string;

  paymentMode:
    PaymentMode;

  months: number;

  insurance: boolean;

  unitPrice: number;

  monthlyPrice: number;

  quantity: number;
};