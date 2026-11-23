// deno-lint-ignore-file no-explicit-any

import { createClient } from "@supabase/supabase-js";

/* =========================================================
   TYPES
========================================================= */

type SupabaseServerClient = {
  from: (
    table: string
  ) => any;
};

type SellCondition =
  | "new"
  | "refurbished";

type RefurbishedGrade =
  | "correct"
  | "good"
  | "excellent"
  | "premium";

type BatteryGrade =
  | "optimal"
  | "new";

type Language =
  | "pt"
  | "en";

type DisplayCurrency =
  | "CVE"
  | "EUR";

type RequestItem = {
  productId?: string;

  variantId?:
    | string
    | null;

  condition?:
    SellCondition;

  quantity?:
    number;

  refurbishedGrade?:
    | RefurbishedGrade
    | null;

  batteryGrade?:
    | BatteryGrade
    | null;
};

type RequestBody = {
  items?:
    RequestItem[];

  customerName?:
    string;

  customerEmail?:
    string
    | null;

  customerWhatsapp?:
    string;

  country?:
    string;

  stateRegion?:
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

  notes?:
    string
    | null;

  language?:
    Language;

  displayCurrency?:
    DisplayCurrency;
};

type ProductRow = {
  id:
    string;

  name:
    string;

  slug:
    string;

  condition:
    | SellCondition
    | "used";

  refurbished_enabled:
    boolean;

  sale_price:
    | number
    | string
    | null;

  promotional_price:
    | number
    | string
    | null;

  available:
    boolean;

  published:
    boolean;
};

type VariantRow = {
  id:
    string;

  product_id:
    string;

  storage:
    | string
    | null;

  color:
    | string
    | null;

  sku:
    | string
    | null;

  available:
    boolean;

  sale_price:
    | number
    | string
    | null;

  promotional_price:
    | number
    | string
    | null;

  refurbished_sale_price:
    | number
    | string
    | null;

  refurbished_promotional_price:
    | number
    | string
    | null;

  refurbished_correct_sale_price:
    | number
    | string
    | null;

  refurbished_correct_promotional_price:
    | number
    | string
    | null;

  refurbished_good_sale_price:
    | number
    | string
    | null;

  refurbished_good_promotional_price:
    | number
    | string
    | null;

  refurbished_excellent_sale_price:
    | number
    | string
    | null;

  refurbished_excellent_promotional_price:
    | number
    | string
    | null;

  refurbished_premium_sale_price:
    | number
    | string
    | null;

  refurbished_premium_promotional_price:
    | number
    | string
    | null;
};

type CreatedOrderRow = {
  id:
    string;

  order_number:
    string;
};

type StripeCheckoutSession = {
  id?:
    string;

  url?:
    string
    | null;

  status?:
    string
    | null;

  payment_status?:
    string
    | null;

  payment_intent?:
    string
    | null;

  error?: {
    message?:
      string;

    type?:
      string;

    code?:
      string;

    param?:
      string;
  };

  [key: string]:
    unknown;
};

type DestinationValidationResult =
  | {
      valid:
        false;

      code:
        string;

      message:
        string;
    }
  | {
      valid:
        true;

      shippingPrice:
        number;
    };

type ValidatedCheckoutItem = {
  product:
    ProductRow;

  variant:
    | VariantRow
    | null;

  condition:
    SellCondition;

  refurbishedGrade:
    | RefurbishedGrade
    | null;

  batteryGrade:
    | BatteryGrade
    | null;

  quantity:
    number;

  baseUnitPrice:
    number;

  batteryUpgradeAmount:
    number;

  unitPrice:
    number;

  lineSubtotal:
    number;

  productName:
    string;

  storage:
    string
    | null;

  color:
    string
    | null;
};

/* =========================================================
   LIMITS
========================================================= */

const MAX_ORDER_LINES =
  20;

const MAX_QUANTITY_PER_LINE =
  10;

const MAX_TOTAL_QUANTITY =
  50;

/* =========================================================
   CURRENCY
========================================================= */

const EUR_TO_CVE =
  110.265;

const SETTLEMENT_CURRENCY =
  "EUR";

/* =========================================================
   REFURBISHED
========================================================= */

const NEW_BATTERY_SURCHARGE =
  89;

/* =========================================================
   SHIPPING
========================================================= */

const EUROPE_SHIPPING_PRICE =
  12.75;

const CABO_VERDE_SHIPPING_PRICE =
  21;

const SUPPORTED_EUROPE_COUNTRIES =
  new Set([
    "Portugal",
    "Netherlands",
    "Belgium",
    "Germany",
    "France",
    "Spain",
    "Italy",
    "Luxembourg",
    "Austria",
    "Denmark",
    "Sweden",
    "Finland",
    "Ireland",
    "Greece",
    "Poland",
    "Czech Republic",
    "Slovakia",
    "Slovenia",
    "Croatia",
    "Hungary",
    "Romania",
    "Bulgaria",
    "Estonia",
    "Latvia",
    "Lithuania",
    "Cyprus",
    "Malta",
  ]);

const CABO_VERDE_ISLANDS =
  new Set([
    "Santiago",
    "São Vicente",
    "Santo Antão",
    "São Nicolau",
    "Sal",
    "Boa Vista",
    "Maio",
    "Fogo",
    "Brava",
  ]);

/* =========================================================
   CORS
========================================================= */

const corsHeaders = {
  "Access-Control-Allow-Origin":
    "*",

  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",

  "Access-Control-Allow-Methods":
    "POST, OPTIONS",
};

/* =========================================================
   RESPONSES
========================================================= */

function jsonResponse(
  body:
    unknown,

  status =
    200
) {
  return new Response(
    JSON.stringify(
      body
    ),
    {
      status,

      headers: {
        ...corsHeaders,

        "Content-Type":
          "application/json",
      },
    }
  );
}

function badRequest(
  message:
    string,

  code =
    "BAD_REQUEST"
) {
  return jsonResponse(
    {
      success:
        false,

      error:
        code,

      message,
    },
    400
  );
}

function serverError(
  message:
    string,

  code =
    "SERVER_ERROR"
) {
  return jsonResponse(
    {
      success:
        false,

      error:
        code,

      message,
    },
    500
  );
}

