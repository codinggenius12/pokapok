import { supabase } from "../lib/supabase";

/* =========================================================
   ORDER TYPES
========================================================= */

export type OrderLanguage =
  | "pt"
  | "en";

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

export type OrderDisplayCurrency =
  | "CVE"
  | "EUR";

/* =========================================================
   CREATE ORDER INPUT

   Prices are intentionally NOT included.

   The frontend sends identifiers, customer information and
   the customer's preferred DISPLAY currency.

   The browser never sends an authoritative product price,
   exchange rate, unit price or order total.
========================================================= */

export type CreateOrderInput = {
  customerName: string;

  customerEmail: string;

  customerWhatsapp?:
    | string
    | null;

  customerCountry?:
    | string
    | null;

  customerStateRegion?:
    | string
    | null;

  customerCity?:
    | string
    | null;

  customerStreet?:
    | string
    | null;

  customerHouseNumber?:
    | string
    | null;

  customerAddressLine2?:
    | string
    | null;

  customerPostalCode?:
    | string
    | null;

  customerNotes?:
    | string
    | null;

  productId: string;

  variantId?:
    | string
    | null;

  condition:
    OrderCondition;

  quantity?: number;

  paymentMethod?:
    OrderPaymentMethod;

  language?:
    OrderLanguage;

  displayCurrency?:
    OrderDisplayCurrency;
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

  customer_whatsapp?:
    | string
    | null;

  customer_country?:
    | string
    | null;

  customer_state_region?:
    | string
    | null;

  customer_city?:
    | string
    | null;

  customer_street?:
    | string
    | null;

  customer_house_number?:
    | string
    | null;

  customer_address_line_2?:
    | string
    | null;

  customer_postal_code?:
    | string
    | null;

  customer_notes?:
    | string
    | null;

  language?:
    OrderLanguage;

  product_id?:
    | string
    | null;

  variant_id?:
    | string
    | null;

  product_name: string;

  storage:
    | string
    | null;

  color:
    | string
    | null;

  condition:
    OrderCondition;

  quantity: number;

  unit_price: number;

  total_amount: number;

  currency?:
    string;

  display_currency?:
    OrderDisplayCurrency;

  display_unit_price?:
    number;

  display_total_amount?:
    number;

  exchange_rate?:
    number;

  payment_method:
    OrderPaymentMethod;

  payment_status:
    OrderPaymentStatus;

  order_status:
    OrderStatus;

  payment_received_at?:
    | string
    | null;

  created_at?:
    string;

  updated_at?:
    string;
};

/* =========================================================
   ORDER PRICING
========================================================= */

export type OrderPricing = {
  /*
   * Actual settlement currency for the bank transfer.
   * For the current POKAPOK Revolut flow this is EUR.
   */
  currency: string;

  unit_price: number;

  quantity: number;

  total_amount: number;

  /*
   * Customer-facing display values.
   * CVE is the storefront default; EUR is optional.
   */
  display_currency:
    OrderDisplayCurrency;

  display_unit_price:
    number;

  display_total_amount:
    number;

  /*
   * EUR -> display-currency rate used by the server.
   * 110.265 when display_currency === "CVE"; 1 for EUR.
   */
  exchange_rate:
    number;
};

/* =========================================================
   BANK TRANSFER
========================================================= */

export type BankTransferDetails = {
  account_name: string;

  iban: string;

  bic: string;

  bank_name: string;

  country: string;

  currency: string;
};

export type OrderPaymentDetails = {
  method:
    "bank_transfer";

  status:
    "awaiting_payment";

  reference: string;

  bank:
    BankTransferDetails;
};

/* =========================================================
   CREATE ORDER RESULT
========================================================= */

export type CreateOrderResult = {
  success: true;

  email_sent: boolean;

  warning?:
    | string
    | null;

  order:
    CreatedOrder;

  order_number: string;

  payment_reference: string;

  pricing:
    OrderPricing;

  payment:
    OrderPaymentDetails;
};

