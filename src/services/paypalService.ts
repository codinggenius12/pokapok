export type PayPalCondition =
  | "new"
  | "refurbished";

export type PayPalLanguage =
  | "pt"
  | "en";

export type PayPalDisplayCurrency =
  | "CVE"
  | "EUR";

export type PayPalRefurbishedGrade =
  | "correct"
  | "good"
  | "excellent"
  | "premium";

export type PayPalBatteryGrade =
  | "optimal"
  | "new";

/* =========================================================
   CREATE PAYPAL ORDER
========================================================= */

export type CreatePayPalOrderInput = {
  productId:
    string;

  variantId?:
    | string
    | null;

  condition:
    PayPalCondition;

  quantity:
    number;

  /* =======================================================
     REFURBISHED CONFIGURATION

     Required when condition === "refurbished".

     IMPORTANT:
     These selections tell the server WHAT the customer
     selected. They do not tell the server the price.

     The server remains responsible for:
     - reading the cosmetic-grade price from Supabase
     - applying the fixed +€89 new-battery surcharge
  ======================================================= */

  refurbishedGrade?:
    | PayPalRefurbishedGrade
    | null;

  batteryGrade?:
    | PayPalBatteryGrade
    | null;

  /* CUSTOMER */

  customerName:
    string;

  customerEmail?:
    string;

  customerWhatsapp:
    string;

  /* DELIVERY */

  country:
    string;

  stateRegion:
    string;

  city?:
    string;

  street?:
    string;

  houseNumber?:
    string;

  addressLine2?:
    string;

  postalCode?:
    string;

  /* ORDER */

  notes?:
    string;

  language:
    PayPalLanguage;

  displayCurrency:
    PayPalDisplayCurrency;
};

export type CreatePayPalOrderResult = {
  success:
    true;

  order_id:
    string;

  order_number:
    string;

  paypal_order_id:
    string;

  paypal_status:
    string;

  pricing: {
    currency:
      "EUR";

    /*
     * Final server-authoritative unit price.
     *
     * For refurbished:
     * cosmetic-grade price from Supabase
     * + optional fixed €89 battery upgrade.
     */
    unit_price:
      number;

    quantity:
      number;

    item_subtotal:
      number;

    shipping_amount:
      number;

    total_amount:
      number;

    display_currency:
      PayPalDisplayCurrency;

    display_unit_price:
      number;

    display_subtotal:
      number;

    display_shipping_amount:
      number;

    display_total_amount:
      number;

    exchange_rate:
      number;
  };

  shipping: {
    country:
      string;

    state_region:
      string;

    amount:
      number;

    currency:
      "EUR";
  };

  product: {
    id:
      string;

    name:
      string;

    slug:
      string;

    condition:
      PayPalCondition;

    variant_id:
      | string
      | null;

    storage:
      | string
      | null;

    color:
      | string
      | null;

    sku:
      | string
      | null;

    refurbished_grade?:
      | PayPalRefurbishedGrade
      | null;

    battery_grade?:
      | PayPalBatteryGrade
      | null;

    battery_upgrade_amount?:
      number;
  };
};

/* =========================================================
   CAPTURE PAYPAL ORDER
========================================================= */

export type CapturePayPalOrderResult = {
  success:
    true;

  already_captured?:
    boolean;

  already_finalized?:
    boolean;

  email_sent?:
    boolean;

  warning?:
    string
    | null;

  order_id?:
    string;

  order_number?:
    string;

  payment_status?:
    string;

  order_status?:
    string;

  paypal_order_id:
    string;

  paypal_status:
    string;

  capture: {
    id:
      string;

    status:
      string;

    currency:
      | string
      | null;

    amount:
      | number
      | null;
  };

  pricing?: {
    currency:
      string;

    subtotal_amount:
      | number
      | null;

    shipping_amount:
      | number
      | null;

    total_amount:
      number;

    display_currency:
      | string
      | null;

    display_total_amount:
      | number
      | null;

    exchange_rate:
      | number
      | null;
  };
};

/* =========================================================
   CONFIG
========================================================= */

const supabaseUrl =
  process.env
    .EXPO_PUBLIC_SUPABASE_URL;