/* =========================================================
   GENERAL HELPERS
========================================================= */

function cleanString(
  value:
    unknown
) {
  return String(
    value ??
      ""
  ).trim();
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
): value is RefurbishedGrade {
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
): value is BatteryGrade {
  return (
    value ===
      "optimal" ||
    value ===
      "new"
  );
}

function toNumber(
  value:
    | number
    | string
    | null
    | undefined
): number | null {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const parsed =
    typeof value ===
      "number"
      ? value
      : Number(
          value
        );

  if (
    !Number.isFinite(
      parsed
    )
  ) {
    return null;
  }

  return parsed;
}

function roundMoney(
  value:
    number
) {
  return (
    Math.round(
      (
        value +
        Number.EPSILON
      ) * 100
    ) / 100
  );
}

function convertEurForDisplay(
  eurAmount:
    number,

  displayCurrency:
    DisplayCurrency
) {
  if (
    displayCurrency ===
      "CVE"
  ) {
    return Math.round(
      eurAmount *
        EUR_TO_CVE
    );
  }

  return roundMoney(
    eurAmount
  );
}

function eurToStripeCents(
  amount:
    number
) {
  return Math.round(
    roundMoney(
      amount
    ) * 100
  );
}

/* =========================================================
   IDENTIFIERS
========================================================= */

function randomCode(
  length:
    number
) {
  const alphabet =
    "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  const bytes =
    new Uint8Array(
      length
    );

  crypto.getRandomValues(
    bytes
  );

  return Array.from(
    bytes,
    (
      byte
    ) =>
      alphabet[
        byte %
          alphabet.length
      ]
  ).join(
    ""
  );
}

function createOrderNumber() {
  const year =
    new Date()
      .getFullYear();

  return `POK-${year}-${randomCode(
    8
  )}`;
}

function createPaymentReference() {
  return `POK-${randomCode(
    7
  )}`;
}

/* =========================================================
   PRICE HELPERS
========================================================= */

function choosePrice(
  salePrice:
    | number
    | string
    | null
    | undefined,

  promotionalPrice:
    | number
    | string
    | null
    | undefined
) {
  const regular =
    toNumber(
      salePrice
    );

  const promotional =
    toNumber(
      promotionalPrice
    );

  if (
    promotional !==
      null &&
    promotional > 0 &&
    (
      regular ===
        null ||
      promotional <
        regular
    )
  ) {
    return promotional;
  }

  if (
    regular !==
      null &&
    regular > 0
  ) {
    return regular;
  }

  return null;
}

/* =========================================================
   SHIPPING HELPERS
========================================================= */

function getShippingPrice(
  country:
    string
): number | null {
  if (
    country ===
      "Cabo Verde"
  ) {
    return CABO_VERDE_SHIPPING_PRICE;
  }

  if (
    SUPPORTED_EUROPE_COUNTRIES.has(
      country
    )
  ) {
    return EUROPE_SHIPPING_PRICE;
  }

  return null;
}

function validateDestination(
  country:
    string,

  stateRegion:
    string
): DestinationValidationResult {
  if (!country) {
    return {
      valid:
        false,

      code:
        "COUNTRY_REQUIRED",

      message:
        "Shipping country is required.",
    };
  }

  if (!stateRegion) {
    return {
      valid:
        false,

      code:
        "STATE_REGION_REQUIRED",

      message:
        "Island, state or region is required.",
    };
  }

  const shippingPrice =
    getShippingPrice(
      country
    );

  if (
    shippingPrice ===
      null
  ) {
    return {
      valid:
        false,

      code:
        "UNSUPPORTED_SHIPPING_COUNTRY",

      message:
        "Shipping is not available to this country.",
    };
  }

  if (
    country ===
      "Cabo Verde" &&
    !CABO_VERDE_ISLANDS.has(
      stateRegion
    )
  ) {
    return {
      valid:
        false,

      code:
        "INVALID_CABO_VERDE_ISLAND",

      message:
        "A valid Cabo Verde island is required.",
    };
  }

  return {
    valid:
      true,

    shippingPrice,
  };
}

/* =========================================================
   PRODUCT AVAILABILITY
========================================================= */

function productCanBeSoldNew(
  product:
    ProductRow
) {
  return (
    product.condition ===
      "new"
  );
}

function productCanBeSoldRefurbished(
  product:
    ProductRow
) {
  return (
    product.condition ===
      "refurbished" ||
    product
      .refurbished_enabled ===
      true
  );
}

/* =========================================================
   REFURBISHED GRADE PRICE
========================================================= */

function getRefurbishedGradePrice(
  variant:
    VariantRow,

  grade:
    RefurbishedGrade
) {
  switch (
    grade
  ) {
    case "correct":
      return choosePrice(
        variant
          .refurbished_correct_sale_price,

        variant
          .refurbished_correct_promotional_price
      );

    case "good":
      return choosePrice(
        variant
          .refurbished_good_sale_price,

        variant
          .refurbished_good_promotional_price
      );

    case "excellent":
      return choosePrice(
        variant
          .refurbished_excellent_sale_price,

        variant
          .refurbished_excellent_promotional_price
      );

    case "premium":
      return choosePrice(
        variant
          .refurbished_premium_sale_price,

        variant
          .refurbished_premium_promotional_price
      );
  }
}

/* =========================================================
   AUTHORITATIVE NEW PRICE
========================================================= */

function getNewProductPrice(
  product:
    ProductRow
) {
  if (
    !productCanBeSoldNew(
      product
    )
  ) {
    return null;
  }

  return choosePrice(
    product.sale_price,
    product.promotional_price
  );
}

function getNewVariantPrice(
  product:
    ProductRow,

  variant:
    VariantRow
) {
  if (
    !productCanBeSoldNew(
      product
    )
  ) {
    return null;
  }

  return choosePrice(
    variant.sale_price,
    variant.promotional_price
  );
}

/* =========================================================
   LABELS
========================================================= */

