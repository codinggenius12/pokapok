import type {
  PaymentMode,
  Phone,
} from "./phone";

export type RefurbishedGrade =
  | "correct"
  | "good"
  | "excellent"
  | "premium";

export type BatteryGrade =
  | "optimal"
  | "new";

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

  /* =======================================================
     REFURBISHED CONFIGURATION

     These values describe the exact refurbished options
     selected by the customer.

     They are null for non-refurbished products.
  ======================================================= */

  refurbishedGrade:
    | RefurbishedGrade
    | null;

  batteryGrade:
    | BatteryGrade
    | null;
};