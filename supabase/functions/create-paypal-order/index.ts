import { createClient } from "@supabase/supabase-js";

/* =========================================================
   TYPES
========================================================= */

type SellCondition =
  | "new"
  | "refurbished";

  type SupabaseServerClient = {
  from: (
    table:
      string
  ) => unknown;
};

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
  productId?:
    string;

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

  /* CUSTOMER */

  customerName?:
    string;

  customerEmail?:
    | string
    | null;

  customerWhatsapp?:
    string;

  /* DELIVERY */

  country?:
    string;

  stateRegion?:
    string;

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

  /* ORDER */

  notes?:
    | string
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

  /* NEW */

  sale_price:
    | number
    | string
    | null;

  promotional_price:
    | number
    | string
    | null;

  /* LEGACY GENERIC REFURBISHED */

  refurbished_sale_price:
    | number
    | string
    | null;

  refurbished_promotional_price:
    | number
    | string
    | null;

  /* AUTHORITATIVE REFURBISHED GRADE PRICING */

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

type ValidatedOrderItem = {
  product:
    ProductRow;

  variant:
    | VariantRow
    | null;

  productId:
    string;

  variantId:
    | string
    | null;

  productName:
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

  displayUnitPrice:
    number;

  displayLineSubtotal:
    number;
};