function getRefurbishedGradeLabel(
  grade:
    RefurbishedGrade
) {
  switch (
    grade
  ) {
    case "correct":
      return "Correct";

    case "good":
      return "Good";

    case "excellent":
      return "Excellent";

    case "premium":
      return "Premium";
  }
}

function getBatteryGradeLabel(
  grade:
    BatteryGrade
) {
  return grade ===
      "new"
    ? "New battery"
    : "Optimal battery";
}

/* =========================================================
   STRIPE PRODUCT TEXT
========================================================= */

function buildItemName(
  product:
    ProductRow,

  variant:
    | VariantRow
    | null
) {
  const storage =
    variant
      ?.storage
      ?.trim();

  if (storage) {
    return `${product.name} ${storage}`.slice(
      0,
      127
    );
  }

  return product.name.slice(
    0,
    127
  );
}

function buildItemDescription(
  variant:
    | VariantRow
    | null,

  condition:
    SellCondition,

  refurbishedGrade:
    | RefurbishedGrade
    | null,

  batteryGrade:
    | BatteryGrade
    | null
) {
  const pieces:
    string[] = [];

  if (
    variant
      ?.color
      ?.trim()
  ) {
    pieces.push(
      variant.color.trim()
    );
  }

  if (
    condition ===
      "refurbished"
  ) {
    pieces.push(
      "Refurbished"
    );

    if (
      refurbishedGrade
    ) {
      pieces.push(
        getRefurbishedGradeLabel(
          refurbishedGrade
        )
      );
    }

    if (
      batteryGrade
    ) {
      pieces.push(
        getBatteryGradeLabel(
          batteryGrade
        )
      );
    }
  } else {
    pieces.push(
      "New"
    );
  }

  return pieces
    .join(
      " · "
    )
    .slice(
      0,
      500
    );
}

/* =========================================================
   LOAD + VALIDATE ONE CART ITEM
========================================================= */

async function validateCheckoutItem(
  supabase:
    SupabaseServerClient,

  rawItem:
    RequestItem,

  itemIndex:
    number
): Promise<
  | {
      success:
        true;

      item:
        ValidatedCheckoutItem;
    }
  | {
      success:
        false;

      code:
        string;

      message:
        string;
    }
