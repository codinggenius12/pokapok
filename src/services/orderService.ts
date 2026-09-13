import { supabase } from "../lib/supabase";

/* =========================================================
   ORDER TYPES
========================================================= */

export type OrderCondition =
  | "new"
  | "refurbished";

export type OrderPaymentMethod =
  | "bank_transfer";

export type OrderPaymentStatus =
  | "awaiting_payment"
  | "paid"
  | "failed"
  | "refunded";

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "shipped"
  | "delivered"
  | "cancelled";

/* =========================================================
   CREATE ORDER INPUT
========================================================= */

/*
 * IMPORTANT:
 *
 * Prices are intentionally NOT included here.
 *
 * The browser must never decide:
 *
 * - base price
 * - promotional price
 * - refurbished price
 * - variant adjustment
 * - unit price
 * - total amount
 *
 * The create-order Edge Function calculates all
 * monetary values directly from Supabase.
 */

export type CreateOrderInput = {
  customerName: string;
  customerEmail: string;

  productId: string;

  variantId?:
    | string
    | null;

  condition: OrderCondition;

  quantity?: number;
};

/* =========================================================
   ORDER RECORD
========================================================= */

export type CreatedOrder = {
  id: string;

  order_number: string;
  payment_reference: string;

  customer_name: string;
  customer_email: string;

  product_name: string;

  storage:
    | string
    | null;

  color:
    | string
    | null;

  condition:
    | string
    | null;

  quantity: number;

  total_amount: number;

  payment_method:
    OrderPaymentMethod;

  payment_status:
    OrderPaymentStatus;

  order_status:
    OrderStatus;

  payment_received_at?:
    | string
    | null;

  created_at?: string;
  updated_at?: string;
};

/* =========================================================
   ORDER PRICING
========================================================= */

export type OrderPricing = {
  currency: string;

  base_price: number;

  variant_adjustment: number;

  unit_price: number;

  quantity: number;

  total_amount: number;
};

/* =========================================================
   CREATE ORDER RESULT
========================================================= */

export type CreateOrderResult = {
  success: true;

  email_sent: boolean;

  order: CreatedOrder;

  order_number: string;

  payment_reference: string;

  pricing: OrderPricing;

  warning?:
    | string
    | null;
};

/* =========================================================
   EDGE FUNCTION ERROR
========================================================= */

type CreateOrderErrorResponse = {
  success?: false;

  error?: string;
};

/* =========================================================
   EMAIL VALIDATION
========================================================= */

function isValidEmail(
  email: string
): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email
  );
}

/* =========================================================
   INPUT NORMALIZATION
========================================================= */

function normalizeCreateOrderInput(
  input: CreateOrderInput
) {
  const customerName =
    String(
      input.customerName ??
        ""
    ).trim();

  const customerEmail =
    String(
      input.customerEmail ??
        ""
    )
      .trim()
      .toLowerCase();

  const productId =
    String(
      input.productId ??
        ""
    ).trim();

  const variantId =
    input.variantId
      ? String(
          input.variantId
        ).trim()
      : null;

  const condition =
    input.condition;

  const quantity =
    input.quantity ??
    1;

  return {
    customerName,
    customerEmail,
    productId,
    variantId,
    condition,
    quantity,
  };
}

/* =========================================================
   CLIENT-SIDE INPUT VALIDATION
========================================================= */

/*
 * This validation is for user experience only.
 *
 * The Edge Function performs the real security
 * validation because browser code can always
 * be modified by the customer.
 */

function validateCreateOrderInput(
  input: ReturnType<
    typeof normalizeCreateOrderInput
  >
) {
  if (!input.customerName) {
    throw new Error(
      "Please enter your name."
    );
  }

  if (!input.customerEmail) {
    throw new Error(
      "Please enter your email address."
    );
  }

  if (
    !isValidEmail(
      input.customerEmail
    )
  ) {
    throw new Error(
      "Please enter a valid email address."
    );
  }

  if (!input.productId) {
    throw new Error(
      "No product was selected."
    );
  }

  if (
    input.condition !==
      "new" &&
    input.condition !==
      "refurbished"
  ) {
    throw new Error(
      "Invalid product condition."
    );
  }

  if (
    !Number.isInteger(
      input.quantity
    ) ||
    input.quantity < 1
  ) {
    throw new Error(
      "Quantity must be a positive whole number."
    );
  }
}

/* =========================================================
   NORMALIZE SERVER NUMBER
========================================================= */

function toNumber(
  value: unknown
): number {
  const number =
    Number(value);

  if (
    !Number.isFinite(
      number
    )
  ) {
    return 0;
  }

  return number;
}

/* =========================================================
   NORMALIZE CREATED ORDER
========================================================= */

function normalizeCreatedOrder(
  order: any
): CreatedOrder {
  return {
    ...order,

    quantity:
      toNumber(
        order.quantity
      ),

    total_amount:
      toNumber(
        order.total_amount
      ),
  };
}

/* =========================================================
   NORMALIZE PRICING
========================================================= */

function normalizeOrderPricing(
  pricing: any
): OrderPricing {
  return {
    currency:
      String(
        pricing?.currency ??
          "EUR"
      ),

    base_price:
      toNumber(
        pricing?.base_price
      ),

    variant_adjustment:
      toNumber(
        pricing?.variant_adjustment
      ),

    unit_price:
      toNumber(
        pricing?.unit_price
      ),

    quantity:
      toNumber(
        pricing?.quantity
      ),

    total_amount:
      toNumber(
        pricing?.total_amount
      ),
  };
}

