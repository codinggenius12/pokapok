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
   ORDER ITEM INPUT
========================================================= */

export type CreateOrderItemInput = {
  productId:
    string;

  variantId?:
    | string
    | null;

  condition:
    OrderCondition;

  /*
   * Required for refurbished products.
   */
  refurbishedGrade?:
    | OrderRefurbishedGrade
    | null;

  batteryGrade?:
    | OrderBatteryGrade
    | null;

  quantity?:
    number;
};

/* =========================================================
   CREATE ORDER INPUT

   IMPORTANT:
   Prices are intentionally NOT sent by the browser.

   The frontend sends only:
   - product / variant identifiers
   - condition
   - refurbished selections
   - quantity
   - customer / delivery information
   - display currency

   The Edge Function calculates all monetary values.

   `items` is the new multi-item format.

   The legacy single-item fields remain temporarily supported
   so the storefront can be upgraded without breaking older
   calls.
========================================================= */

export type CreateOrderInput = {
  /* CUSTOMER */

  customerName:
    string;

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

  /* =======================================================
     NEW MULTI-ITEM FORMAT
  ======================================================= */

  items?:
    CreateOrderItemInput[];

  /* =======================================================
     LEGACY SINGLE-ITEM FORMAT

     Temporary backwards compatibility.
  ======================================================= */

  productId?:
    string;

  variantId?:
    | string
    | null;

  condition?:
    OrderCondition;

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
   CREATED ORDER ITEM
========================================================= */

export type CreatedOrderItem = {
  id?:
    string;

  order_id?:
    string;

  product_id:
    string;

  variant_id:
    | string
    | null;

  product_name:
    string;

  variant_storage?:
    | string
    | null;

  variant_color?:
    | string
    | null;

  storage?:
    | string
    | null;

  color?:
    | string
    | null;

  condition:
    OrderCondition;

  refurbished_grade:
    | OrderRefurbishedGrade
    | null;

  battery_grade:
    | OrderBatteryGrade
    | null;

  quantity:
    number;

  /*
   * Price before an optional new-battery surcharge.
   */
  base_unit_price:
    number;

  /*
   * €89 for a refurbished phone with batteryGrade === "new".
   */
  battery_upgrade_amount:
    number;

  /*
   * Final price per device.
   */
  unit_price:
    number;

  /*
   * unit_price × quantity.
   */
  line_subtotal:
    number;

  display_unit_price?:
    number;

  display_line_subtotal?:
    number;
};

/* =========================================================
   ORDER RECORD

   The existing orders table still contains legacy
   single-product fields for dashboard compatibility.

   Full multi-item order contents should come from order_items.
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

  /* LEGACY PRODUCT FIELDS */

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

  /*
   * For multi-item orders this legacy value represents the
   * first order line only.
   */
  unit_price:
    number;

  /*
   * Total number of devices across all order lines.
   */
  quantity:
    number;

  /* TOTALS */

  subtotal?:
    number;

  subtotal_amount?:
    number;

  shipping_amount?:
    number;

  insurance_amount?:
    number;

  discount_amount?:
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
   * Settlement currency.
   * POKAPOK currently settles bank transfers in EUR.
   */
  currency:
    string;

  /*
   * Aggregate product subtotal before shipping.
   */
  item_subtotal:
    number;

  /*
   * Alias kept for compatibility with existing UI.
   */
  subtotal_amount:
    number;

  shipping_amount:
    number;

  total_amount:
    number;

  /*
   * Total number of individual devices.
   */
  quantity:
    number;

  /*
   * Number of distinct cart/order lines.
   */
  item_count:
    number;

  /*
   * Legacy compatibility values.

   * For multi-item orders unit_price represents the first
   * order line only.
   */
  base_unit_price?:
    number;

  battery_upgrade_amount?:
    number;

  unit_price:
    number;

  /* DISPLAY */

  display_currency:
    OrderDisplayCurrency;

  display_unit_price:
    number;

  display_subtotal_amount:
    number;

  display_shipping_amount:
    number;

  display_total_amount:
    number;

  exchange_rate:
    number;

  items:
    CreatedOrderItem[];
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

  items:
    CreatedOrderItem[];
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
   NORMALIZE ONE ORDER INPUT ITEM
========================================================= */

function normalizeCreateOrderItem(
  item:
    CreateOrderItemInput
) {
  const productId =
    cleanString(
      item.productId
    );

  const variantId =
    cleanString(
      item.variantId
    ) ||
    null;

  const condition =
    item.condition;

  const refurbishedGrade =
    condition ===
      "refurbished"
      ? normalizeRefurbishedGrade(
          item.refurbishedGrade
        )
      : null;

  const batteryGrade =
    condition ===
      "refurbished"
      ? normalizeBatteryGrade(
          item.batteryGrade
        )
      : null;

  const quantity =
    item.quantity ??
    1;

  return {
    productId,
    variantId,
    condition,
    refurbishedGrade,
    batteryGrade,
    quantity,
  };
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

  /* =======================================================
     ITEMS

     Prefer the new items[] payload.

     If it is absent, convert the legacy single-product input
     into a one-item array.
  ======================================================= */

  let items:
    ReturnType<
      typeof normalizeCreateOrderItem
    >[] = [];

  if (
    Array.isArray(
      input.items
    ) &&
    input.items.length >
      0
  ) {
    items =
      input.items.map(
        normalizeCreateOrderItem
      );
  } else {
    const legacyProductId =
      cleanString(
        input.productId
      );

    if (
      legacyProductId &&
      input.condition
    ) {
      items = [
        normalizeCreateOrderItem({
          productId:
            legacyProductId,

          variantId:
            input.variantId ??
            null,

          condition:
            input.condition,

          refurbishedGrade:
            input.refurbishedGrade ??
            null,

          batteryGrade:
            input.batteryGrade ??
            null,

          quantity:
            input.quantity ??
            1,
        }),
      ];
    }
  }

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

    items,

    paymentMethod,
    language,
    displayCurrency,
  };
}