> {
  const productId =
    cleanString(
      rawItem.productId
    );

  const variantId =
    cleanString(
      rawItem.variantId
    ) ||
    null;

  const condition =
    rawItem.condition;

  const quantity =
    Number(
      rawItem.quantity ??
        1
    );

  const refurbishedGrade =
    isValidRefurbishedGrade(
      rawItem
        .refurbishedGrade
    )
      ? rawItem
          .refurbishedGrade
      : null;

  const batteryGrade =
    isValidBatteryGrade(
      rawItem
        .batteryGrade
    )
      ? rawItem
          .batteryGrade
      : null;

  /* =======================================================
     BASIC LINE VALIDATION
  ======================================================= */

  if (!productId) {
    return {
      success:
        false,

      code:
        "PRODUCT_REQUIRED",

      message:
        `Product ID is required for item ${itemIndex + 1}.`,
    };
  }

  if (
    condition !==
      "new" &&
    condition !==
      "refurbished"
  ) {
    return {
      success:
        false,

      code:
        "INVALID_CONDITION",

      message:
        `A valid condition is required for item ${itemIndex + 1}.`,
    };
  }

  if (
    !Number.isInteger(
      quantity
    ) ||
    quantity < 1 ||
    quantity >
      MAX_QUANTITY_PER_LINE
  ) {
    return {
      success:
        false,

      code:
        "INVALID_QUANTITY",

      message:
        `Quantity for item ${itemIndex + 1} must be between 1 and ${MAX_QUANTITY_PER_LINE}.`,
    };
  }

  if (
    condition ===
      "refurbished" &&
    !variantId
  ) {
    return {
      success:
        false,

      code:
        "REFURBISHED_VARIANT_REQUIRED",

      message:
        `A variant is required for refurbished item ${itemIndex + 1}.`,
    };
  }

  if (
    condition ===
      "refurbished" &&
    !refurbishedGrade
  ) {
    return {
      success:
        false,

      code:
        "REFURBISHED_GRADE_REQUIRED",

      message:
        `A cosmetic grade is required for refurbished item ${itemIndex + 1}.`,
    };
  }

  if (
    condition ===
      "refurbished" &&
    !batteryGrade
  ) {
    return {
      success:
        false,

      code:
        "BATTERY_GRADE_REQUIRED",

      message:
        `A battery option is required for refurbished item ${itemIndex + 1}.`,
    };
  }

  if (
    condition ===
      "new" &&
    (
      rawItem
        .refurbishedGrade !=
        null ||
      rawItem
        .batteryGrade !=
        null
    )
  ) {
    return {
      success:
        false,

      code:
        "INVALID_NEW_PRODUCT_CONFIGURATION",

      message:
        `Refurbished configuration cannot be used for new item ${itemIndex + 1}.`,
    };
  }

  /* =======================================================
     PRODUCT
  ======================================================= */

  const {
    data:
      productData,

    error:
      productError,
  } =
    await supabase
      .from(
        "products"
      )
      .select(
        `
        id,
        name,
        slug,
        condition,
        refurbished_enabled,
        sale_price,
        promotional_price,
        available,
        published
        `
      )
      .eq(
        "id",
        productId
      )
      .maybeSingle();

  if (
    productError
  ) {
    console.error(
      "Product query error:",
      {
        itemIndex,
        productId,
        productError,
      }
    );

    return {
      success:
        false,

      code:
        "PRODUCT_QUERY_FAILED",

      message:
        `Could not read product for item ${itemIndex + 1}.`,
    };
  }

  const product =
    productData as
      | ProductRow
      | null;

  if (!product) {
    return {
      success:
        false,

      code:
        "PRODUCT_NOT_FOUND",

      message:
        `Product for item ${itemIndex + 1} was not found.`,
    };
  }

  if (
    !product.published ||
    !product.available
  ) {
    return {
      success:
        false,

      code:
        "PRODUCT_UNAVAILABLE",

      message:
        `${product.name} is not currently available.`,
    };
  }

  if (
    condition ===
      "new" &&
    !productCanBeSoldNew(
      product
    )
  ) {
    return {
      success:
        false,

      code:
        "NEW_NOT_AVAILABLE",

      message:
        `${product.name} is not available as new.`,
    };
  }

  if (
    condition ===
      "refurbished" &&
    !productCanBeSoldRefurbished(
      product
    )
  ) {
    return {
      success:
        false,

      code:
        "REFURBISHED_NOT_AVAILABLE",

      message:
        `${product.name} is not available as refurbished.`,
    };
  }

  /* =======================================================
     VARIANT
  ======================================================= */

  let variant:
    | VariantRow
    | null =
    null;

  if (
    variantId
  ) {
    const {
      data:
        variantData,

      error:
        variantError,
    } =
      await supabase
        .from(
          "product_variants"
        )
        .select(
          `
          id,
          product_id,
          storage,
          color,
          sku,
          available,

          sale_price,
          promotional_price,

          refurbished_sale_price,
          refurbished_promotional_price,

          refurbished_correct_sale_price,
          refurbished_correct_promotional_price,

          refurbished_good_sale_price,
          refurbished_good_promotional_price,

          refurbished_excellent_sale_price,
          refurbished_excellent_promotional_price,

          refurbished_premium_sale_price,
          refurbished_premium_promotional_price
          `
        )
        .eq(
          "id",
          variantId
        )
        .eq(
          "product_id",
          product.id
        )
        .maybeSingle();

    if (
      variantError
    ) {
      console.error(
        "Variant query error:",
        {
          itemIndex,
          variantId,
          variantError,
        }
      );

      return {
        success:
          false,

        code:
          "VARIANT_QUERY_FAILED",

        message:
          `Could not read the variant for ${product.name}.`,
      };
    }

    variant =
      variantData as
        | VariantRow
        | null;

    if (!variant) {
      return {
        success:
          false,

        code:
          "VARIANT_NOT_FOUND",

        message:
          `The selected variant for ${product.name} was not found.`,
      };
    }

    if (
      !variant.available
    ) {
      return {
        success:
          false,

        code:
          "VARIANT_UNAVAILABLE",

        message:
          `The selected variant of ${product.name} is unavailable.`,
      };
    }
  }

  /* =======================================================
     AUTHORITATIVE PRICE
  ======================================================= */

  let baseUnitPrice:
    number | null =
    null;

  if (
    condition ===
      "new"
  ) {
    baseUnitPrice =
      variant
        ? getNewVariantPrice(
            product,
            variant
          )
        : getNewProductPrice(
            product
          );
  }

  if (
    condition ===
      "refurbished"
  ) {
    if (
      !variant ||
      !refurbishedGrade
    ) {
      return {
        success:
          false,

        code:
          "REFURBISHED_CONFIGURATION_REQUIRED",

        message:
          `The refurbished configuration for ${product.name} is incomplete.`,
      };
    }

    baseUnitPrice =
      getRefurbishedGradePrice(
        variant,
        refurbishedGrade
      );
  }

  if (
    baseUnitPrice ===
      null ||
    baseUnitPrice <= 0
  ) {
    return {
      success:
        false,

      code:
        "PRICE_NOT_AVAILABLE",

      message:
        condition ===
          "refurbished"
          ? `No valid price is configured for the selected cosmetic grade of ${product.name}.`
          : `No valid selling price is configured for ${product.name}.`,
    };
  }

  const safeBaseUnitPrice =
    roundMoney(
      baseUnitPrice
    );

  const batteryUpgradeAmount =
    condition ===
      "refurbished" &&
    batteryGrade ===
      "new"
      ? NEW_BATTERY_SURCHARGE
      : 0;

  const safeUnitPrice =
    roundMoney(
      safeBaseUnitPrice +
        batteryUpgradeAmount
    );

  const lineSubtotal =
    roundMoney(
      safeUnitPrice *
        quantity
    );

  return {
    success:
      true,

    item: {
      product,

      variant,

      condition,

      refurbishedGrade:
        condition ===
          "refurbished"
          ? refurbishedGrade
          : null,

      batteryGrade:
        condition ===
          "refurbished"
          ? batteryGrade
          : null,

      quantity,

      baseUnitPrice:
        safeBaseUnitPrice,

      batteryUpgradeAmount,

      unitPrice:
        safeUnitPrice,

      lineSubtotal,

      productName:
        cleanString(
          product.name
        ),

      storage:
        variant
          ?.storage
          ? cleanString(
              variant.storage
            )
          : null,

      color:
        variant
          ?.color
          ? cleanString(
              variant.color
            )
          : null,
    },
  };
}

/* =========================================================
   STRIPE
========================================================= */