/* =========================================================
   EDGE FUNCTION ERROR
========================================================= */

type CreateOrderErrorResponse = {
  success?: false;

  error?: string;
};

/* =========================================================
   HELPERS
========================================================= */

function isValidEmail(
  email: string
): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email
  );
}

function cleanString(
  value:
    | string
    | null
    | undefined
) {
  return (
    value?.trim() ??
    ""
  );
}

function toNumber(
  value:
    unknown
): number {
  const number =
    Number(
      value
    );

  if (
    !Number.isFinite(
      number
    )
  ) {
    return 0;
  }

  return number;
}

function normalizeDisplayCurrency(
  value:
    | string
    | null
    | undefined
): OrderDisplayCurrency {
  return String(
    value ?? "CVE"
  )
    .trim()
    .toUpperCase() === "EUR"
    ? "EUR"
    : "CVE";
}

/* =========================================================
   INPUT NORMALIZATION
========================================================= */

function normalizeCreateOrderInput(
  input:
    CreateOrderInput
) {
  const customerName =
    cleanString(
      input.customerName
    );

  const customerEmail =
    cleanString(
      input.customerEmail
    ).toLowerCase();

  const customerWhatsapp =
    cleanString(
      input.customerWhatsapp
    );

  const customerCountry =
    cleanString(input.customerCountry);

  const customerStateRegion =
    cleanString(input.customerStateRegion);

  const customerCity =
    cleanString(input.customerCity);

  const customerStreet =
    cleanString(input.customerStreet);

  const customerHouseNumber =
    cleanString(input.customerHouseNumber);

  const customerAddressLine2 =
    cleanString(input.customerAddressLine2);

  const customerPostalCode =
    cleanString(input.customerPostalCode);

  const customerNotes =
    cleanString(
      input.customerNotes
    );

  const productId =
    cleanString(
      input.productId
    );

  const variantId =
    cleanString(
      input.variantId
    ) || null;

  const condition =
    input.condition;

  const quantity =
    input.quantity ??
    1;

  const paymentMethod =
    input.paymentMethod ??
    "bank_transfer";

  const language:
    OrderLanguage =
    input.language === "en"
      ? "en"
      : "pt";

  const displayCurrency =
    normalizeDisplayCurrency(
      input.displayCurrency
    );

  return {
    customerName,
    customerEmail,

    customerWhatsapp,
    customerCountry,
    customerStateRegion,
    customerCity,
    customerStreet,
    customerHouseNumber,
    customerAddressLine2,
    customerPostalCode,
    customerNotes,

    productId,
    variantId,

    condition,
    quantity,

    paymentMethod,
    language,
    displayCurrency,
  };
}

/* =========================================================
   CLIENT-SIDE VALIDATION

   This exists for user experience.
   The Edge Function performs the actual security validation.
========================================================= */

