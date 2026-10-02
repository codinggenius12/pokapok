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

export type OrderRefurbishedGrade =
  | "correct"
  | "good"
  | "excellent"
  | "premium";

export type OrderBatteryGrade =
  | "optimal"
  | "new";

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

   The frontend sends identifiers, customer information,
   refurbished selections and the customer's preferred
   DISPLAY currency.

   The browser never sends:
   - authoritative product price
   - refurbished cosmetic-grade price
   - battery-upgrade price
   - exchange rate
   - unit price
   - shipping price
   - order total

   The Edge Function resolves all monetary values.
========================================================= */

export type CreateOrderInput = {
  /* CUSTOMER */

  customerName:
    string;

  /*
   * Optional.
   *
   * An empty string is valid and means that no confirmation
   * email should be sent.
   */
  customerEmail?:
    | string
    | null;

  customerWhatsapp?:
    | string
    | null;

  /* DELIVERY */

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

  /* PRODUCT */

  productId:
    string;

  variantId?:
    | string
    | null;

  condition:
    OrderCondition;

  /*
   * Required when condition === "refurbished".
   *
   * These identify the customer's selected options only.
   * Their monetary values are resolved by the Edge Function.
   */
  refurbishedGrade?:
    | OrderRefurbishedGrade
    | null;

  batteryGrade?:
    | OrderBatteryGrade
    | null;

  quantity?:
    number;

  /* PAYMENT */

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
  id:
    string;

  order_number:
    string;

  payment_reference:
    string;

  /* CUSTOMER */

  customer_name:
    string;

  customer_email?:
    | string
    | null;

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

  /* PRODUCT */

  product_id?:
    | string
    | null;

  variant_id?:
    | string
    | null;

  product_name:
    string;

  storage:
    | string
    | null;

  color:
    | string
    | null;

  condition:
    OrderCondition;

  refurbished_grade?:
    | OrderRefurbishedGrade
    | null;

  battery_grade?:
    | OrderBatteryGrade
    | null;

  battery_upgrade_amount?:
    number;

  quantity:
    number;

  /*
   * Final per-device price.
   *
   * For refurbished devices with a new battery this already
   * contains the server-calculated +€89.
   */
  unit_price:
    number;

  /*
   * Product subtotal before shipping.
   */
  subtotal?:
    number;

  subtotal_amount?:
    number;

  shipping_amount?:
    number;

  total_amount:
    number;

  total?:
    number;

  currency?:
    string;

  /* DISPLAY */

  display_currency?:
    OrderDisplayCurrency;

  display_unit_price?:
    number;

  display_total_amount?:
    number;

  exchange_rate?:
    number;

  /* PAYMENT */

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
   * Current POKAPOK settlement is EUR.
   */
  currency:
    string;

  /*
   * Supabase cosmetic-grade/device price BEFORE the optional
   * new-battery surcharge.
   */
  base_unit_price?:
    number;

  /*
   * 89 when:
   *
   * condition === "refurbished"
   * batteryGrade === "new"
   *
   * Otherwise 0.
   */
  battery_upgrade_amount?:
    number;

  /*
   * Final server-calculated per-device price.
   */
  unit_price:
    number;

  quantity:
    number;

  /*
   * Product(s) before shipping.
   */
  subtotal_amount?:
    number;

  /*
   * Server-calculated destination shipping.
   */
  shipping_amount?:
    number;

  /*
   * Final amount to transfer.
   */
  total_amount:
    number;

  /*
   * Customer-facing display values.
   */
  display_currency:
    OrderDisplayCurrency;

  display_unit_price:
    number;

  display_subtotal_amount?:
    number;

  display_shipping_amount?:
    number;

  display_total_amount:
    number;

  /*
   * EUR -> display-currency rate used by the server.
   *
   * 110.265 for CVE
   * 1 for EUR
   */
  exchange_rate:
    number;
};

