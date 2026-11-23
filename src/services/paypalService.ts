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
   PAYPAL ITEM INPUT
========================================================= */

export type CreatePayPalOrderItemInput = {
  productId:
    string;

  variantId?:
    | string
    | null;

  condition:
    PayPalCondition;

  quantity:
    number;

  refurbishedGrade?:
    | PayPalRefurbishedGrade
    | null;

  batteryGrade?:
    | PayPalBatteryGrade
    | null;
};

/* =========================================================
   CREATE PAYPAL ORDER
========================================================= */

export type CreatePayPalOrderInput = {
  /* =======================================================
     MULTI-ITEM CART
  ======================================================= */

  items:
    CreatePayPalOrderItemInput[];

  /* CUSTOMER */

  customerName:
    string;

  customerEmail?:
    string
    | null;

  customerWhatsapp:
    string;

  /* DELIVERY */

  country:
    string;

  stateRegion:
    string;

  city?:
    string
    | null;

  street?:
    string
    | null;

  houseNumber?:
    string
    | null;

  addressLine2?:
    string
    | null;

  postalCode?:
    string
    | null;

  /* ORDER */

  notes?:
    string
    | null;

  language:
    PayPalLanguage;

  displayCurrency:
    PayPalDisplayCurrency;
};

/* =========================================================
   CREATED PAYPAL ORDER ITEM
========================================================= */

export type CreatedPayPalOrderItem = {
  product_id:
    string;

  variant_id:
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

  sku?:
    | string
    | null;

  condition:
    PayPalCondition;

  refurbished_grade:
    | PayPalRefurbishedGrade
    | null;

  battery_grade:
    | PayPalBatteryGrade
    | null;

  battery_upgrade_amount:
    number;

  base_unit_price:
    number;

  unit_price:
    number;

  quantity:
    number;

  line_subtotal:
    number;

  display_unit_price?:
    number;

  display_line_subtotal?:
    number;
};

/* =========================================================
   CREATE PAYPAL ORDER RESULT
========================================================= */

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

  items:
    CreatedPayPalOrderItem[];

  pricing: {
    currency:
      "EUR";

    item_subtotal:
      number;

    subtotal_amount?:
      number;

    shipping_amount:
      number;

    total_amount:
      number;

    quantity:
      number;

    item_count:
      number;

    /*
     * Legacy compatibility.
     * For multi-item orders, unit_price refers to the first
     * order line only.
     */
    unit_price:
      number;

    display_currency:
      PayPalDisplayCurrency;

    display_unit_price:
      number;

    display_subtotal:
      number;

    display_subtotal_amount?:
      number;

    display_shipping_amount:
      number;

    display_total_amount:
      number;

    exchange_rate:
      number;

    items?:
      CreatedPayPalOrderItem[];
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

    display_amount?:
      number;

    display_currency?:
      PayPalDisplayCurrency;
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

    item_subtotal?:
      number
      | null;

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

  items?:
    CreatedPayPalOrderItem[];
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
  if (
    !supabaseUrl
  ) {
    throw new Error(
      "EXPO_PUBLIC_SUPABASE_URL_MISSING"
    );
  }

  if (
    !supabaseKey
  ) {
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

  if (
    !text
  ) {
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

  /* =======================================================
     ITEMS
  ======================================================= */

  if (
    !Array.isArray(
      input.items
    ) ||
    input.items.length ===
      0
  ) {
    throw new Error(
      "ITEMS_REQUIRED"
    );
  }

  if (
    input.items.length >
    20
  ) {
    throw new Error(
      "TOO_MANY_ORDER_LINES"
    );
  }

  let totalQuantity =
    0;

  const items =
    input.items.map(
      (
        item,
        index
      ) => {
        const productId =
          cleanString(
            item.productId
          );

        const variantId =
          cleanString(
            item.variantId
          ) ||
          null;

        if (
          !productId
        ) {
          console.error(
            "Missing PayPal product ID:",
            {
              index,
              item,
            }
          );

          throw new Error(
            "PRODUCT_REQUIRED"
          );
        }

        if (
          item.condition !==
            "new" &&
          item.condition !==
            "refurbished"
        ) {
          throw new Error(
            "INVALID_CONDITION"
          );
        }

        if (
          !Number.isInteger(
            item.quantity
          ) ||
          item.quantity <
            1 ||
          item.quantity >
            10
        ) {
          throw new Error(
            "INVALID_QUANTITY"
          );
        }

        totalQuantity +=
          item.quantity;

        if (
          totalQuantity >
          50
        ) {
          throw new Error(
            "TOTAL_QUANTITY_TOO_HIGH"
          );
        }

        const refurbishedGrade:
          | PayPalRefurbishedGrade
          | null =
          item.condition ===
            "refurbished" &&
          isValidRefurbishedGrade(
            item.refurbishedGrade
          )
            ? item.refurbishedGrade
            : null;

        const batteryGrade:
          | PayPalBatteryGrade
          | null =
          item.condition ===
            "refurbished" &&
          isValidBatteryGrade(
            item.batteryGrade
          )
            ? item.batteryGrade
            : null;

        if (
          item.condition ===
            "refurbished"
        ) {
          if (
            !variantId
          ) {
            throw new Error(
              "REFURBISHED_VARIANT_REQUIRED"
            );
          }

          if (
            !refurbishedGrade
          ) {
            throw new Error(
              "REFURBISHED_GRADE_REQUIRED"
            );
          }

          if (
            !batteryGrade
          ) {
            throw new Error(
              "BATTERY_GRADE_REQUIRED"
            );
          }
        }

        return {
          productId,

          variantId,

          condition:
            item.condition,

          quantity:
            item.quantity,

          refurbishedGrade:
            item.condition ===
              "refurbished"
              ? refurbishedGrade
              : null,

          batteryGrade:
            item.condition ===
              "refurbished"
              ? batteryGrade
              : null,
        };
      }
    );

  /* =======================================================
     CUSTOMER VALIDATION
  ======================================================= */

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

  if (
    !country
  ) {
    throw new Error(
      "COUNTRY_REQUIRED"
    );
  }

  if (
    !stateRegion
  ) {
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
            items,

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

  if (
    !response.ok
  ) {
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

  if (
    !response.ok
  ) {
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