function validateCreateOrderInput(
  input:
    ReturnType<
      typeof normalizeCreateOrderInput
    >
) {
  if (
    !input.customerName
  ) {
    throw new Error(
      "CUSTOMER_NAME_REQUIRED"
    );
  }

  if (
    !input.customerEmail
  ) {
    throw new Error(
      "CUSTOMER_EMAIL_REQUIRED"
    );
  }

  if (
    !isValidEmail(
      input.customerEmail
    )
  ) {
    throw new Error(
      "CUSTOMER_EMAIL_INVALID"
    );
  }

  if (
    !input.customerWhatsapp ||
    !input.customerCountry ||
    !input.customerStateRegion ||
    !input.customerCity ||
    !input.customerStreet
  ) {
    throw new Error(
      "DELIVERY_ADDRESS_REQUIRED"
    );
  }

  if (
    !input.productId
  ) {
    throw new Error(
      "PRODUCT_REQUIRED"
    );
  }

  if (
    input.condition !==
      "new" &&
    input.condition !==
      "refurbished"
  ) {
    throw new Error(
      "INVALID_CONDITION"
    );
  }

  if (
    !Number.isInteger(
      input.quantity
    ) ||
    input.quantity < 1
  ) {
    throw new Error(
      "INVALID_QUANTITY"
    );
  }

  if (
    input.paymentMethod !==
    "bank_transfer"
  ) {
    throw new Error(
      "PAYMENT_METHOD_NOT_AVAILABLE"
    );
  }

  if (
    input.displayCurrency !==
      "CVE" &&
    input.displayCurrency !==
      "EUR"
  ) {
    throw new Error(
      "INVALID_DISPLAY_CURRENCY"
    );
  }
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

    unit_price:
      toNumber(
        order.unit_price
      ),

    total_amount:
      toNumber(
        order.total_amount
      ),

    display_currency:
      normalizeDisplayCurrency(
        order.display_currency
      ),

    display_unit_price:
      toNumber(
        order.display_unit_price
      ),

    display_total_amount:
      toNumber(
        order.display_total_amount
      ),

    exchange_rate:
      toNumber(
        order.exchange_rate
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
      )
        .trim()
        .toUpperCase(),

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

    display_currency:
      normalizeDisplayCurrency(
        pricing?.display_currency
      ),

    display_unit_price:
      toNumber(
        pricing?.display_unit_price
      ),

    display_total_amount:
      toNumber(
        pricing?.display_total_amount
      ),

    exchange_rate:
      toNumber(
        pricing?.exchange_rate
      ),
  };
}

/* =========================================================
   NORMALIZE BANK
========================================================= */

function normalizeBankDetails(
  bank: any
): BankTransferDetails {
  return {
    account_name:
      String(
        bank?.account_name ??
        ""
      ),

    iban:
      String(
        bank?.iban ??
        ""
      ),

    bic:
      String(
        bank?.bic ??
        ""
      ),

    bank_name:
      String(
        bank?.bank_name ??
        ""
      ),

    country:
      String(
        bank?.country ??
        ""
      ),

    currency:
      String(
        bank?.currency ??
        "EUR"
      )
        .trim()
        .toUpperCase(),
  };
}

/* =========================================================
   CREATE ORDER
========================================================= */