async function createStripeCheckoutSession(
  stripeSecretKey:
    string,

  siteUrl:
    string,

  pendingOrder:
    CreatedOrderRow,

  paymentReference:
    string,

  items:
    ValidatedCheckoutItem[],

  shippingPrice:
    number,

  customerName:
    string,

  customerEmail:
    string,

  customerWhatsapp:
    string,

  country:
    string,

  stateRegion:
    string,

  language:
    Language
) {
  const params =
    new URLSearchParams();

  params.set(
    "mode",
    "payment"
  );

  /*
   * Do not send automatic_payment_methods here.
   * Stripe Checkout determines eligible payment methods
   * from your Stripe Dashboard configuration.
   */

  params.set(
    "success_url",
    `${siteUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`
  );

  params.set(
    "cancel_url",
    `${siteUrl}/checkout?payment_cancelled=stripe`
  );

  params.set(
    "client_reference_id",
    pendingOrder.id
  );

  params.set(
    "locale",
    language ===
        "pt"
      ? "pt"
      : "en"
  );

  if (
    customerEmail
  ) {
    params.set(
      "customer_email",
      customerEmail
    );
  }

  /* =======================================================
     POKAPOK METADATA
  ======================================================= */

  params.set(
    "metadata[pokapok_order_id]",
    pendingOrder.id
  );

  params.set(
    "metadata[order_number]",
    pendingOrder.order_number
  );

  params.set(
    "metadata[payment_reference]",
    paymentReference
  );

  params.set(
    "metadata[item_count]",
    String(
      items.length
    )
  );

  params.set(
    "metadata[customer_name]",
    customerName.slice(
      0,
      500
    )
  );

  params.set(
    "metadata[customer_whatsapp]",
    customerWhatsapp.slice(
      0,
      500
    )
  );

  params.set(
    "metadata[shipping_country]",
    country.slice(
      0,
      500
    )
  );

  params.set(
    "metadata[shipping_region]",
    stateRegion.slice(
      0,
      500
    )
  );

  /* =======================================================
     PAYMENT INTENT METADATA
  ======================================================= */

  params.set(
    "payment_intent_data[metadata][pokapok_order_id]",
    pendingOrder.id
  );

  params.set(
    "payment_intent_data[metadata][order_number]",
    pendingOrder.order_number
  );

  params.set(
    "payment_intent_data[metadata][payment_reference]",
    paymentReference
  );

  /* =======================================================
     PRODUCT LINES
  ======================================================= */

  items.forEach(
    (
      item,
      index
    ) => {
      params.set(
        `line_items[${index}][price_data][currency]`,
        "eur"
      );

      params.set(
        `line_items[${index}][price_data][unit_amount]`,
        String(
          eurToStripeCents(
            item.unitPrice
          )
        )
      );

      params.set(
        `line_items[${index}][price_data][product_data][name]`,
        buildItemName(
          item.product,
          item.variant
        )
      );

      params.set(
        `line_items[${index}][price_data][product_data][description]`,
        buildItemDescription(
          item.variant,
          item.condition,
          item.refurbishedGrade,
          item.batteryGrade
        )
      );

      params.set(
        `line_items[${index}][quantity]`,
        String(
          item.quantity
        )
      );
    }
  );

  /* =======================================================
     SHIPPING LINE
  ======================================================= */

  const shippingIndex =
    items.length;

  params.set(
    `line_items[${shippingIndex}][price_data][currency]`,
    "eur"
  );

  params.set(
    `line_items[${shippingIndex}][price_data][unit_amount]`,
    String(
      eurToStripeCents(
        shippingPrice
      )
    )
  );

  params.set(
    `line_items[${shippingIndex}][price_data][product_data][name]`,
    "POKAPOK Shipping"
  );

  params.set(
    `line_items[${shippingIndex}][price_data][product_data][description]`,
    `${country} · ${stateRegion}`.slice(
      0,
      500
    )
  );

  params.set(
    `line_items[${shippingIndex}][quantity]`,
    "1"
  );

  /* =======================================================
     CREATE CHECKOUT SESSION
  ======================================================= */

  const response =
    await fetch(
      "https://api.stripe.com/v1/checkout/sessions",
      {
        method:
          "POST",

        headers: {
          Authorization:
            `Bearer ${stripeSecretKey}`,

          "Content-Type":
            "application/x-www-form-urlencoded",

          "Idempotency-Key":
            `pokapok-stripe-${pendingOrder.id}`,
        },

        body:
          params.toString(),

        signal:
          AbortSignal.timeout(
            15000
          ),
      }
    );

  const text =
    await response.text();

  let data:
    StripeCheckoutSession = {};

  try {
    data =
      text
        ? JSON.parse(
            text
          ) as StripeCheckoutSession
        : {};
  } catch {
    data = {
      raw:
        text,
    };
  }

  return {
    response,
    data,
  };
}

/* =========================================================
   HANDLER
========================================================= */