const supabaseKey =
  process.env
    .EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  process.env
    .EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

function getConfig() {
  if (!supabaseUrl) {
    throw new Error(
      "EXPO_PUBLIC_SUPABASE_URL_MISSING"
    );
  }

  if (!supabaseKey) {
    throw new Error(
      "SUPABASE_PUBLIC_KEY_MISSING"
    );
  }

  return {
    supabaseUrl,
    supabaseKey,
  };
}

/* =========================================================
   HELPERS
========================================================= */

function cleanString(
  value:
    | string
    | null
    | undefined
) {
  return (
    value ??
    ""
  ).trim();
}

function normalizeEmail(
  value:
    | string
    | null
    | undefined
) {
  return cleanString(
    value
  ).toLowerCase();
}

function isValidEmail(
  email:
    string
) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email
  );
}

function isValidRefurbishedGrade(
  value:
    unknown
): value is PayPalRefurbishedGrade {
  return (
    value ===
      "correct" ||
    value ===
      "good" ||
    value ===
      "excellent" ||
    value ===
      "premium"
  );
}

function isValidBatteryGrade(
  value:
    unknown
): value is PayPalBatteryGrade {
  return (
    value ===
      "optimal" ||
    value ===
      "new"
  );
}

/* =========================================================
   JSON RESPONSE
========================================================= */

async function readJsonResponse(
  response:
    Response
) {
  const text =
    await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(
      text
    ) as Record<
      string,
      unknown
    >;
  } catch {
    return {
      raw:
        text,
    };
  }
}

/* =========================================================
   CREATE PAYPAL ORDER
========================================================= */