/* =========================================================
   BANK TRANSFER
========================================================= */

export type BankTransferDetails = {
  account_name:
    string;

  iban:
    string;

  bic:
    string;

  bank_name:
    string;

  country:
    string;

  currency:
    string;
};

export type OrderPaymentDetails = {
  method:
    "bank_transfer";

  status:
    "awaiting_payment";

  reference:
    string;

  bank:
    BankTransferDetails;
};

/* =========================================================
   CREATE ORDER RESULT
========================================================= */

export type CreateOrderResult = {
  success:
    true;

  email_sent:
    boolean;

  warning?:
    | string
    | null;

  order:
    CreatedOrder;

  order_number:
    string;

  payment_reference:
    string;

  pricing:
    OrderPricing;

  payment:
    OrderPaymentDetails;
};

/* =========================================================
   EDGE FUNCTION ERROR
========================================================= */

type CreateOrderErrorResponse = {
  success?:
    false;

  error?:
    string;

  message?:
    string;
};

/* =========================================================
   HELPERS
========================================================= */

function isValidEmail(
  email:
    string
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

function toOptionalNumber(
  value:
    unknown
):
  | number
  | undefined {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return undefined;
  }

  const number =
    Number(
      value
    );

  if (
    !Number.isFinite(
      number
    )
  ) {
    return undefined;
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
    value ??
      "CVE"
  )
    .trim()
    .toUpperCase() ===
    "EUR"
    ? "EUR"
    : "CVE";
}

function normalizeRefurbishedGrade(
  value:
    | OrderRefurbishedGrade
    | string
    | null
    | undefined
):
  | OrderRefurbishedGrade
  | null {
  if (
    value ===
      "correct" ||
    value ===
      "good" ||
    value ===
      "excellent" ||
    value ===
      "premium"
  ) {
    return value;
  }

  return null;
}

function normalizeBatteryGrade(
  value:
    | OrderBatteryGrade
    | string
    | null
    | undefined
):
  | OrderBatteryGrade
  | null {
  if (
    value ===
      "optimal" ||
    value ===
      "new"
  ) {
    return value;
  }

  return null;
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
    cleanString(
      input.customerCountry
    );

  const customerStateRegion =
    cleanString(
      input.customerStateRegion
    );

  const customerCity =
    cleanString(
      input.customerCity
    );

  const customerStreet =
    cleanString(
      input.customerStreet
    );

  const customerHouseNumber =
    cleanString(
      input.customerHouseNumber
    );

  const customerAddressLine2 =
    cleanString(
      input.customerAddressLine2
    );

  const customerPostalCode =
    cleanString(
      input.customerPostalCode
    );

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
    ) ||
    null;

  const condition =
    input.condition;

  /*
   * New products must never carry refurbished configuration.
   */
  const refurbishedGrade =
    condition ===
      "refurbished"
      ? normalizeRefurbishedGrade(
          input.refurbishedGrade
        )
      : null;

  const batteryGrade =
    condition ===
      "refurbished"
      ? normalizeBatteryGrade(
          input.batteryGrade
        )
      : null;

  const quantity =
    input.quantity ??
    1;

  const paymentMethod =
    input.paymentMethod ??
    "bank_transfer";

  const language:
    OrderLanguage =
    input.language ===
      "en"
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

    refurbishedGrade,
    batteryGrade,

    quantity,

    paymentMethod,
    language,
    displayCurrency,
  };
}

/* =========================================================
   CLIENT-SIDE VALIDATION

   Required customer fields:
   - full name
   - WhatsApp
   - country
   - island / state / region

   Optional:
   - email
   - city
   - street
   - house number
   - address line 2
   - postal code
   - notes

   The Edge Function performs the actual security and pricing
   validation.
========================================================= */