export async function createOrder(
  input:
    CreateOrderInput
): Promise<CreateOrderResult> {
  const normalized =
    normalizeCreateOrderInput(
      input
    );

  validateCreateOrderInput(
    normalized
  );

  /*
   * Prices and exchange-rate values are intentionally absent.
   * The server calculates them from Supabase and the fixed
   * EUR/CVE conversion rule.
   */
  const requestBody = {
    customer_name:
      normalized.customerName,

    customer_email:
      normalized.customerEmail,

    customer_whatsapp:
      normalized.customerWhatsapp ||
      null,

    customer_country:
      normalized.customerCountry || null,

    customer_state_region:
      normalized.customerStateRegion || null,

    customer_city:
      normalized.customerCity || null,

    customer_street:
      normalized.customerStreet || null,

    customer_house_number:
      normalized.customerHouseNumber || null,

    customer_address_line_2:
      normalized.customerAddressLine2 || null,

    customer_postal_code:
      normalized.customerPostalCode || null,

    customer_notes:
      normalized.customerNotes ||
      null,

    product_id:
      normalized.productId,

    variant_id:
      normalized.variantId,

    condition:
      normalized.condition,

    quantity:
      normalized.quantity,

    payment_method:
      normalized.paymentMethod,

    language:
      normalized.language,

    display_currency:
      normalized.displayCurrency,
  };

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

  if (error) {
    console.error(
      "Create order function error:",
      error
    );

    let serverMessage:
      | string
      | null =
      null;

    try {
      const context =
        (
          error as any
        )?.context;

      if (
        context &&
        typeof context.json ===
          "function"
      ) {
        const errorBody =
          await context.json();

        if (
          typeof errorBody
            ?.error ===
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
      "ORDER_CREATE_FAILED"
    );
  }

  if (!data) {
    throw new Error(
      "ORDER_RESPONSE_EMPTY"
    );
  }

  const response =
    data as
      | CreateOrderResult
      | CreateOrderErrorResponse;

  if (
    response.success !==
    true
  ) {
    throw new Error(
      response.error ||
      "ORDER_CREATE_FAILED"
    );
  }

  if (
    !response.order
  ) {
    throw new Error(
      "ORDER_RESPONSE_INVALID"
    );
  }

  if (
    !response.order_number
  ) {
    throw new Error(
      "ORDER_NUMBER_MISSING"
    );
  }

  if (
    !response.payment_reference
  ) {
    throw new Error(
      "PAYMENT_REFERENCE_MISSING"
    );
  }

  if (
    !response.pricing
  ) {
    throw new Error(
      "ORDER_PRICING_MISSING"
    );
  }

  if (
    !response.payment
  ) {
    throw new Error(
      "PAYMENT_DETAILS_MISSING"
    );
  }

  if (
    !response.payment.bank
  ) {
    throw new Error(
      "BANK_DETAILS_MISSING"
    );
  }

  const result:
    CreateOrderResult = {
    success:
      true,

    email_sent:
      Boolean(
        response.email_sent
      ),

    warning:
      response.warning
        ? String(
            response.warning
          )
        : null,

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

    payment: {
      method:
        "bank_transfer",

      status:
        "awaiting_payment",

      reference:
        String(
          response.payment.reference ??
          response.payment_reference
        ),

      bank:
        normalizeBankDetails(
          response.payment.bank
        ),
    },
  };

  if (
    result.pricing
      .total_amount <= 0
  ) {
    console.error(
      "Invalid pricing returned by create-order:",
      result
    );

    throw new Error(
      "INVALID_ORDER_TOTAL"
    );
  }

  if (
    !result.payment
      .bank.iban
  ) {
    console.error(
      "Missing IBAN returned by create-order:",
      result
    );

    throw new Error(
      "BANK_DETAILS_MISSING"
    );
  }

  return result;
}

/* =========================================================
   FORMAT ORDER PRICE
========================================================= */

export function formatOrderPrice(
  amount: number,
  currency = "EUR",
  language:
    OrderLanguage =
    "pt"
): string {
  const normalizedCurrency =
    currency
      .trim()
      .toUpperCase();

  const locale =
    language === "pt"
      ? "pt-PT"
      : "en-IE";

  if (
    normalizedCurrency ===
    "CVE"
  ) {
    return `${new Intl.NumberFormat(
      locale,
      {
        maximumFractionDigits:
          0,
      }
    ).format(
      Math.round(
        amount
      )
    )} CVE`;
  }

  return new Intl.NumberFormat(
    locale,
    {
      style:
        "currency",

      currency:
        normalizedCurrency,
    }
  ).format(
    amount
  );
}

/* =========================================================
   DISPLAY TOTAL
========================================================= */

export function getOrderDisplayTotal(
  result:
    CreateOrderResult,
  language:
    OrderLanguage =
    "pt"
): string {
  return formatOrderPrice(
    result.pricing
      .total_amount,

    result.pricing
      .currency,

    language
  );
}

/* =========================================================
   CUSTOMER DISPLAY TOTAL
========================================================= */

export function getOrderCustomerDisplayTotal(
  result:
    CreateOrderResult,
  language:
    OrderLanguage =
    "pt"
): string {
  return formatOrderPrice(
    result.pricing
      .display_total_amount,

    result.pricing
      .display_currency,

    language
  );
}

/* =========================================================
   DISPLAY UNIT PRICE
========================================================= */

export function getOrderDisplayUnitPrice(
  result:
    CreateOrderResult,
  language:
    OrderLanguage =
    "pt"
): string {
  return formatOrderPrice(
    result.pricing
      .unit_price,

    result.pricing
      .currency,

    language
  );
}