/* =========================================================
   CREATE ORDER
========================================================= */

export async function createOrder(
  input: CreateOrderInput
): Promise<CreateOrderResult> {
  /*
   * ------------------------------------------------------
   * NORMALIZE
   * ------------------------------------------------------
   */

  const normalized =
    normalizeCreateOrderInput(
      input
    );

  /*
   * ------------------------------------------------------
   * VALIDATE
   * ------------------------------------------------------
   */

  validateCreateOrderInput(
    normalized
  );

  /*
   * ------------------------------------------------------
   * CREATE SECURE REQUEST
   * ------------------------------------------------------
   *
   * Notice what is NOT sent:
   *
   * - product_name
   * - storage
   * - color
   * - sale_price
   * - promotional_price
   * - refurbished_price
   * - price_adjustment
   * - unit_price
   * - total_amount
   *
   * Supabase determines all of these.
   */

  const requestBody = {
    customer_name:
      normalized.customerName,

    customer_email:
      normalized.customerEmail,

    product_id:
      normalized.productId,

    variant_id:
      normalized.variantId,

    condition:
      normalized.condition,

    quantity:
      normalized.quantity,
  };

  /*
   * ------------------------------------------------------
   * CALL CREATE-ORDER EDGE FUNCTION
   * ------------------------------------------------------
   */

  const {
    data,
    error,
  } =
    await supabase.functions.invoke(
      "create-order",
      {
        body:
          requestBody,
      }
    );

  /*
   * ------------------------------------------------------
   * NETWORK / FUNCTION ERROR
   * ------------------------------------------------------
   */

  if (error) {
    console.error(
      "Create order function error:",
      error
    );

    /*
     * Depending on the Supabase client version,
     * the useful server error can sometimes be
     * available through the function error context.
     */

    let serverMessage:
      | string
      | null =
      null;

    try {
      const context =
        (error as any)
          ?.context;

      if (
        context &&
        typeof context.json ===
          "function"
      ) {
        const errorBody =
          await context.json();

        if (
          typeof errorBody?.error ===
          "string"
        ) {
          serverMessage =
            errorBody.error;
        }
      }
    } catch (
      contextError
    ) {
      console.warn(
        "Could not read create-order error response:",
        contextError
      );
    }

    throw new Error(
      serverMessage ||
        "We could not create your order. Please try again."
    );
  }

  /*
   * ------------------------------------------------------
   * INVALID RESPONSE
   * ------------------------------------------------------
   */

  if (!data) {
    throw new Error(
      "The order service returned an empty response."
    );
  }

  const response =
    data as
      | CreateOrderResult
      | CreateOrderErrorResponse;

  /*
   * ------------------------------------------------------
   * SERVER REJECTED ORDER
   * ------------------------------------------------------
   */

  if (
    response.success !==
    true
  ) {
    throw new Error(
      response.error ||
        "We could not create your order."
    );
  }

  /*
   * ------------------------------------------------------
   * VERIFY ORDER DATA
   * ------------------------------------------------------
   */

  if (
    !response.order
  ) {
    throw new Error(
      "The order was created but no order information was returned."
    );
  }

  if (
    !response.order_number
  ) {
    throw new Error(
      "The order was created but no order number was returned."
    );
  }

  if (
    !response.payment_reference
  ) {
    throw new Error(
      "The order was created but no payment reference was returned."
    );
  }

  if (
    !response.pricing
  ) {
    throw new Error(
      "The order was created but no pricing information was returned."
    );
  }

  /*
   * ------------------------------------------------------
   * NORMALIZE SERVER RESPONSE
   * ------------------------------------------------------
   */

  const result:
    CreateOrderResult = {
      success:
        true,

      email_sent:
        Boolean(
          response.email_sent
        ),

      order:
        normalizeCreatedOrder(
          response.order
        ),

      order_number:
        String(
          response.order_number
        ),

      payment_reference:
        String(
          response.payment_reference
        ),

      pricing:
        normalizeOrderPricing(
          response.pricing
        ),

      warning:
        response.warning
          ? String(
              response.warning
            )
          : null,
    };

  /*
   * ------------------------------------------------------
   * FINAL SANITY CHECK
   * ------------------------------------------------------
   */

  if (
    result.pricing.total_amount <=
    0
  ) {
    console.error(
      "Invalid pricing returned by create-order:",
      result
    );

    throw new Error(
      "The server returned an invalid order total."
    );
  }

  return result;
}

/* =========================================================
   FORMAT ORDER PRICE
========================================================= */

export function formatOrderPrice(
  amount: number,
  currency = "EUR"
): string {
  return new Intl.NumberFormat(
    "en-IE",
    {
      style:
        "currency",

      currency:
        currency.toUpperCase(),
    }
  ).format(
    amount
  );
}

/* =========================================================
   GET ORDER DISPLAY TOTAL
========================================================= */

export function getOrderDisplayTotal(
  result: CreateOrderResult
): string {
  return formatOrderPrice(
    result.pricing.total_amount,
    result.pricing.currency
  );
}

/* =========================================================
   GET ORDER DISPLAY UNIT PRICE
========================================================= */

export function getOrderDisplayUnitPrice(
  result: CreateOrderResult
): string {
  return formatOrderPrice(
    result.pricing.unit_price,
    result.pricing.currency
  );
}