export async function createPayPalOrder(
  input:
    CreatePayPalOrderInput
): Promise<CreatePayPalOrderResult> {
  const config =
    getConfig();

  const productId =
    cleanString(
      input.productId
    );

  const variantId =
    cleanString(
      input.variantId
    ) ||
    null;

  const customerName =
    cleanString(
      input.customerName
    );

  const customerEmail =
    normalizeEmail(
      input.customerEmail
    );

  const customerWhatsapp =
    cleanString(
      input.customerWhatsapp
    );

  const country =
    cleanString(
      input.country
    );

  const stateRegion =
    cleanString(
      input.stateRegion
    );

  const city =
    cleanString(
      input.city
    );

  const street =
    cleanString(
      input.street
    );

  const houseNumber =
    cleanString(
      input.houseNumber
    );

  const addressLine2 =
    cleanString(
      input.addressLine2
    );

  const postalCode =
    cleanString(
      input.postalCode
    );

  const notes =
    cleanString(
      input.notes
    );

  /*
   * New products deliberately send null for both
   * refurbished-only selections.
   */
  const refurbishedGrade:
    | PayPalRefurbishedGrade
    | null =
      input.condition ===
      "refurbished"
        ? (
            isValidRefurbishedGrade(
              input.refurbishedGrade
            )
              ? input.refurbishedGrade
              : null
          )
        : null;

  const batteryGrade:
    | PayPalBatteryGrade
    | null =
      input.condition ===
      "refurbished"
        ? (
            isValidBatteryGrade(
              input.batteryGrade
            )
              ? input.batteryGrade
              : null
          )
        : null;

  /* =======================================================
     VALIDATION
  ======================================================= */

  if (!productId) {
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
    input.quantity < 1 ||
    input.quantity > 10
  ) {
    throw new Error(
      "INVALID_QUANTITY"
    );
  }

  /*
   * Refurbished checkout must contain the exact
   * cosmetic condition selected by the customer.
   */
  if (
    input.condition ===
      "refurbished" &&
    !refurbishedGrade
  ) {
    throw new Error(
      "REFURBISHED_GRADE_REQUIRED"
    );
  }

  /*
   * Refurbished checkout must also contain the
   * exact battery option selected by the customer.
   */
  if (
    input.condition ===
      "refurbished" &&
    !batteryGrade
  ) {
    throw new Error(
      "BATTERY_GRADE_REQUIRED"
    );
  }

  if (
    !customerName
  ) {
    throw new Error(
      "CUSTOMER_NAME_REQUIRED"
    );
  }

  if (
    !customerWhatsapp
  ) {
    throw new Error(
      "CUSTOMER_WHATSAPP_REQUIRED"
    );
  }

  if (
    customerEmail &&
    !isValidEmail(
      customerEmail
    )
  ) {
    throw new Error(
      "INVALID_CUSTOMER_EMAIL"
    );
  }

  if (!country) {
    throw new Error(
      "COUNTRY_REQUIRED"
    );
  }

  if (!stateRegion) {
    throw new Error(
      "STATE_REGION_REQUIRED"
    );
  }

  if (
    input.language !==
      "pt" &&
    input.language !==
      "en"
  ) {
    throw new Error(
      "INVALID_LANGUAGE"
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
     REQUEST
  ======================================================= */

  const response =
    await fetch(
      `${config.supabaseUrl}/functions/v1/create-paypal-order`,
      {
        method:
          "POST",

        headers: {
          "Content-Type":
            "application/json",

          Authorization:
            `Bearer ${config.supabaseKey}`,
        },

        body:
          JSON.stringify({
            productId,

            variantId,

            condition:
              input.condition,

            quantity:
              input.quantity,

            /*
             * Selection only.
             *
             * No grade price or battery price is sent
             * from the browser.
             */
            refurbishedGrade,

            batteryGrade,

            customerName,

            customerEmail:
              customerEmail ||
              null,

            customerWhatsapp,

            country,

            stateRegion,

            city:
              city ||
              null,

            street:
              street ||
              null,

            houseNumber:
              houseNumber ||
              null,

            addressLine2:
              addressLine2 ||
              null,

            postalCode:
              postalCode ||
              null,

            notes:
              notes ||
              null,

            language:
              input.language,

            displayCurrency:
              input.displayCurrency,
          }),
      }
    );

  const data =
    await readJsonResponse(
      response
    );

  if (!response.ok) {
    console.error(
      "create-paypal-order failed:",
      data
    );

    throw new Error(
      typeof data.error ===
        "string"
        ? data.error
        : "PAYPAL_CREATE_ORDER_FAILED"
    );
  }

  if (
    data.success !==
      true ||
    typeof data.paypal_order_id !==
      "string" ||
    typeof data.order_id !==
      "string" ||
    typeof data.order_number !==
      "string"
  ) {
    console.error(
      "Invalid create-paypal-order response:",
      data
    );

    throw new Error(
      "INVALID_PAYPAL_CREATE_RESPONSE"
    );
  }

  return data as unknown as
    CreatePayPalOrderResult;
}

/* =========================================================
   CAPTURE PAYPAL ORDER
========================================================= */

export async function capturePayPalOrder(
  paypalOrderId:
    string
): Promise<CapturePayPalOrderResult> {
  const config =
    getConfig();

  const cleanPayPalOrderId =
    cleanString(
      paypalOrderId
    );

  if (
    !cleanPayPalOrderId
  ) {
    throw new Error(
      "PAYPAL_ORDER_ID_REQUIRED"
    );
  }

  const response =
    await fetch(
      `${config.supabaseUrl}/functions/v1/capture-paypal-order`,
      {
        method:
          "POST",

        headers: {
          "Content-Type":
            "application/json",

          Authorization:
            `Bearer ${config.supabaseKey}`,
        },

        body:
          JSON.stringify({
            paypalOrderId:
              cleanPayPalOrderId,
          }),
      }
    );

  const data =
    await readJsonResponse(
      response
    );

  if (!response.ok) {
    console.error(
      "capture-paypal-order failed:",
      data
    );

    throw new Error(
      typeof data.error ===
        "string"
        ? data.error
        : "PAYPAL_CAPTURE_FAILED"
    );
  }

  if (
    data.success !==
      true ||
    typeof data.paypal_order_id !==
      "string" ||
    typeof data.capture !==
      "object" ||
    data.capture ===
      null
  ) {
    console.error(
      "Invalid capture-paypal-order response:",
      data
    );

    throw new Error(
      "INVALID_PAYPAL_CAPTURE_RESPONSE"
    );
  }

  return data as unknown as
    CapturePayPalOrderResult;
}