/* =========================================================
   CLIENT-SIDE VALIDATION
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

  /* =======================================================
     ITEMS
  ======================================================= */

  if (
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

  input.items.forEach(
    (
      item,
      index
    ) => {
      if (
        !item.productId
      ) {
        console.error(
          "Missing product ID:",
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
        item.condition ===
          "refurbished"
      ) {
        if (
          !item.variantId
        ) {
          throw new Error(
            "REFURBISHED_VARIANT_REQUIRED"
          );
        }

        if (
          !item.refurbishedGrade
        ) {
          throw new Error(
            "REFURBISHED_GRADE_REQUIRED"
          );
        }

        if (
          !item.batteryGrade
        ) {
          throw new Error(
            "BATTERY_GRADE_REQUIRED"
          );
        }
      }
    }
  );

  if (
    totalQuantity >
    50
  ) {
    throw new Error(
      "TOTAL_QUANTITY_TOO_HIGH"
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
}

/* =========================================================
   NORMALIZE CREATED ORDER ITEM
========================================================= */

function normalizeCreatedOrderItem(
  item:
    any
): CreatedOrderItem {
  return {
    id:
      item?.id
        ? String(
            item.id
          )
        : undefined,

    order_id:
      item?.order_id
        ? String(
            item.order_id
          )
        : undefined,

    product_id:
      String(
        item
          ?.product_id ??
        ""
      ),

    variant_id:
      item
        ?.variant_id
        ? String(
            item.variant_id
          )
        : null,

    product_name:
      String(
        item
          ?.product_name ??
        ""
      ),

    variant_storage:
      item
        ?.variant_storage ??
      item
        ?.storage ??
      null,

    variant_color:
      item
        ?.variant_color ??
      item
        ?.color ??
      null,

    storage:
      item
        ?.storage ??
      item
        ?.variant_storage ??
      null,

    color:
      item
        ?.color ??
      item
        ?.variant_color ??
      null,

    condition:
      item
        ?.condition ===
        "refurbished"
        ? "refurbished"
        : "new",

    refurbished_grade:
      normalizeRefurbishedGrade(
        item
          ?.refurbished_grade
      ),

    battery_grade:
      normalizeBatteryGrade(
        item
          ?.battery_grade
      ),

    quantity:
      toNumber(
        item
          ?.quantity
      ),

    base_unit_price:
      toNumber(
        item
          ?.base_unit_price
      ),

    battery_upgrade_amount:
      toNumber(
        item
          ?.battery_upgrade_amount
      ),

    unit_price:
      toNumber(
        item
          ?.unit_price
      ),

    line_subtotal:
      toNumber(
        item
          ?.line_subtotal
      ),

    display_unit_price:
      toOptionalNumber(
        item
          ?.display_unit_price
      ),

    display_line_subtotal:
      toOptionalNumber(
        item
          ?.display_line_subtotal
      ),
  };
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
        order
          ?.quantity
      ),

    unit_price:
      toNumber(
        order
          ?.unit_price
      ),

    subtotal:
      toOptionalNumber(
        order
          ?.subtotal
      ),

    subtotal_amount:
      toOptionalNumber(
        order
          ?.subtotal_amount
      ),

    shipping_amount:
      toOptionalNumber(
        order
          ?.shipping_amount
      ),

    insurance_amount:
      toOptionalNumber(
        order
          ?.insurance_amount
      ),

    discount_amount:
      toOptionalNumber(
        order
          ?.discount_amount
      ),

    total:
      toOptionalNumber(
        order
          ?.total
      ),

    total_amount:
      toNumber(
        order
          ?.total_amount
      ),

    display_currency:
      normalizeDisplayCurrency(
        order
          ?.display_currency
      ),

    display_unit_price:
      toNumber(
        order
          ?.display_unit_price
      ),

    display_total_amount:
      toNumber(
        order
          ?.display_total_amount
      ),

    exchange_rate:
      toNumber(
        order
          ?.exchange_rate
      ),
  };
}

/* =========================================================
   NORMALIZE PRICING
========================================================= */

function normalizeOrderPricing(
  pricing:
    any,

  responseItems:
    CreatedOrderItem[]
): OrderPricing {
 const normalizedItems:
  CreatedOrderItem[] =
  Array.isArray(
    pricing?.items
  )
    ? pricing.items.map(
        (
          item: any
        ) =>
          normalizeCreatedOrderItem(
            item
          )
      )
    : responseItems;

  const subtotalAmount =
    toNumber(
      pricing
        ?.subtotal_amount ??
      pricing
        ?.item_subtotal
    );

    const calculatedQuantity =
  normalizedItems.reduce(
    (
      total:
        number,

      item:
        CreatedOrderItem
    ) =>
      total +
      item.quantity,
    0
  );

  const shippingAmount =
    toNumber(
      pricing
        ?.shipping_amount
    );

  const totalQuantity =
  toNumber(
    pricing
      ?.quantity ??
    pricing
      ?.total_quantity ??
    calculatedQuantity
  );

  const firstItem =
    normalizedItems[0];

  return {
    currency:
      String(
        pricing
          ?.currency ??
        "EUR"
      )
        .trim()
        .toUpperCase(),

    item_subtotal:
      subtotalAmount,

    subtotal_amount:
      subtotalAmount,

    shipping_amount:
      shippingAmount,

    total_amount:
      toNumber(
        pricing
          ?.total_amount
      ),

    quantity:
      totalQuantity,

    item_count:
      toNumber(
        pricing
          ?.item_count ??
        normalizedItems.length
      ),

    base_unit_price:
      toOptionalNumber(
        pricing
          ?.base_unit_price ??
        firstItem
          ?.base_unit_price
      ),

    battery_upgrade_amount:
      toOptionalNumber(
        pricing
          ?.battery_upgrade_amount
      ),

    unit_price:
      toNumber(
        pricing
          ?.unit_price ??
        firstItem
          ?.unit_price
      ),

    display_currency:
      normalizeDisplayCurrency(
        pricing
          ?.display_currency
      ),

    display_unit_price:
      toNumber(
        pricing
          ?.display_unit_price ??
        firstItem
          ?.display_unit_price
      ),

    display_subtotal_amount:
      toNumber(
        pricing
          ?.display_subtotal_amount ??
        pricing
          ?.display_subtotal
      ),

    display_shipping_amount:
      toNumber(
        pricing
          ?.display_shipping_amount
      ),

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

    items:
      normalizedItems,
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
   * No authoritative price is ever sent from the browser.
   *
   * The server independently calculates:
   *
   * - product prices
   * - refurbished grade prices
   * - battery surcharges
   * - quantity totals
   * - shipping
   * - subtotal
   * - final total
   * - display conversion
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

    /* =====================================================
       MULTI-ITEM CART
    ===================================================== */

    items:
      normalized.items.map(
        (
          item
        ) => ({
          product_id:
            item.productId,

          variant_id:
            item.variantId,

          condition:
            item.condition,

          refurbished_grade:
            item.condition ===
              "refurbished"
              ? item.refurbishedGrade
              : null,

          battery_grade:
            item.condition ===
              "refurbished"
              ? item.batteryGrade
              : null,

          quantity:
            item.quantity,
        })
      ),

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
    data as any
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

  /* =======================================================
     ITEMS RESPONSE
  ======================================================= */

  const responseItems:
    CreatedOrderItem[] =
    Array.isArray(
      response.items
    )
      ? response.items.map(
          normalizeCreatedOrderItem
        )
      : Array.isArray(
            response
              ?.pricing
              ?.items
          )
        ? response
            .pricing
            .items
            .map(
              normalizeCreatedOrderItem
            )
        : [];

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
        response.pricing,
        responseItems
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

    items:
      responseItems,
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
      .item_subtotal <=
    0
  ) {
    console.error(
      "Invalid subtotal returned by create-order:",
      result
    );

    throw new Error(
      "INVALID_ORDER_SUBTOTAL"
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
      result
        .pricing
        .quantity
    ) ||
    result
      .pricing
      .quantity <
      1
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
   * Once the new create-order backend is deployed, every
   * successful order should return order_items.
   */
  if (
    result.items.length >
    0
  ) {
    for (
      let index = 0;
      index <
      result.items.length;
      index++
    ) {
      const item =
        result.items[
          index
        ];

      if (
        !item.product_id
      ) {
        throw new Error(
          "ORDER_ITEM_PRODUCT_MISSING"
        );
      }

      if (
        item.unit_price <=
        0
      ) {
        throw new Error(
          "INVALID_ORDER_ITEM_PRICE"
        );
      }

      if (
        item.line_subtotal <=
        0
      ) {
        throw new Error(
          "INVALID_ORDER_ITEM_SUBTOTAL"
        );
      }

      if (
        !Number.isInteger(
          item.quantity
        ) ||
        item.quantity <
          1
      ) {
        throw new Error(
          "INVALID_ORDER_ITEM_QUANTITY"
        );
      }
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
   LEGACY / FIRST-LINE UNIT PRICE
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