function validateCreateOrderInput(
  input:
    ReturnType<
      typeof normalizeCreateOrderInput
    >
) {
  /* =======================================================
     CUSTOMER
  ======================================================= */

  if (
    !input.customerName
  ) {
    throw new Error(
      "CUSTOMER_NAME_REQUIRED"
    );
  }

  if (
    !input.customerWhatsapp
  ) {
    throw new Error(
      "CUSTOMER_WHATSAPP_REQUIRED"
    );
  }

  /*
   * Email is optional.
   *
   * Validate it only if the customer supplied one.
   */
  if (
    input.customerEmail &&
    !isValidEmail(
      input.customerEmail
    )
  ) {
    throw new Error(
      "CUSTOMER_EMAIL_INVALID"
    );
  }

  /* =======================================================
     DELIVERY
  ======================================================= */

  if (
    !input.customerCountry
  ) {
    throw new Error(
      "CUSTOMER_COUNTRY_REQUIRED"
    );
  }

  if (
    !input.customerStateRegion
  ) {
    throw new Error(
      "CUSTOMER_STATE_REGION_REQUIRED"
    );
  }

  /*
   * City, street, house number, postal code and address line
   * 2 are intentionally optional.
   *
   * The server still validates whether the selected country
   * and Cabo Verde island are supported.
   */

  /* =======================================================
     PRODUCT
  ======================================================= */

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

  /* =======================================================
     QUANTITY
  ======================================================= */

  if (
    !Number.isInteger(
      input.quantity
    ) ||
    input.quantity < 1 ||
    input.quantity > 10
  ) {
    throw new Error(
      "INVALID_QUANTITY"
    );
  }

  /* =======================================================
     PAYMENT
  ======================================================= */

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

  /* =======================================================
     REFURBISHED CONFIGURATION
  ======================================================= */

  if (
    input.condition ===
      "refurbished"
  ) {
    if (
      !input.variantId
    ) {
      throw new Error(
        "REFURBISHED_VARIANT_REQUIRED"
      );
    }

    if (
      !input.refurbishedGrade
    ) {
      throw new Error(
        "REFURBISHED_GRADE_REQUIRED"
      );
    }

    if (
      !input.batteryGrade
    ) {
      throw new Error(
        "BATTERY_GRADE_REQUIRED"
      );
    }
  }
}

/* =========================================================
   NORMALIZE CREATED ORDER
========================================================= */