Deno.serve(
  async (
    request
  ) => {
    if (
      request.method ===
      "OPTIONS"
    ) {
      return new Response(
        "ok",
        {
          headers:
            corsHeaders,
        }
      );
    }

    if (
      request.method !==
      "POST"
    ) {
      return jsonResponse(
        {
          success:
            false,

          error:
            "METHOD_NOT_ALLOWED",
        },
        405
      );
    }

    try {
      console.log(
        "create-stripe-checkout started"
      );

      /* ===================================================
         ENVIRONMENT
      =================================================== */

      const supabaseUrl =
        Deno.env.get(
          "SUPABASE_URL"
        );

      const serviceRoleKey =
        Deno.env.get(
          "SUPABASE_SERVICE_ROLE_KEY"
        );

      const stripeSecretKey =
        Deno.env.get(
          "STRIPE_SECRET_KEY"
        );

      const siteUrl =
        cleanString(
          Deno.env.get(
            "POKAPOK_SITE_URL"
          )
        ).replace(
          /\/+$/,
          ""
        );

      if (
        !supabaseUrl ||
        !serviceRoleKey
      ) {
        return serverError(
          "Supabase server configuration is missing.",
          "SUPABASE_CONFIGURATION_MISSING"
        );
      }

      if (
        !stripeSecretKey
      ) {
        return serverError(
          "Stripe secret key is missing.",
          "STRIPE_SECRET_KEY_MISSING"
        );
      }

      if (
        !siteUrl
      ) {
        return serverError(
          "POKAPOK site URL is missing.",
          "POKAPOK_SITE_URL_MISSING"
        );
      }

      const supabase =
        createClient(
          supabaseUrl,
          serviceRoleKey,
          {
            auth: {
              persistSession:
                false,

              autoRefreshToken:
                false,
            },
          }
        );

      /* ===================================================
         BODY
      =================================================== */

      let body:
        RequestBody;

      try {
        body =
          await request.json();
      } catch {
        return badRequest(
          "Invalid JSON body.",
          "INVALID_JSON"
        );
      }

      /* ===================================================
         CART
      =================================================== */

      if (
        !Array.isArray(
          body.items
        ) ||
        body.items.length ===
          0
      ) {
        return badRequest(
          "At least one cart item is required.",
          "ITEMS_REQUIRED"
        );
      }

      if (
        body.items.length >
        MAX_ORDER_LINES
      ) {
        return badRequest(
          `A maximum of ${MAX_ORDER_LINES} different items can be purchased in one order.`,
          "TOO_MANY_ORDER_LINES"
        );
      }

      /* ===================================================
         CUSTOMER
      =================================================== */

      const customerName =
        cleanString(
          body.customerName
        );

      const customerEmail =
        cleanString(
          body.customerEmail
        ).toLowerCase();

      const customerWhatsapp =
        cleanString(
          body.customerWhatsapp
        );

      const country =
        cleanString(
          body.country
        );

      const stateRegion =
        cleanString(
          body.stateRegion
        );

      const city =
        cleanString(
          body.city
        );

      const street =
        cleanString(
          body.street
        );

      const houseNumber =
        cleanString(
          body.houseNumber
        );

      const addressLine2 =
        cleanString(
          body.addressLine2
        );

      const postalCode =
        cleanString(
          body.postalCode
        );

      const notes =
        cleanString(
          body.notes
        );

      const language:
        Language =
        body.language ===
          "en"
          ? "en"
          : "pt";

      const displayCurrency:
        DisplayCurrency =
        body.displayCurrency ===
          "EUR"
          ? "EUR"
          : "CVE";

      /* ===================================================
         CUSTOMER VALIDATION
      =================================================== */

      if (
        !customerName
      ) {
        return badRequest(
          "Customer name is required.",
          "CUSTOMER_NAME_REQUIRED"
        );
      }

      if (
        !customerWhatsapp
      ) {
        return badRequest(
          "Customer WhatsApp number is required.",
          "CUSTOMER_WHATSAPP_REQUIRED"
        );
      }

      if (
        customerEmail &&
        !isValidEmail(
          customerEmail
        )
      ) {
        return badRequest(
          "Customer email is invalid.",
          "INVALID_CUSTOMER_EMAIL"
        );
      }

      if (
        body.language !==
          "pt" &&
        body.language !==
          "en"
      ) {
        return badRequest(
          "Language must be pt or en.",
          "INVALID_LANGUAGE"
        );
      }

      if (
        body.displayCurrency !==
          "CVE" &&
        body.displayCurrency !==
          "EUR"
      ) {
        return badRequest(
          "Display currency must be CVE or EUR.",
          "INVALID_DISPLAY_CURRENCY"
        );
      }

      /* ===================================================
         DESTINATION
      =================================================== */

      const destination =
        validateDestination(
          country,
          stateRegion
        );

      if (
        !destination.valid
      ) {
        return badRequest(
          destination.message,
          destination.code
        );
      }

      const shippingPrice =
        roundMoney(
          destination
            .shippingPrice
        );

      /* ===================================================
         VALIDATE EVERY CART ITEM
      =================================================== */

      const validatedItems:
        ValidatedCheckoutItem[] =
        [];

      let totalQuantity =
        0;

      for (
        let index = 0;
        index <
        body.items.length;
        index++
      ) {
        const result =
          await validateCheckoutItem(
            supabase,
            body.items[
              index
            ],
            index
          );

        if (
          !result.success
        ) {
          return badRequest(
            result.message,
            result.code
          );
        }

        totalQuantity +=
          result
            .item
            .quantity;

        if (
          totalQuantity >
          MAX_TOTAL_QUANTITY
        ) {
          return badRequest(
            `A maximum of ${MAX_TOTAL_QUANTITY} total units can be purchased in one order.`,
            "TOTAL_QUANTITY_TOO_HIGH"
          );
        }

        validatedItems.push(
          result.item
        );
      }

      /* ===================================================
         AUTHORITATIVE TOTALS
      =================================================== */

      const itemSubtotal =
        roundMoney(
          validatedItems.reduce(
            (
              total,
              item
            ) =>
              total +
              item.lineSubtotal,
            0
          )
        );

      const finalTotal =
        roundMoney(
          itemSubtotal +
            shippingPrice
        );

      if (
        itemSubtotal <= 0 ||
        finalTotal <= 0
      ) {
        return badRequest(
          "The order total is invalid.",
          "INVALID_ORDER_TOTAL"
        );
      }

      /* ===================================================
         DISPLAY CURRENCY
      =================================================== */

      const exchangeRate =
        displayCurrency ===
          "CVE"
          ? EUR_TO_CVE
          : 1;

      const displaySubtotal =
        convertEurForDisplay(
          itemSubtotal,
          displayCurrency
        );

      const displayShippingAmount =
        convertEurForDisplay(
          shippingPrice,
          displayCurrency
        );

      const displayTotalAmount =
        convertEurForDisplay(
          finalTotal,
          displayCurrency
        );

      console.log(
        "Authoritative multi-item Stripe pricing:",
        {
          lines:
            validatedItems.length,

          totalQuantity,

          subtotal:
            itemSubtotal,

          shipping:
            shippingPrice,

          total:
            finalTotal,

          items:
            validatedItems.map(
              (
                item
              ) => ({
                productId:
                  item
                    .product
                    .id,

                variantId:
                  item
                    .variant
                    ?.id ??
                  null,

                productName:
                  item
                    .productName,

                condition:
                  item
                    .condition,

                refurbishedGrade:
                  item
                    .refurbishedGrade,

                batteryGrade:
                  item
                    .batteryGrade,

                baseUnitPrice:
                  item
                    .baseUnitPrice,

                batteryUpgradeAmount:
                  item
                    .batteryUpgradeAmount,

                unitPrice:
                  item
                    .unitPrice,

                quantity:
                  item
                    .quantity,

                lineSubtotal:
                  item
                    .lineSubtotal,
              })
            ),
        }
      );

      /* ===================================================
         POKAPOK IDENTIFIERS
      =================================================== */

      const orderNumber =
        createOrderNumber();

      const paymentReference =
        createPaymentReference();

      /* ===================================================
         LEGACY ORDER COLUMNS
      =================================================== */

      const firstItem =
        validatedItems[0];

      const legacyProductName =
        validatedItems.length ===
          1
          ? firstItem
              .productName
          : `${firstItem.productName} + ${validatedItems.length - 1} more`;

      const legacyDisplayUnitPrice =
        convertEurForDisplay(
          firstItem
            .unitPrice,
          displayCurrency
        );

      /* ===================================================
         CREATE PENDING ORDER
      =================================================== */

      const {
        data:
          orderData,

        error:
          orderInsertError,
      } =
        await supabase
          .from(
            "orders"
          )
          .insert({
            order_number:
              orderNumber,

            payment_reference:
              paymentReference,

            customer_name:
              customerName,

            customer_email:
              customerEmail ||
              null,

            customer_whatsapp:
              customerWhatsapp,

            customer_country:
              country,

            customer_state_region:
              stateRegion,

            customer_city:
              city ||
              null,

            customer_street:
              street ||
              null,

            customer_house_number:
              houseNumber ||
              null,

            customer_address_line_2:
              addressLine2 ||
              null,

            customer_postal_code:
              postalCode ||
              null,

            customer_notes:
              notes ||
              null,

            language,

            product_id:
              firstItem
                .product
                .id,

            variant_id:
              firstItem
                .variant
                ?.id ??
              null,

            product_name:
              legacyProductName,

            storage:
              validatedItems.length ===
                1
                ? firstItem
                    .storage
                : null,

            color:
              validatedItems.length ===
                1
                ? firstItem
                    .color
                : null,

            condition:
              firstItem
                .condition,

            quantity:
              totalQuantity,

            refurbished_grade:
              validatedItems.length ===
                1 &&
              firstItem
                .condition ===
                "refurbished"
                ? firstItem
                    .refurbishedGrade
                : null,

            battery_grade:
              validatedItems.length ===
                1 &&
              firstItem
                .condition ===
                "refurbished"
                ? firstItem
                    .batteryGrade
                : null,

            battery_upgrade_amount:
              validatedItems.reduce(
                (
                  total,
                  item
                ) =>
                  total +
                  (
                    item
                      .batteryUpgradeAmount *
                    item
                      .quantity
                  ),
                0
              ),

            unit_price:
              firstItem
                .unitPrice,

            subtotal:
              itemSubtotal,

            subtotal_amount:
              itemSubtotal,

            shipping_amount:
              shippingPrice,

            insurance_amount:
              0,

            discount_amount:
              0,

            total:
              finalTotal,

            total_amount:
              finalTotal,

            currency:
              SETTLEMENT_CURRENCY,

            display_currency:
              displayCurrency,

            display_unit_price:
              legacyDisplayUnitPrice,

            display_total_amount:
              displayTotalAmount,

            exchange_rate:
              exchangeRate,

            payment_method:
              "stripe",

            payment_status:
              "awaiting_payment",

            order_status:
              "pending",

            status:
              "pending",

            source:
              "website",

            payment_received_at:
              null,

            stripe_checkout_session_id:
              null,

            stripe_payment_intent_id:
              null,

            stripe_payment_status:
              null,

            stripe_payment_method_type:
              null,
          })
          .select(
            `
            id,
            order_number
            `
          )
          .single();

      if (
        orderInsertError
      ) {
        console.error(
          "Pending Stripe order insert error:",
          orderInsertError
        );

        return serverError(
          "Could not create the POKAPOK order.",
          "ORDER_CREATE_FAILED"
        );
      }

      const pendingOrder =
        orderData as
          CreatedOrderRow;

      /* ===================================================
         CREATE ORDER ITEMS
      =================================================== */

      const orderItemsRows =
        validatedItems.map(
          (
            item
          ) => ({
            order_id:
              pendingOrder.id,

            product_id:
              item
                .product
                .id,

            variant_id:
              item
                .variant
                ?.id ??
              null,

            product_name:
              item
                .productName,

            variant_storage:
              item
                .storage,

            variant_color:
              item
                .color,

            condition:
              item
                .condition,

            refurbished_grade:
              item
                .condition ===
                "refurbished"
                ? item
                    .refurbishedGrade
                : null,

            battery_grade:
              item
                .condition ===
                "refurbished"
                ? item
                    .batteryGrade
                : null,

            quantity:
              item
                .quantity,

            base_unit_price:
              item
                .baseUnitPrice,

            battery_upgrade_amount:
              item
                .batteryUpgradeAmount,

            unit_price:
              item
                .unitPrice,

            line_subtotal:
              item
                .lineSubtotal,
          })
        );

      const {
        error:
          orderItemsInsertError,
      } =
        await supabase
          .from(
            "order_items"
          )
          .insert(
            orderItemsRows
          );

      if (
        orderItemsInsertError
      ) {
        console.error(
          "Order items insert error:",
          orderItemsInsertError
        );

        const {
          error:
            cleanupError,
        } =
          await supabase
            .from(
              "orders"
            )
            .delete()
            .eq(
              "id",
              pendingOrder.id
            );

        if (
          cleanupError
        ) {
          console.error(
            "Could not clean up incomplete order:",
            cleanupError
          );
        }

        return serverError(
          "Could not save the items in the POKAPOK order.",
          "ORDER_ITEMS_CREATE_FAILED"
        );
      }

      /* ===================================================
         CREATE STRIPE CHECKOUT SESSION
      =================================================== */

      console.log(
        "Creating multi-item Stripe Checkout session:",
        {
          orderId:
            pendingOrder.id,

          itemCount:
            validatedItems.length,

          totalQuantity,

          total:
            finalTotal,
        }
      );

      let stripeResult;

      try {
        stripeResult =
          await createStripeCheckoutSession(
            stripeSecretKey,
            siteUrl,
            pendingOrder,
            paymentReference,
            validatedItems,
            shippingPrice,
            customerName,
            customerEmail,
            customerWhatsapp,
            country,
            stateRegion,
            language
          );
      } catch (
        error
      ) {
        console.error(
          "Stripe create-session request failed:",
          error
        );

        await supabase
          .from(
            "orders"
          )
          .update({
            payment_status:
              "payment_initialization_unknown",

            stripe_payment_status:
              "CREATE_UNKNOWN",
          })
          .eq(
            "id",
            pendingOrder.id
          );

        throw error;
      }

      const {
        response:
          stripeResponse,

        data:
          stripeData,
      } =
        stripeResult;

      /* ===================================================
         STRIPE ERROR
      =================================================== */

      if (
        !stripeResponse.ok
      ) {
        console.error(
          "Stripe Checkout error:",
          {
            status:
              stripeResponse.status,

            data:
              stripeData,
          }
        );

        await supabase
          .from(
            "orders"
          )
          .update({
            payment_status:
              "payment_initialization_failed",

            stripe_payment_status:
              `CREATE_FAILED_${stripeResponse.status}`,
          })
          .eq(
            "id",
            pendingOrder.id
          );

        return jsonResponse(
          {
            success:
              false,

            error:
              "STRIPE_CHECKOUT_CREATE_FAILED",

            message:
              stripeData
                .error
                ?.message ??
              "Stripe could not create the checkout session.",

            order_id:
              pendingOrder.id,

            order_number:
              orderNumber,

            stripe_http_status:
              stripeResponse.status,
          },
          502
        );
      }

      /* ===================================================
         CHECK REQUIRED STRIPE VALUES
      =================================================== */

      if (
        !stripeData.id
      ) {
        await supabase
          .from(
            "orders"
          )
          .update({
            payment_status:
              "payment_initialization_failed",

            stripe_payment_status:
              "SESSION_ID_MISSING",
          })
          .eq(
            "id",
            pendingOrder.id
          );

        return jsonResponse(
          {
            success:
              false,

            error:
              "STRIPE_SESSION_ID_MISSING",

            message:
              "Stripe did not return a Checkout Session ID.",

            order_id:
              pendingOrder.id,

            order_number:
              orderNumber,
          },
          502
        );
      }

      if (
        !stripeData.url
      ) {
        await supabase
          .from(
            "orders"
          )
          .update({
            payment_status:
              "payment_initialization_failed",

            stripe_payment_status:
              "CHECKOUT_URL_MISSING",
          })
          .eq(
            "id",
            pendingOrder.id
          );

        return jsonResponse(
          {
            success:
              false,

            error:
              "STRIPE_CHECKOUT_URL_MISSING",

            message:
              "Stripe did not return a Checkout URL.",

            order_id:
              pendingOrder.id,

            order_number:
              orderNumber,
          },
          502
        );
      }

      const stripeSessionId =
        stripeData.id;

      const stripePaymentStatus =
        stripeData
          .payment_status ??
        "unpaid";

      const stripePaymentIntentId =
        typeof stripeData
            .payment_intent ===
          "string"
          ? stripeData
              .payment_intent
          : null;

      /* ===================================================
         LINK STRIPE → POKAPOK
      =================================================== */

      const {
        error:
          orderUpdateError,
      } =
        await supabase
          .from(
            "orders"
          )
          .update({
            stripe_checkout_session_id:
              stripeSessionId,

            stripe_payment_intent_id:
              stripePaymentIntentId,

            stripe_payment_status:
              stripePaymentStatus,

            payment_status:
              "awaiting_payment",
          })
          .eq(
            "id",
            pendingOrder.id
          );

      if (
        orderUpdateError
      ) {
        console.error(
          "Could not save Stripe Checkout Session:",
          orderUpdateError
        );

        return serverError(
          "Stripe Checkout was created, but the POKAPOK order could not be linked.",
          "STRIPE_ORDER_LINK_FAILED"
        );
      }

      console.log(
        "Stripe multi-item Checkout linked:",
        {
          pokapokOrderId:
            pendingOrder.id,

          orderNumber,

          stripeSessionId,

          stripePaymentIntentId,

          stripePaymentStatus,

          itemCount:
            validatedItems.length,

          totalQuantity,

          finalTotal,
        }
      );

      /* ===================================================
         SUCCESS RESPONSE ITEMS
      =================================================== */

      const responseItems =
        validatedItems.map(
          (
            item
          ) => ({
            product_id:
              item
                .product
                .id,

            variant_id:
              item
                .variant
                ?.id ??
              null,

            product_name:
              item
                .productName,

            storage:
              item
                .storage,

            color:
              item
                .color,

            condition:
              item
                .condition,

            refurbished_grade:
              item
                .refurbishedGrade,

            battery_grade:
              item
                .batteryGrade,

            quantity:
              item
                .quantity,

            base_unit_price:
              item
                .baseUnitPrice,

            battery_upgrade_amount:
              item
                .batteryUpgradeAmount,

            unit_price:
              item
                .unitPrice,

            line_subtotal:
              item
                .lineSubtotal,

            display_unit_price:
              convertEurForDisplay(
                item
                  .unitPrice,
                displayCurrency
              ),

            display_line_subtotal:
              convertEurForDisplay(
                item
                  .lineSubtotal,
                displayCurrency
              ),
          })
        );

      /* ===================================================
         SUCCESS
      =================================================== */

      return jsonResponse({
        success:
          true,

        order_id:
          pendingOrder.id,

        order_number:
          orderNumber,

        payment_reference:
          paymentReference,

        stripe_checkout_session_id:
          stripeSessionId,

        stripe_payment_intent_id:
          stripePaymentIntentId,

        stripe_payment_status:
          stripePaymentStatus,

        checkout_url:
          stripeData.url,

        pricing: {
          currency:
            SETTLEMENT_CURRENCY,

          item_subtotal:
            itemSubtotal,

          shipping_amount:
            shippingPrice,

          total_amount:
            finalTotal,

          display_currency:
            displayCurrency,

          display_subtotal:
            displaySubtotal,

          display_shipping_amount:
            displayShippingAmount,

          display_total_amount:
            displayTotalAmount,

          exchange_rate:
            exchangeRate,

          item_count:
            validatedItems.length,

          total_quantity:
            totalQuantity,

          items:
            responseItems,
        },

        shipping: {
          country,

          state_region:
            stateRegion,

          amount:
            shippingPrice,

          currency:
            SETTLEMENT_CURRENCY,

          display_amount:
            displayShippingAmount,

          display_currency:
            displayCurrency,
        },

        items:
          responseItems,
      });
    } catch (
      error
    ) {
      console.error(
        "create-stripe-checkout error:",
        error
      );

      if (
        error instanceof
          DOMException &&
        error.name ===
          "TimeoutError"
      ) {
        return jsonResponse(
          {
            success:
              false,

            error:
              "STRIPE_TIMEOUT",

            message:
              "Stripe did not respond in time.",
          },
          504
        );
      }

      const code =
        error instanceof
          Error
          ? error.message
          : "UNKNOWN_ERROR";

      return serverError(
        "Could not create Stripe Checkout.",
        code
      );
    }
  }
);