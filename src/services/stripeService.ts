import { supabase } from "../lib/supabase";

export type StripeCheckoutItem = {
  productId: string;

  variantId?: string | null;

  condition:
    | "new"
    | "refurbished";

  quantity: number;

  refurbishedGrade?:
    | "correct"
    | "good"
    | "excellent"
    | "premium"
    | null;

  batteryGrade?:
    | "optimal"
    | "new"
    | null;
};

export type StripeCheckoutPayload = {
  items: StripeCheckoutItem[];

  customerName: string;

  customerEmail?:
    | string
    | null;

  customerWhatsapp: string;

  country: string;

  stateRegion: string;

  city?:
    | string
    | null;

  street?:
    | string
    | null;

  houseNumber?:
    | string
    | null;

  addressLine2?:
    | string
    | null;

  postalCode?:
    | string
    | null;

  notes?:
    | string
    | null;

  language:
    | "pt"
    | "en";

  displayCurrency:
    | "CVE"
    | "EUR";
};

export type StripeCheckoutResponseItem = {
  product_id: string;

  variant_id:
    | string
    | null;

  product_name: string;

  condition:
    | "new"
    | "refurbished";

  refurbished_grade:
    | "correct"
    | "good"
    | "excellent"
    | "premium"
    | null;

  battery_grade:
    | "optimal"
    | "new"
    | null;

  quantity: number;

  base_unit_price: number;

  battery_upgrade_amount: number;

  unit_price: number;

  line_subtotal: number;
};

export type StripeCheckoutResponse = {
  success: boolean;

  order_id?: string;

  order_number?: string;

  stripe_checkout_session_id?: string;

  stripe_payment_intent_id?:
    | string
    | null;

  stripe_payment_status?: string;

  checkout_url?: string;

  error?: string;

  message?: string;

  pricing?: {
    currency: string;

    item_subtotal: number;

    shipping_amount: number;

    total_amount: number;

    display_currency: string;

    display_subtotal: number;

    display_shipping_amount: number;

    display_total_amount: number;

    exchange_rate: number;

    items?: StripeCheckoutResponseItem[];
  };
};

export async function createStripeCheckout(
  payload: StripeCheckoutPayload
): Promise<StripeCheckoutResponse> {
  if (
    !Array.isArray(
      payload.items
    ) ||
    payload.items.length === 0
  ) {
    throw new Error(
      "STRIPE_ITEMS_REQUIRED"
    );
  }

  const {
    data,
    error,
  } =
    await supabase.functions.invoke(
      "create-stripe-checkout",
      {
        body:
          payload,
      }
    );

  if (error) {
    console.error(
      "Stripe checkout function error:",
      error
    );

    throw new Error(
      error.message ||
        "Could not start Stripe checkout."
    );
  }

  const response =
    data as
      StripeCheckoutResponse;

  if (
    !response?.success
  ) {
    throw new Error(
      response?.message ||
        response?.error ||
        "Could not start Stripe checkout."
    );
  }

  if (
    !response.checkout_url
  ) {
    throw new Error(
      "Stripe checkout URL was not returned."
    );
  }

  return response;
}

export function redirectToStripeCheckout(
  checkoutUrl: string
) {
  if (
    typeof window ===
    "undefined"
  ) {
    throw new Error(
      "Stripe Checkout is only available in the browser."
    );
  }

  window.location.assign(
    checkoutUrl
  );
}