function normalizeCreatedOrder(
  order:
    any
): CreatedOrder {
  return {
    ...order,

    refurbished_grade:
      normalizeRefurbishedGrade(
        order
          ?.refurbished_grade
      ),

    battery_grade:
      normalizeBatteryGrade(
        order
          ?.battery_grade
      ),

    battery_upgrade_amount:
      toNumber(
        order
          ?.battery_upgrade_amount
      ),

    quantity:
      toNumber(
        order.quantity
      ),

    unit_price:
      toNumber(
        order.unit_price
      ),

    subtotal:
      toOptionalNumber(
        order.subtotal
      ),

    subtotal_amount:
      toOptionalNumber(
        order.subtotal_amount
      ),

    shipping_amount:
      toOptionalNumber(
        order.shipping_amount
      ),

    total:
      toOptionalNumber(
        order.total
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
  pricing:
    any
): OrderPricing {
  const baseUnitPrice =
    toOptionalNumber(
      pricing
        ?.base_unit_price
    );

  const batteryUpgradeAmount =
    toOptionalNumber(
      pricing
        ?.battery_upgrade_amount
    );

  const subtotalAmount =
    toOptionalNumber(
      pricing
        ?.subtotal_amount ??
      pricing
        ?.item_subtotal
    );

  const shippingAmount =
    toOptionalNumber(
      pricing
        ?.shipping_amount
    );

  const displaySubtotalAmount =
    toOptionalNumber(
      pricing
        ?.display_subtotal_amount ??
      pricing
        ?.display_subtotal
    );

  const displayShippingAmount =
    toOptionalNumber(
      pricing
        ?.display_shipping_amount
    );

  return {
    currency:
      String(
        pricing
          ?.currency ??
        "EUR"
      )
        .trim()
        .toUpperCase(),

    base_unit_price:
      baseUnitPrice,

    battery_upgrade_amount:
      batteryUpgradeAmount,

    unit_price:
      toNumber(
        pricing
          ?.unit_price
      ),

    quantity:
      toNumber(
        pricing
          ?.quantity
      ),

    subtotal_amount:
      subtotalAmount,

    shipping_amount:
      shippingAmount,

    total_amount:
      toNumber(
        pricing
          ?.total_amount
      ),

    display_currency:
      normalizeDisplayCurrency(
        pricing
          ?.display_currency
      ),

    display_unit_price:
      toNumber(
        pricing
          ?.display_unit_price
      ),

    display_subtotal_amount:
      displaySubtotalAmount,

    display_shipping_amount:
      displayShippingAmount,

    display_total_amount:
      toNumber(
        pricing
          ?.display_total_amount
      ),

    exchange_rate:
      toNumber(
        pricing
          ?.exchange_rate
      ),
  };
}

/* =========================================================
   NORMALIZE BANK
========================================================= */

function normalizeBankDetails(
  bank:
    any
): BankTransferDetails {
  return {
    account_name:
      String(
        bank
          ?.account_name ??
        ""
      ),

    iban:
      String(
        bank
          ?.iban ??
        ""
      ),

    bic:
      String(
        bank
          ?.bic ??
        ""
      ),

    bank_name:
      String(
        bank
          ?.bank_name ??
        ""
      ),

    country:
      String(
        bank
          ?.country ??
        ""
      ),

    currency:
      String(
        bank
          ?.currency ??
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
   * SECURITY
   *
   * No monetary product value is sent from the browser.
   *
   * The browser sends only:
   * - product ID
   * - variant ID
   * - condition
   * - cosmetic grade
   * - battery option
   * - destination information
   *
   * The Edge Function independently calculates:
   * - product price
   * - cosmetic-grade price
   * - new-battery +€89 surcharge
   * - shipping
   * - subtotal
   * - final total
   * - display currency conversion
   */
  const requestBody = {
    /* CUSTOMER */

    customer_name:
      normalized.customerName,

    customer_email:
      normalized.customerEmail ||
      null,

    customer_whatsapp:
      normalized.customerWhatsapp,

    /* DELIVERY */

    customer_country:
      normalized.customerCountry,

    customer_state_region:
      normalized.customerStateRegion,

    customer_city:
      normalized.customerCity ||
      null,

    customer_street:
      normalized.customerStreet ||
      null,

    customer_house_number:
      normalized.customerHouseNumber ||
      null,

    customer_address_line_2:
      normalized.customerAddressLine2 ||
      null,

    customer_postal_code:
      normalized.customerPostalCode ||
      null,

    customer_notes:
      normalized.customerNotes ||
      null,

    /* PRODUCT */

    product_id:
      normalized.productId,

    variant_id:
      normalized.variantId,

    condition:
      normalized.condition,

    /*
     * Selection identifiers only.
     *
     * No cosmetic-grade price or battery price is sent.
     */
    refurbished_grade:
      normalized.condition ===
        "refurbished"
        ? normalized.refurbishedGrade
        : null,

    battery_grade:
      normalized.condition ===
        "refurbished"
        ? normalized.batteryGrade
        : null,

    quantity:
      normalized.quantity,

    /* PAYMENT */

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

  if (
    error
  ) {
    console.error(
      "Create order function error:",
      error
    );

    let serverCode:
      | string
      | null =
      null;

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
          serverCode =
            errorBody.error;
        }

        if (
          typeof errorBody
            ?.message ===
          "string"
        ) {
          serverMessage =
            errorBody.message;
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

    console.error(
      "create-order server response:",
      {
        code:
          serverCode,

        message:
          serverMessage,
      }
    );

    /*
     * Use the machine-readable error code so checkout.tsx
     * can translate errors into the appropriate customer UI.
     */
    throw new Error(
      serverCode ||
      "ORDER_CREATE_FAILED"
    );
  }

  if (
    !data
  ) {
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
          response
            .payment
            .reference ??
          response
            .payment_reference
        ),

      bank:
        normalizeBankDetails(
          response
            .payment
            .bank
        ),
    },
  };

  /* =======================================================
     RESPONSE SECURITY / SANITY CHECKS
  ======================================================= */

  if (
    result
      .pricing
      .total_amount <=
    0
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
    result
      .pricing
      .unit_price <=
    0
  ) {
    console.error(
      "Invalid unit price returned by create-order:",
      result
    );

    throw new Error(
      "INVALID_ORDER_UNIT_PRICE"
    );
  }

  if (
    !Number.isInteger(
      result.pricing.quantity
    ) ||
    result.pricing.quantity < 1
  ) {
    console.error(
      "Invalid quantity returned by create-order:",
      result
    );

    throw new Error(
      "INVALID_ORDER_QUANTITY"
    );
  }

  if (
    result
      .pricing
      .currency !==
    "EUR"
  ) {
    console.error(
      "Unexpected settlement currency returned by create-order:",
      result
    );

    throw new Error(
      "INVALID_SETTLEMENT_CURRENCY"
    );
  }

  if (
    !result
      .payment
      .bank
      .iban
  ) {
    console.error(
      "Missing IBAN returned by create-order:",
      result
    );

    throw new Error(
      "BANK_DETAILS_MISSING"
    );
  }

  if (
    result
      .payment
      .bank
      .currency !==
    "EUR"
  ) {
    console.error(
      "Unexpected bank currency returned by create-order:",
      result
    );

    throw new Error(
      "INVALID_BANK_CURRENCY"
    );
  }

  /*
   * Additional refurbished consistency checks.
   */
  if (
    normalized.condition ===
      "refurbished"
  ) {
    if (
      result.order
        .refurbished_grade &&
      result.order
        .refurbished_grade !==
        normalized.refurbishedGrade
    ) {
      console.error(
        "Refurbished grade mismatch:",
        {
          requested:
            normalized.refurbishedGrade,

          returned:
            result.order
              .refurbished_grade,
        }
      );

      throw new Error(
        "REFURBISHED_GRADE_MISMATCH"
      );
    }

    if (
      result.order
        .battery_grade &&
      result.order
        .battery_grade !==
        normalized.batteryGrade
    ) {
      console.error(
        "Battery grade mismatch:",
        {
          requested:
            normalized.batteryGrade,

          returned:
            result.order
              .battery_grade,
        }
      );

      throw new Error(
        "BATTERY_GRADE_MISMATCH"
      );
    }
  }

  return result;
}

/* =========================================================
   FORMAT ORDER PRICE
========================================================= */

export function formatOrderPrice(
  amount:
    number,

  currency =
    "EUR",

  language:
    OrderLanguage =
    "pt"
): string {
  const normalizedCurrency =
    currency
      .trim()
      .toUpperCase();

  const locale =
    language ===
      "pt"
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
   SETTLEMENT TOTAL
========================================================= */

export function getOrderDisplayTotal(
  result:
    CreateOrderResult,

  language:
    OrderLanguage =
    "pt"
): string {
  return formatOrderPrice(
    result
      .pricing
      .total_amount,

    result
      .pricing
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
    result
      .pricing
      .display_total_amount,

    result
      .pricing
      .display_currency,

    language
  );
}

/* =========================================================
   SETTLEMENT UNIT PRICE
========================================================= */

export function getOrderDisplayUnitPrice(
  result:
    CreateOrderResult,

  language:
    OrderLanguage =
    "pt"
): string {
  return formatOrderPrice(
    result
      .pricing
      .unit_price,

    result
      .pricing
      .currency,

    language
  );
}