import { createClient } from "@supabase/supabase-js";

/* =========================================================
   TYPES
========================================================= */

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

type RequestBody = {
  productId?: string;

  variantId?:
    | string
    | null;

  condition?:
    SellCondition;

  quantity?:
    number;

  /* REFURBISHED CONFIG */

  refurbishedGrade?:
    | RefurbishedGrade
    | null;

  batteryGrade?:
    | BatteryGrade
    | null;

  /* CUSTOMER */

  customerName?:
    string;

  customerEmail?:
    string
    | null;

  customerWhatsapp?:
    string;

  /* DELIVERY */

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

  /* ORDER */

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
   CURRENCY
========================================================= */

const EUR_TO_CVE =
  110.265;

const SETTLEMENT_CURRENCY =
  "EUR";

/* =========================================================
   REFURBISHED
========================================================= */

/*
 * This is intentionally defined on the server.
 *
 * The frontend only sends:
 *
 * batteryGrade = "new"
 *
 * It never tells the server what the surcharge costs.
 */
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

/*
 * Cosmetic-grade prices are authoritative.
 *
 * There is deliberately NO multiplier and NO locally
 * invented grade price.
 *
 * The exact Supabase columns are selected depending on
 * the requested grade.
 */
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
   REFURBISHED LABELS
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
   PAYPAL DESCRIPTION
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
      127
    );
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

      const productId =
        cleanString(
          body.productId
        );

      const variantId =
        cleanString(
          body.variantId
        ) ||
        null;

      const condition =
        body.condition;

      const quantity =
        Number(
          body.quantity ??
            1
        );

      /*
       * These are only selections.
       *
       * Their prices are determined below by this server.
       */
      const refurbishedGrade =
        isValidRefurbishedGrade(
          body.refurbishedGrade
        )
          ? body.refurbishedGrade
          : null;

      const batteryGrade =
        isValidBatteryGrade(
          body.batteryGrade
        )
          ? body.batteryGrade
          : null;

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
         BASIC VALIDATION
      =================================================== */

      if (!productId) {
        return badRequest(
          "Product ID is required.",
          "PRODUCT_REQUIRED"
        );
      }

      if (
        condition !==
          "new" &&
        condition !==
          "refurbished"
      ) {
        return badRequest(
          "A valid product condition is required.",
          "INVALID_CONDITION"
        );
      }

      if (
        !Number.isInteger(
          quantity
        ) ||
        quantity < 1 ||
        quantity > 10
      ) {
        return badRequest(
          "Quantity must be between 1 and 10.",
          "INVALID_QUANTITY"
        );
      }

      /* ===================================================
         REFURBISHED VALIDATION
      =================================================== */

      if (
        condition ===
          "refurbished" &&
        !variantId
      ) {
        return badRequest(
          "A variant is required for refurbished products.",
          "REFURBISHED_VARIANT_REQUIRED"
        );
      }

      if (
        condition ===
          "refurbished" &&
        !refurbishedGrade
      ) {
        return badRequest(
          "A valid refurbished cosmetic grade is required.",
          "REFURBISHED_GRADE_REQUIRED"
        );
      }

      if (
        condition ===
          "refurbished" &&
        !batteryGrade
      ) {
        return badRequest(
          "A valid refurbished battery option is required.",
          "BATTERY_GRADE_REQUIRED"
        );
      }

      /*
       * New products are not allowed to sneak in refurbished
       * configuration values.
       */
      if (
        condition ===
          "new" &&
        (
          body.refurbishedGrade !=
            null ||
          body.batteryGrade !=
            null
        )
      ) {
        return badRequest(
          "Refurbished configuration cannot be used for a new product.",
          "INVALID_NEW_PRODUCT_CONFIGURATION"
        );
      }

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
         PRODUCT
      =================================================== */

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

        return serverError(
          "Could not read product.",
          "PRODUCT_QUERY_FAILED"
        );
      }

      const product =
        productData as
          | ProductRow
          | null;

      if (!product) {
        return badRequest(
          "Product not found.",
          "PRODUCT_NOT_FOUND"
        );
      }

      if (
        !product.published ||
        !product.available
      ) {
        return badRequest(
          "This product is not currently available.",
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
        return badRequest(
          "This product is not available as new.",
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
        return badRequest(
          "This product is not available as refurbished.",
          "REFURBISHED_NOT_AVAILABLE"
        );
      }

      /* ===================================================
         VARIANT
      =================================================== */

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

          return serverError(
            "Could not read product variant.",
            "VARIANT_QUERY_FAILED"
          );
        }

        variant =
          variantData as
            | VariantRow
            | null;

        if (!variant) {
          return badRequest(
            "Product variant not found.",
            "VARIANT_NOT_FOUND"
          );
        }

        if (
          !variant.available
        ) {
          return badRequest(
            "This product variant is not currently available.",
            "VARIANT_UNAVAILABLE"
          );
        }
      }

      /* ===================================================
         AUTHORITATIVE SERVER PRICE
      =================================================== */

      let baseUnitPrice:
        number | null =
        null;

      /*
       * NEW
       *
       * Existing new-device pricing remains unchanged.
       */
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

      /*
       * REFURBISHED
       *
       * The server ignores any unitPrice from the browser.
       *
       * It reads the exact selected grade price directly
       * from the matching Supabase product_variants row.
       */
      if (
        condition ===
          "refurbished"
      ) {
        if (
          !variant ||
          !refurbishedGrade
        ) {
          return badRequest(
            "A valid variant and refurbished grade are required.",
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
        baseUnitPrice <= 0
      ) {
        return badRequest(
          condition ===
            "refurbished"
            ? "No valid price is configured for this refurbished cosmetic grade."
            : "No valid selling price is configured for this product.",
          "PRICE_NOT_AVAILABLE"
        );
      }

      const safeBaseUnitPrice =
        roundMoney(
          baseUnitPrice
        );

      /* ===================================================
         AUTHORITATIVE BATTERY SURCHARGE
      =================================================== */

      const batteryUpgradeAmount =
        condition ===
          "refurbished" &&
        batteryGrade ===
          "new"
          ? NEW_BATTERY_SURCHARGE
          : 0;

      /*
       * This is the final per-device selling price.
       *
       * Example:
       *
       * Excellent Supabase price = €500
       * New battery            = €89
       *
       * Final unit price       = €589
       */
      const safeUnitPrice =
        roundMoney(
          safeBaseUnitPrice +
            batteryUpgradeAmount
        );

      const itemSubtotal =
        roundMoney(
          safeUnitPrice *
            quantity
        );

      const finalTotal =
        roundMoney(
          itemSubtotal +
            shippingPrice
        );

      /* ===================================================
         DISPLAY CURRENCY
      =================================================== */

      const exchangeRate =
        displayCurrency ===
          "CVE"
          ? EUR_TO_CVE
          : 1;

      const displayUnitPrice =
        convertEurForDisplay(
          safeUnitPrice,
          displayCurrency
        );

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

      const productName =
        cleanString(
          product.name
        );

      const storage =
        variant
          ?.storage
          ? cleanString(
              variant.storage
            )
          : null;

      const color =
        variant
          ?.color
          ? cleanString(
              variant.color
            )
          : null;

      /* ===================================================
         SERVER PRICE LOG
      =================================================== */

      console.log(
        "Authoritative PayPal pricing:",
        {
          productId:
            product.id,

          variantId:
            variant
              ?.id ??
            null,

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

          baseUnitPrice:
            safeBaseUnitPrice,

          batteryUpgradeAmount,

          finalUnitPrice:
            safeUnitPrice,

          quantity,

          subtotal:
            itemSubtotal,

          shipping:
            shippingPrice,

          total:
            finalTotal,
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
         CREATE PENDING POKAPOK ORDER
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
              product.id,

            variant_id:
              variant
                ?.id ??
              null,

            product_name:
              productName,

            storage,

            color,

            condition,

            quantity,

            /*
             * NEW REFURBISHED CONFIGURATION
             */
            refurbished_grade:
              condition ===
                "refurbished"
                ? refurbishedGrade
                : null,

            battery_grade:
              condition ===
                "refurbished"
                ? batteryGrade
                : null,

            battery_upgrade_amount:
              batteryUpgradeAmount,

            /*
             * unit_price is the FINAL unit price including
             * the battery upgrade when selected.
             */
            unit_price:
              safeUnitPrice,

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
              displayUnitPrice,

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

      console.log(
        "Pending POKAPOK order created:",
        {
          id:
            pendingOrder.id,

          orderNumber:
            pendingOrder.order_number,

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
         PAYPAL DISPLAY VALUES
      =================================================== */

      const unitPriceText =
        formatMoney(
          safeUnitPrice
        );

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

      const itemName =
        buildItemName(
          product,
          variant
        );

      const itemDescription =
        buildItemDescription(
          variant,
          condition,
          condition ===
              "refurbished"
            ? refurbishedGrade
            : null,
          condition ===
              "refurbished"
            ? batteryGrade
            : null
        );

      /* ===================================================
         CREATE PAYPAL ORDER
      =================================================== */

      console.log(
        "Creating PayPal order for:",
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
                        `POKAPOK · ${itemName}`.slice(
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

                      items: [
                        {
                          name:
                            itemName,

                          description:
                            itemDescription,

                          sku:
                            (
                              variant
                                ?.sku ||
                              product.slug
                            ).slice(
                              0,
                              127
                            ),

                          quantity:
                            String(
                              quantity
                            ),

                          category:
                            "PHYSICAL_GOODS",

                          /*
                           * PayPal receives the server-calculated
                           * final unit price, including +€89 when
                           * the new-battery option was selected.
                           */
                          unit_amount: {
                            currency_code:
                              SETTLEMENT_CURRENCY,

                            value:
                              unitPriceText,
                          },
                        },
                      ],
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
        PayPalOrderResponse = {};

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
        "PayPal order linked:",
        {
          pokapokOrderId:
            pendingOrder.id,

          orderNumber,

          paypalOrderId,

          paypalStatus,

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

          batteryUpgradeAmount,

          finalUnitPrice:
            safeUnitPrice,

          finalTotal,
        }
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

        pricing: {
          currency:
            SETTLEMENT_CURRENCY,

          /*
           * Cosmetic-grade base price before battery.
           */
          base_unit_price:
            safeBaseUnitPrice,

          battery_upgrade_amount:
            batteryUpgradeAmount,

          /*
           * Final price PayPal actually charges per device.
           */
          unit_price:
            safeUnitPrice,

          quantity,

          item_subtotal:
            itemSubtotal,

          shipping_amount:
            shippingPrice,

          total_amount:
            finalTotal,

          display_currency:
            displayCurrency,

          display_unit_price:
            displayUnitPrice,

          display_subtotal:
            displaySubtotal,

          display_shipping_amount:
            displayShippingAmount,

          display_total_amount:
            displayTotalAmount,

          exchange_rate:
            exchangeRate,
        },

        shipping: {
          country,

          state_region:
            stateRegion,

          amount:
            shippingPrice,

          currency:
            SETTLEMENT_CURRENCY,
        },

        product: {
          id:
            product.id,

          name:
            product.name,

          slug:
            product.slug,

          condition,

          variant_id:
            variant
              ?.id ??
            null,

          storage:
            variant
              ?.storage ??
            null,

          color:
            variant
              ?.color ??
            null,

          sku:
            variant
              ?.sku ??
            null,

          refurbished_grade:
            condition ===
              "refurbished"
              ? refurbishedGrade
              : null,

          battery_grade:
            condition ===
              "refurbished"
              ? batteryGrade
              : null,

          battery_upgrade_amount:
            batteryUpgradeAmount,
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