type PayPalOrderResponse = {
  id?:
    string;

  status?:
    string;

  raw?:
    string;

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

function formatMoney(
  value:
    number
) {
  return roundMoney(
    value
  ).toFixed(
    2
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
  if (
    !country
  ) {
    return {
      valid:
        false,

      code:
        "COUNTRY_REQUIRED",

      message:
        "Shipping country is required.",
    };
  }

  if (
    !stateRegion
  ) {
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
   PAYPAL
========================================================= */

function getPayPalBaseUrl() {
  const environment =
    (
      Deno.env.get(
        "PAYPAL_ENV"
      ) ??
      "sandbox"
    )
      .trim()
      .toLowerCase();

  if (
    environment ===
      "live"
  ) {
    return "https://api-m.paypal.com";
  }

  return "https://api-m.sandbox.paypal.com";
}

async function getPayPalAccessToken() {
  const clientId =
    Deno.env.get(
      "PAYPAL_CLIENT_ID"
    );

  const clientSecret =
    Deno.env.get(
      "PAYPAL_CLIENT_SECRET"
    );

  if (
    !clientId ||
    !clientSecret
  ) {
    throw new Error(
      "PAYPAL_CREDENTIALS_MISSING"
    );
  }

  const basicAuth =
    btoa(
      `${clientId}:${clientSecret}`
    );

  console.log(
    "Requesting PayPal access token..."
  );

  const response =
    await fetch(
      `${getPayPalBaseUrl()}/v1/oauth2/token`,
      {
        method:
          "POST",

        headers: {
          Authorization:
            `Basic ${basicAuth}`,

          "Content-Type":
            "application/x-www-form-urlencoded",
        },

        body:
          "grant_type=client_credentials",

        signal:
          AbortSignal.timeout(
            10000
          ),
      }
    );

  const responseText =
    await response.text();

  let data:
    Record<
      string,
      unknown
    > = {};

  try {
    data =
      responseText
        ? JSON.parse(
            responseText
          ) as Record<
            string,
            unknown
          >
        : {};
  } catch {
    data = {
      raw:
        responseText,
    };
  }

  const accessToken =
    typeof data
        .access_token ===
      "string"
      ? data
          .access_token
      : null;

  if (
    !response.ok ||
    !accessToken
  ) {
    console.error(
      "PayPal OAuth error:",
      {
        status:
          response.status,

        data,
      }
    );

    throw new Error(
      "PAYPAL_AUTH_FAILED"
    );
  }

  return accessToken;
}

/* =========================================================
   PAYPAL ITEM DESCRIPTION
========================================================= */

function buildItemName(
  item:
    ValidatedOrderItem
) {
  const storage =
    item.storage
      ?.trim();

  if (
    storage
  ) {
    return `${item.productName} ${storage}`.slice(
      0,
      127
    );
  }

  return item.productName.slice(
    0,
    127
  );
}

function buildItemDescription(
  item:
    ValidatedOrderItem
) {
  const pieces:
    string[] = [];

  if (
    item.color
      ?.trim()
  ) {
    pieces.push(
      item.color.trim()
    );
  }

  if (
    item.condition ===
      "refurbished"
  ) {
    pieces.push(
      "Refurbished"
    );

    if (
      item.refurbishedGrade
    ) {
      pieces.push(
        getRefurbishedGradeLabel(
          item.refurbishedGrade
        )
      );
    }

    if (
      item.batteryGrade
    ) {
      pieces.push(
        getBatteryGradeLabel(
          item.batteryGrade
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
      127
    );
}

/* =========================================================
   VALIDATE + PRICE ONE ITEM
========================================================= */



async function validateOrderItem(
  supabase:
    SupabaseServerClient,

  rawItem:
    RequestItem,

  displayCurrency:
    DisplayCurrency
): Promise<
  ValidatedOrderItem
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
      rawItem.refurbishedGrade
    )
      ? rawItem.refurbishedGrade
      : null;

  const batteryGrade =
    isValidBatteryGrade(
      rawItem.batteryGrade
    )
      ? rawItem.batteryGrade
      : null;

  /* =======================================================
     BASIC VALIDATION
  ======================================================= */

  if (
    !productId
  ) {
    throw new Error(
      "PRODUCT_REQUIRED"
    );
  }

  if (
    condition !==
      "new" &&
    condition !==
      "refurbished"
  ) {
    throw new Error(
      "INVALID_CONDITION"
    );
  }

  if (
    !Number.isInteger(
      quantity
    ) ||
    quantity < 1 ||
    quantity >
      MAX_QUANTITY_PER_LINE
  ) {
    throw new Error(
      "INVALID_QUANTITY"
    );
  }

  if (
    condition ===
      "refurbished" &&
    !variantId
  ) {
    throw new Error(
      "REFURBISHED_VARIANT_REQUIRED"
    );
  }

  if (
    condition ===
      "refurbished" &&
    !refurbishedGrade
  ) {
    throw new Error(
      "REFURBISHED_GRADE_REQUIRED"
    );
  }

  if (
    condition ===
      "refurbished" &&
    !batteryGrade
  ) {
    throw new Error(
      "BATTERY_GRADE_REQUIRED"
    );
  }

  if (
    condition ===
      "new" &&
    (
      rawItem.refurbishedGrade !=
        null ||
      rawItem.batteryGrade !=
        null
    )
  ) {
    throw new Error(
      "INVALID_NEW_PRODUCT_CONFIGURATION"
    );
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
      productError
    );

    throw new Error(
      "PRODUCT_QUERY_FAILED"
    );
  }

  const product =
    productData as
      | ProductRow
      | null;

  if (
    !product
  ) {
    throw new Error(
      "PRODUCT_NOT_FOUND"
    );
  }

  if (
    !product.published ||
    !product.available
  ) {
    throw new Error(
      "PRODUCT_UNAVAILABLE"
    );
  }

  if (
    condition ===
      "new" &&
    !productCanBeSoldNew(
      product
    )
  ) {
    throw new Error(
      "NEW_NOT_AVAILABLE"
    );
  }

  if (
    condition ===
      "refurbished" &&
    !productCanBeSoldRefurbished(
      product
    )
  ) {
    throw new Error(
      "REFURBISHED_NOT_AVAILABLE"
    );
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
        variantError
      );

      throw new Error(
        "VARIANT_QUERY_FAILED"
      );
    }

    variant =
      variantData as
        | VariantRow
        | null;

    if (
      !variant
    ) {
      throw new Error(
        "VARIANT_NOT_FOUND"
      );
    }

    if (
      !variant.available
    ) {
      throw new Error(
        "VARIANT_UNAVAILABLE"
      );
    }
  }

  /* =======================================================
     AUTHORITATIVE BASE PRICE
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
      throw new Error(
        "REFURBISHED_CONFIGURATION_REQUIRED"
      );
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
    baseUnitPrice <=
      0
  ) {
    throw new Error(
      "PRICE_NOT_AVAILABLE"
    );
  }

  const safeBaseUnitPrice =
    roundMoney(
      baseUnitPrice
    );

  /* =======================================================
     BATTERY SURCHARGE
  ======================================================= */

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
    product,

    variant,

    productId:
      product.id,

    variantId:
      variant
        ?.id ??
      null,

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

    sku:
      variant
        ?.sku
        ? cleanString(
            variant.sku
          )
        : null,

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

    displayUnitPrice:
      convertEurForDisplay(
        safeUnitPrice,
        displayCurrency
      ),

    displayLineSubtotal:
      convertEurForDisplay(
        lineSubtotal,
        displayCurrency
      ),
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
        "create-paypal-order started"
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

      if (
        !supabaseUrl ||
        !serviceRoleKey
      ) {
        return serverError(
          "Supabase server configuration is missing.",
          "SUPABASE_CONFIGURATION_MISSING"
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
         ITEMS VALIDATION
      =================================================== */

      if (
        !Array.isArray(
          body.items
        ) ||
        body.items.length ===
          0
      ) {
        return badRequest(
          "At least one order item is required.",
          "ITEMS_REQUIRED"
        );
      }

      if (
        body.items.length >
        MAX_ORDER_LINES
      ) {
        return badRequest(
          `A maximum of ${MAX_ORDER_LINES} order lines is allowed.`,
          "TOO_MANY_ORDER_LINES"
        );
      }

      /* ===================================================
         DESTINATION + SHIPPING
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
         VALIDATE + PRICE ALL ITEMS
      =================================================== */

      const validatedItems:
        ValidatedOrderItem[] =
        [];

      let totalQuantity =
        0;

      for (
        let index = 0;
        index <
        body.items.length;
        index += 1
      ) {
        const rawItem =
          body.items[
            index
          ];

        try {
          const validated =
            await validateOrderItem(
              supabase,
              rawItem,
              displayCurrency
            );

          totalQuantity +=
            validated.quantity;

          if (
            totalQuantity >
            MAX_TOTAL_QUANTITY
          ) {
            return badRequest(
              `A maximum total quantity of ${MAX_TOTAL_QUANTITY} items is allowed.`,
              "TOTAL_QUANTITY_TOO_HIGH"
            );
          }

          validatedItems.push(
            validated
          );
        } catch (
          error
        ) {
          const code =
            error instanceof
              Error
              ? error.message
              : "ITEM_VALIDATION_FAILED";

          console.error(
            "PayPal order item validation failed:",
            {
              index,
              code,
              rawItem,
            }
          );

          return badRequest(
            `Order item ${index + 1} is invalid.`,
            code
          );
        }
      }

      /* ===================================================
         TOTALS
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

      const totalBatteryUpgradeAmount =
        roundMoney(
          validatedItems.reduce(
            (
              total,
              item
            ) =>
              total +
              (
                item
                  .batteryUpgradeAmount *
                item.quantity
              ),
            0
          )
        );

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

      /* ===================================================
         LEGACY PARENT VALUES

         orders still contains single-product columns.
         Keep first item there for dashboard compatibility.
      =================================================== */

      const firstItem =
        validatedItems[0];

      const parentProductName =
        validatedItems.length ===
          1
          ? firstItem.productName
          : `${firstItem.productName} + ${validatedItems.length - 1} more`;

      const parentStorage =
        validatedItems.length ===
          1
          ? firstItem.storage
          : null;

      const parentColor =
        validatedItems.length ===
          1
          ? firstItem.color
          : null;

      const parentRefurbishedGrade =
        validatedItems.length ===
          1
          ? firstItem
              .refurbishedGrade
          : null;

      const parentBatteryGrade =
        validatedItems.length ===
          1
          ? firstItem
              .batteryGrade
          : null;

      console.log(
        "Authoritative multi-item PayPal pricing:",
        {
          itemCount:
            validatedItems.length,

          totalQuantity,

          itemSubtotal,

          shipping:
            shippingPrice,

          total:
            finalTotal,

          displayCurrency,

          displayTotalAmount,

          exchangeRate,
        }
      );

      /* ===================================================
         IDENTIFIERS
      =================================================== */

      const orderNumber =
        createOrderNumber();

      const paymentReference =
        createPaymentReference();

      /* ===================================================
         CREATE PENDING PARENT ORDER
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

            /*
             * Legacy parent product columns.
             */
            product_id:
              firstItem.productId,

            variant_id:
              firstItem.variantId,

            product_name:
              parentProductName,

            storage:
              parentStorage,

            color:
              parentColor,

            condition:
              firstItem.condition,

            quantity:
              totalQuantity,

            refurbished_grade:
              parentRefurbishedGrade,

            battery_grade:
              parentBatteryGrade,

            /*
             * Aggregate battery surcharge across the order.
             */
            battery_upgrade_amount:
              totalBatteryUpgradeAmount,

            /*
             * Legacy first-line unit price.
             */
            unit_price:
              firstItem.unitPrice,

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

            /*
             * Legacy display unit price = first line.
             */
            display_unit_price:
              firstItem
                .displayUnitPrice,

            display_total_amount:
              displayTotalAmount,

            exchange_rate:
              exchangeRate,

            payment_method:
              "paypal",

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

            paypal_order_id:
              null,

            paypal_capture_id:
              null,

            paypal_status:
              null,

            paypal_payer_id:
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
          "Pending PayPal order insert error:",
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

      const orderItemRows =
        validatedItems.map(
          (
            item
          ) => ({
            order_id:
              pendingOrder.id,

            product_id:
              item.productId,

            variant_id:
              item.variantId,

            product_name:
              item.productName,

            variant_storage:
              item.storage,

            variant_color:
              item.color,

            condition:
              item.condition,

            refurbished_grade:
              item.refurbishedGrade,

            battery_grade:
              item.batteryGrade,

            quantity:
              item.quantity,

            base_unit_price:
              item.baseUnitPrice,

            battery_upgrade_amount:
              item.batteryUpgradeAmount,

            unit_price:
              item.unitPrice,

            line_subtotal:
              item.lineSubtotal,
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
            orderItemRows
          );

      if (
        orderItemsInsertError
      ) {
        console.error(
          "PayPal order_items insert error:",
          orderItemsInsertError
        );

        /*
         * Roll back parent because the order would otherwise
         * be incomplete.
         */
        const {
          error:
            rollbackError,
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
          rollbackError
        ) {
          console.error(
            "Could not roll back incomplete PayPal parent order:",
            rollbackError
          );
        }

        return serverError(
          "Could not save the order items.",
          "ORDER_ITEMS_CREATE_FAILED"
        );
      }

      console.log(
        "Pending multi-item POKAPOK PayPal order created:",
        {
          id:
            pendingOrder.id,

          orderNumber:
            pendingOrder.order_number,

          itemCount:
            validatedItems.length,

          totalQuantity,

          total:
            finalTotal,
        }
      );

      /* ===================================================
         PAYPAL AUTH
      =================================================== */

      let accessToken:
        string;

      try {
        accessToken =
          await getPayPalAccessToken();
      } catch (
        error
      ) {
        await supabase
          .from(
            "orders"
          )
          .update({
            payment_status:
              "payment_initialization_failed",

            paypal_status:
              "AUTH_FAILED",
          })
          .eq(
            "id",
            pendingOrder.id
          );

        throw error;
      }

      /* ===================================================
         PAYPAL AMOUNTS
      =================================================== */

      const itemSubtotalText =
        formatMoney(
          itemSubtotal
        );

      const shippingPriceText =
        formatMoney(
          shippingPrice
        );

      const finalTotalText =
        formatMoney(
          finalTotal
        );

      /* ===================================================
         PAYPAL ITEMS
      =================================================== */

      const paypalItems =
        validatedItems.map(
          (
            item
          ) => ({
            name:
              buildItemName(
                item
              ),

            description:
              buildItemDescription(
                item
              ),

            sku:
              (
                item.sku ||
                item.product.slug
              ).slice(
                0,
                127
              ),

            quantity:
              String(
                item.quantity
              ),

            category:
              "PHYSICAL_GOODS",

            unit_amount: {
              currency_code:
                SETTLEMENT_CURRENCY,

              value:
                formatMoney(
                  item.unitPrice
                ),
            },
          })
        );

      /* ===================================================
         PAYPAL DESCRIPTION
      =================================================== */

      const purchaseDescription =
        validatedItems.length ===
          1
          ? `POKAPOK · ${buildItemName(
              firstItem
            )}`
          : `POKAPOK · ${validatedItems.length} order items`;

      /* ===================================================
         CREATE PAYPAL ORDER
      =================================================== */

      console.log(
        "Creating multi-item PayPal order for:",
        pendingOrder.id
      );

      let paypalResponse:
        Response;

      try {
        paypalResponse =
          await fetch(
            `${getPayPalBaseUrl()}/v2/checkout/orders`,
            {
              method:
                "POST",

              headers: {
                Authorization:
                  `Bearer ${accessToken}`,

                "Content-Type":
                  "application/json",

                "PayPal-Request-Id":
                  `pokapok-create-${pendingOrder.id}`,
              },

              signal:
                AbortSignal.timeout(
                  10000
                ),

              body:
                JSON.stringify({
                  intent:
                    "CAPTURE",

                  purchase_units: [
                    {
                      reference_id:
                        pendingOrder.id,

                      custom_id:
                        pendingOrder.id,

                      invoice_id:
                        orderNumber,

                      description:
                        purchaseDescription.slice(
                          0,
                          127
                        ),

                      amount: {
                        currency_code:
                          SETTLEMENT_CURRENCY,

                        value:
                          finalTotalText,

                        breakdown: {
                          item_total: {
                            currency_code:
                              SETTLEMENT_CURRENCY,

                            value:
                              itemSubtotalText,
                          },

                          shipping: {
                            currency_code:
                              SETTLEMENT_CURRENCY,

                            value:
                              shippingPriceText,
                          },
                        },
                      },

                      items:
                        paypalItems,
                    },
                  ],
                }),
            }
          );
      } catch (
        error
      ) {
        console.error(
          "PayPal create request failed:",
          error
        );

        await supabase
          .from(
            "orders"
          )
          .update({
            payment_status:
              "payment_initialization_unknown",

            paypal_status:
              "CREATE_UNKNOWN",
          })
          .eq(
            "id",
            pendingOrder.id
          );

        throw error;
      }

      /* ===================================================
         PAYPAL RESPONSE
      =================================================== */

      const paypalText =
        await paypalResponse
          .text();

      let paypalData:
        PayPalOrderResponse =
        {};

      try {
        paypalData =
          paypalText
            ? JSON.parse(
                paypalText
              ) as
                PayPalOrderResponse
            : {};
      } catch {
        paypalData = {
          raw:
            paypalText,
        };
      }

      if (
        !paypalResponse.ok
      ) {
        console.error(
          "PayPal create-order error:",
          {
            status:
              paypalResponse
                .status,

            data:
              paypalData,
          }
        );

        await supabase
          .from(
            "orders"
          )
          .update({
            payment_status:
              "payment_initialization_failed",

            paypal_status:
              `CREATE_FAILED_${paypalResponse.status}`,
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
              "PAYPAL_CREATE_ORDER_FAILED",

            message:
              "PayPal could not create the payment order.",

            order_id:
              pendingOrder.id,

            order_number:
              orderNumber,

            paypal_http_status:
              paypalResponse.status,

            paypal:
              paypalData,
          },
          502
        );
      }

      if (
        !paypalData.id
      ) {
        await supabase
          .from(
            "orders"
          )
          .update({
            payment_status:
              "payment_initialization_failed",

            paypal_status:
              "ORDER_ID_MISSING",
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
              "PAYPAL_ORDER_ID_MISSING",

            message:
              "PayPal did not return an order ID.",

            order_id:
              pendingOrder.id,

            order_number:
              orderNumber,
          },
          502
        );
      }

      const paypalOrderId =
        paypalData.id;

      const paypalStatus =
        paypalData.status ??
        "CREATED";

      /* ===================================================
         LINK PAYPAL → POKAPOK ORDER
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
            paypal_order_id:
              paypalOrderId,

            paypal_status:
              paypalStatus,

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
          "Could not save PayPal order ID:",
          orderUpdateError
        );

        return serverError(
          "PayPal was created, but the POKAPOK order could not be linked.",
          "PAYPAL_ORDER_LINK_FAILED"
        );
      }

      console.log(
        "Multi-item PayPal order linked:",
        {
          pokapokOrderId:
            pendingOrder.id,

          orderNumber,

          paypalOrderId,

          paypalStatus,

          itemCount:
            validatedItems.length,

          totalQuantity,

          itemSubtotal,

          shippingPrice,

          finalTotal,

          displayCurrency,

          displayTotalAmount,

          exchangeRate,
        }
      );

      /* ===================================================
         RESPONSE ITEMS
      =================================================== */

      const responseItems =
        validatedItems.map(
          (
            item
          ) => ({
            product_id:
              item.productId,

            variant_id:
              item.variantId,

            product_name:
              item.productName,

            storage:
              item.storage,

            color:
              item.color,

            sku:
              item.sku,

            condition:
              item.condition,

            refurbished_grade:
              item.refurbishedGrade,

            battery_grade:
              item.batteryGrade,

            battery_upgrade_amount:
              item.batteryUpgradeAmount,

            base_unit_price:
              item.baseUnitPrice,

            unit_price:
              item.unitPrice,

            quantity:
              item.quantity,

            line_subtotal:
              item.lineSubtotal,

            display_unit_price:
              item.displayUnitPrice,

            display_line_subtotal:
              item.displayLineSubtotal,
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

        paypal_order_id:
          paypalOrderId,

        paypal_status:
          paypalStatus,

        items:
          responseItems,

        pricing: {
          currency:
            SETTLEMENT_CURRENCY,

          /*
           * Full merchandise subtotal before shipping.
           */
          item_subtotal:
            itemSubtotal,

          /*
           * Alias used by capture / existing checkout.
           */
          subtotal_amount:
            itemSubtotal,

          shipping_amount:
            shippingPrice,

          total_amount:
            finalTotal,

          /*
           * Total number of physical units.
           */
          quantity:
            totalQuantity,

          /*
           * Number of distinct order lines.
           */
          item_count:
            validatedItems.length,

          /*
           * Legacy first-item value.
           */
          base_unit_price:
            firstItem
              .baseUnitPrice,

          battery_upgrade_amount:
            totalBatteryUpgradeAmount,

          unit_price:
            firstItem
              .unitPrice,

          display_currency:
            displayCurrency,

          /*
           * Legacy first-item display price.
           */
          display_unit_price:
            firstItem
              .displayUnitPrice,

          display_subtotal:
            displaySubtotal,

          display_subtotal_amount:
            displaySubtotal,

          display_shipping_amount:
            displayShippingAmount,

          display_total_amount:
            displayTotalAmount,

          exchange_rate:
            exchangeRate,

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
      });
    } catch (
      error
    ) {
      console.error(
        "create-paypal-order error:",
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
              "PAYPAL_TIMEOUT",

            message:
              "PayPal did not respond in time.",
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
        "Could not create PayPal order.",
        code
      );
    }
  }
);