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

type Language =
  | "pt"
  | "en";

type DisplayCurrency =
  | "CVE"
  | "EUR";

type RefurbishedGrade =
  | "correct"
  | "good"
  | "excellent"
  | "premium";

type BatteryGrade =
  | "optimal"
  | "new";

type RequestItem = {
  product_id?:
    string;

  variant_id?:
    | string
    | null;

  condition?:
    SellCondition;

  refurbished_grade?:
    | RefurbishedGrade
    | null;

  battery_grade?:
    | BatteryGrade
    | null;

  quantity?:
    number;
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

type BankDetails = {
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

type ValidatedOrderItem = {
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

const NEW_BATTERY_UPGRADE_PRICE =
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
   RESPONSE HELPERS
========================================================= */

function jsonResponse(
  body:
    Record<
      string,
      unknown
    >,

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
  code:
    string,

  message:
    string
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
  code:
    string,

  message:
    string
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

function toNullableNumber(
  value:
    unknown
) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const parsed =
    Number(
      value
    );

  return Number.isFinite(
    parsed
  )
    ? parsed
    : null;
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

function isValidEmail(
  email:
    string
) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email
  );
}

function normalizeDisplayCurrency(
  value:
    unknown
):
  | DisplayCurrency
  | null {
  const normalized =
    cleanString(
      value
    ).toUpperCase();

  if (
    !normalized
  ) {
    return "CVE";
  }

  if (
    normalized ===
      "CVE" ||
    normalized ===
      "EUR"
  ) {
    return normalized;
  }

  return null;
}

function normalizeRefurbishedGrade(
  value:
    unknown
):
  | RefurbishedGrade
  | null {
  const normalized =
    cleanString(
      value
    ).toLowerCase();

  if (
    normalized ===
      "correct" ||
    normalized ===
      "good" ||
    normalized ===
      "excellent" ||
    normalized ===
      "premium"
  ) {
    return normalized;
  }

  return null;
}

function normalizeBatteryGrade(
  value:
    unknown
):
  | BatteryGrade
  | null {
  const normalized =
    cleanString(
      value
    ).toLowerCase();

  if (
    normalized ===
      "optimal" ||
    normalized ===
      "new"
  ) {
    return normalized;
  }

  return null;
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

function formatMoney(
  amount:
    number,

  currency:
    string,

  language:
    Language
) {
  const locale =
    language ===
      "pt"
      ? "pt-PT"
      : "en-IE";

  if (
    currency ===
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

      currency,
    }
  ).format(
    amount
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
   HTML HELPERS
========================================================= */

function escapeHtml(
  value:
    string
) {
  return value
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#039;"
    );
}

/* =========================================================
   ADDRESS HELPERS
========================================================= */

function buildTextAddress({
  street,
  houseNumber,
  addressLine2,
  postalCode,
  city,
  stateRegion,
  country,
}: {
  street:
    string;

  houseNumber:
    string;

  addressLine2:
    string;

  postalCode:
    string;

  city:
    string;

  stateRegion:
    string;

  country:
    string;
}) {
  const lines:
    string[] = [];

  const streetLine =
    [
      street,
      houseNumber,
    ]
      .filter(
        Boolean
      )
      .join(
        ", "
      );

  if (
    streetLine
  ) {
    lines.push(
      streetLine
    );
  }

  if (
    addressLine2
  ) {
    lines.push(
      addressLine2
    );
  }

  const cityLine =
    [
      postalCode,
      city,
    ]
      .filter(
        Boolean
      )
      .join(
        " "
      );

  if (
    cityLine
  ) {
    lines.push(
      cityLine
    );
  }

  if (
    stateRegion
  ) {
    lines.push(
      stateRegion
    );
  }

  if (
    country
  ) {
    lines.push(
      country
    );
  }

  return lines.join(
    "\n"
  );
}

function buildHtmlAddress({
  street,
  houseNumber,
  addressLine2,
  postalCode,
  city,
  stateRegion,
  country,
}: {
  street:
    string;

  houseNumber:
    string;

  addressLine2:
    string;

  postalCode:
    string;

  city:
    string;

  stateRegion:
    string;

  country:
    string;
}) {
  return buildTextAddress({
    street,
    houseNumber,
    addressLine2,
    postalCode,
    city,
    stateRegion,
    country,
  })
    .split("\n")
    .map(
      (
        line
      ) =>
        escapeHtml(
          line
        )
    )
    .join(
      "<br>"
    );
}

/* =========================================================
   CONDITION HELPERS
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
    product.refurbished_enabled ===
      true
  );
}

/* =========================================================
   ACTIVE PRICE
========================================================= */

function activePrice(
  normalPrice:
    | number
    | string
    | null,

  promotionalPrice:
    | number
    | string
    | null
) {
  const normal =
    toNullableNumber(
      normalPrice
    );

  const promotional =
    toNullableNumber(
      promotionalPrice
    );

  if (
    promotional !==
      null &&
    promotional > 0 &&
    (
      normal ===
        null ||
      promotional <
        normal
    )
  ) {
    return promotional;
  }

  if (
    normal !==
      null &&
    normal > 0
  ) {
    return normal;
  }

  return null;
}

/* =========================================================
   REFURBISHED PRICE
========================================================= */

function getRefurbishedGradePrice(
  variant:
    VariantRow,

  grade:
    RefurbishedGrade
) {
  if (
    grade ===
      "correct"
  ) {
    return activePrice(
      variant
        .refurbished_correct_sale_price,

      variant
        .refurbished_correct_promotional_price
    );
  }

  if (
    grade ===
      "good"
  ) {
    return activePrice(
      variant
        .refurbished_good_sale_price,

      variant
        .refurbished_good_promotional_price
    );
  }

  if (
    grade ===
      "excellent"
  ) {
    return activePrice(
      variant
        .refurbished_excellent_sale_price,

      variant
        .refurbished_excellent_promotional_price
    );
  }

  return activePrice(
    variant
      .refurbished_premium_sale_price,

    variant
      .refurbished_premium_promotional_price
  );
}

/* =========================================================
   AUTHORITATIVE BASE PRICE
========================================================= */

function getAuthoritativeBasePrice({
  product,
  variant,
  condition,
  refurbishedGrade,
}: {
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
}) {
  if (
    condition ===
      "new"
  ) {
    if (
      !productCanBeSoldNew(
        product
      )
    ) {
      throw new Error(
        "NEW_NOT_AVAILABLE"
      );
    }

    if (
      variant
    ) {
      const price =
        activePrice(
          variant
            .sale_price,

          variant
            .promotional_price
        );

      if (
        price ===
          null
      ) {
        throw new Error(
          "PRICE_NOT_AVAILABLE"
        );
      }

      return price;
    }

    const price =
      activePrice(
        product
          .sale_price,

        product
          .promotional_price
      );

    if (
      price ===
        null
    ) {
      throw new Error(
        "PRICE_NOT_AVAILABLE"
      );
    }

    return price;
  }

  if (
    !productCanBeSoldRefurbished(
      product
    )
  ) {
    throw new Error(
      "REFURBISHED_NOT_AVAILABLE"
    );
  }

  if (
    !variant
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

  const price =
    getRefurbishedGradePrice(
      variant,
      refurbishedGrade
    );

  if (
    price ===
      null
  ) {
    throw new Error(
      "REFURBISHED_GRADE_PRICE_NOT_AVAILABLE"
    );
  }

  return price;
}

/* =========================================================
   SHIPPING
========================================================= */

function getShippingPrice(
  country:
    string
):
  | number
  | null {
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
   LABEL HELPERS
========================================================= */

function getRefurbishedGradeLabel(
  grade:
    RefurbishedGrade,

  language:
    Language
) {
  if (
    language ===
      "pt"
  ) {
    if (
      grade ===
        "correct"
    ) {
      return "Correto";
    }

    if (
      grade ===
        "good"
    ) {
      return "Bom";
    }

    if (
      grade ===
        "excellent"
    ) {
      return "Excelente";
    }

    return "Premium";
  }

  if (
    grade ===
      "correct"
  ) {
    return "Correct";
  }

  if (
    grade ===
      "good"
  ) {
    return "Good";
  }

  if (
    grade ===
      "excellent"
  ) {
    return "Excellent";
  }

  return "Premium";
}

function getBatteryGradeLabel(
  grade:
    BatteryGrade,

  language:
    Language
) {
  if (
    language ===
      "pt"
  ) {
    return grade ===
      "new"
      ? "Bateria nova"
      : "Bateria ótima";
  }

  return grade ===
    "new"
    ? "New battery"
    : "Optimal battery";
}

/* =========================================================
   VALIDATE + PRICE ONE ORDER ITEM
========================================================= */

async function validateOrderItem(
  supabase:
    SupabaseServerClient,

  rawItem:
    RequestItem,

  index:
    number

): Promise<
  | {
      success:
        true;

      item:
        ValidatedOrderItem;
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
      rawItem.product_id
    );

  const variantId =
    cleanString(
      rawItem.variant_id
    ) ||
    null;

  const conditionRaw =
    cleanString(
      rawItem.condition
    ).toLowerCase();

  const quantity =
    Number(
      rawItem.quantity ??
        1
    );

  if (
    !productId
  ) {
    return {
      success:
        false,

      code:
        "PRODUCT_REQUIRED",

      message:
        `Product ID is required for item ${index + 1}.`,
    };
  }

  if (
    conditionRaw !==
      "new" &&
    conditionRaw !==
      "refurbished"
  ) {
    return {
      success:
        false,

      code:
        "INVALID_CONDITION",

      message:
        `Invalid condition for item ${index + 1}.`,
    };
  }

  const condition =
    conditionRaw as
      SellCondition;

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
        `Quantity for item ${index + 1} must be between 1 and ${MAX_QUANTITY_PER_LINE}.`,
    };
  }

  let refurbishedGrade:
    | RefurbishedGrade
    | null =
    null;

  let batteryGrade:
    | BatteryGrade
    | null =
    null;

  if (
    condition ===
      "refurbished"
  ) {
    refurbishedGrade =
      normalizeRefurbishedGrade(
        rawItem.refurbished_grade
      );

    batteryGrade =
      normalizeBatteryGrade(
        rawItem.battery_grade
      );

    if (
      !variantId
    ) {
      return {
        success:
          false,

        code:
          "REFURBISHED_VARIANT_REQUIRED",

        message:
          `A variant is required for refurbished item ${index + 1}.`,
      };
    }

    if (
      !refurbishedGrade
    ) {
      return {
        success:
          false,

        code:
          "REFURBISHED_GRADE_REQUIRED",

        message:
          `A refurbished cosmetic grade is required for item ${index + 1}.`,
      };
    }

    if (
      !batteryGrade
    ) {
      return {
        success:
          false,

        code:
          "BATTERY_GRADE_REQUIRED",

        message:
          `A battery option is required for item ${index + 1}.`,
      };
    }
  } else {
    if (
      rawItem
        .refurbished_grade !=
        null ||
      rawItem
        .battery_grade !=
        null
    ) {
      return {
        success:
          false,

        code:
          "INVALID_REFURBISHED_CONFIGURATION",

        message:
          `Refurbished configuration cannot be used for new item ${index + 1}.`,
      };
    }
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
      .select(`
        id,
        name,
        slug,
        condition,
        refurbished_enabled,
        sale_price,
        promotional_price,
        available,
        published
      `)
      .eq(
        "id",
        productId
      )
      .maybeSingle();

  if (
    productError
  ) {
    console.error(
      "Product lookup error:",
      {
        index,
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
        `Could not load product for item ${index + 1}.`,
    };
  }

  if (
    !productData
  ) {
    return {
      success:
        false,

      code:
        "PRODUCT_NOT_FOUND",

      message:
        `Product for item ${index + 1} could not be found.`,
    };
  }

  const product =
    productData as
      ProductRow;

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
        `${product.name} is currently unavailable.`,
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
        `${product.name} is not available refurbished.`,
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
        .select(`
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
        `)
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
        "Variant lookup error:",
        {
          index,
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
          `Could not load product variant for ${product.name}.`,
      };
    }

    if (
      !variantData
    ) {
      return {
        success:
          false,

        code:
          "VARIANT_NOT_FOUND",

        message:
          `The selected variant for ${product.name} could not be found.`,
      };
    }

    variant =
      variantData as
        VariantRow;

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
    number;

  try {
    baseUnitPrice =
      roundMoney(
        getAuthoritativeBasePrice({
          product,
          variant,
          condition,
          refurbishedGrade,
        })
      );
  } catch (
    error
  ) {
    const code =
      error instanceof
        Error
        ? error.message
        : "PRICE_NOT_AVAILABLE";

    return {
      success:
        false,

      code,

      message:
        code ===
          "REFURBISHED_GRADE_PRICE_NOT_AVAILABLE"
          ? `No valid price is configured for the selected refurbished grade of ${product.name}.`
          : code ===
              "NEW_NOT_AVAILABLE"
            ? `${product.name} is not available as new.`
            : code ===
                "REFURBISHED_NOT_AVAILABLE"
              ? `${product.name} is not available refurbished.`
              : `The selected configuration for ${product.name} does not have a valid price.`,
    };
  }

  if (
    !Number.isFinite(
      baseUnitPrice
    ) ||
    baseUnitPrice <= 0
  ) {
    return {
      success:
        false,

      code:
        "PRICE_NOT_AVAILABLE",

      message:
        `The selected configuration for ${product.name} does not have a valid price.`,
    };
  }

  const batteryUpgradeAmount =
    condition ===
        "refurbished" &&
      batteryGrade ===
        "new"
      ? NEW_BATTERY_UPGRADE_PRICE
      : 0;

  const unitPrice =
    roundMoney(
      baseUnitPrice +
        batteryUpgradeAmount
    );

  const lineSubtotal =
    roundMoney(
      unitPrice *
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

      baseUnitPrice,

      batteryUpgradeAmount,

      unitPrice,

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
   EMAIL ITEM TEXT
========================================================= */

function buildEmailItemText(
  item:
    ValidatedOrderItem,

  language:
    Language
) {
  const conditionLabel =
    language ===
      "pt"
      ? item.condition ===
          "refurbished"
        ? "Recondicionado"
        : "Novo"
      : item.condition ===
          "refurbished"
        ? "Refurbished"
        : "New";

  const lines:
    string[] = [];

  lines.push(
    item.productName
  );

  if (
    item.storage
  ) {
    lines.push(
      `${
        language ===
          "pt"
          ? "Armazenamento"
          : "Storage"
      }: ${item.storage}`
    );
  }

  if (
    item.color
  ) {
    lines.push(
      `${
        language ===
          "pt"
          ? "Cor"
          : "Colour"
      }: ${item.color}`
    );
  }

  lines.push(
    `${
      language ===
        "pt"
        ? "Condição"
        : "Condition"
    }: ${conditionLabel}`
  );

  if (
    item.refurbishedGrade
  ) {
    lines.push(
      `${
        language ===
          "pt"
          ? "Condição estética"
          : "Cosmetic grade"
      }: ${getRefurbishedGradeLabel(
        item.refurbishedGrade,
        language
      )}`
    );
  }

  if (
    item.batteryGrade
  ) {
    lines.push(
      `${
        language ===
          "pt"
          ? "Bateria"
          : "Battery"
      }: ${getBatteryGradeLabel(
        item.batteryGrade,
        language
      )}`
    );
  }

  lines.push(
    `${
      language ===
        "pt"
        ? "Quantidade"
        : "Quantity"
    }: ${item.quantity}`
  );

  lines.push(
    `${
      language ===
        "pt"
        ? "Preço unitário"
        : "Unit price"
    }: ${formatMoney(
      item.unitPrice,
      SETTLEMENT_CURRENCY,
      language
    )}`
  );

  lines.push(
    `${
      language ===
        "pt"
        ? "Subtotal"
        : "Subtotal"
    }: ${formatMoney(
      item.lineSubtotal,
      SETTLEMENT_CURRENCY,
      language
    )}`
  );

  return lines.join(
    "\n"
  );
}

/* =========================================================
   EMAIL ITEM HTML
========================================================= */

function buildEmailItemHtml(
  item:
    ValidatedOrderItem,

  language:
    Language
) {
  const conditionLabel =
    language ===
      "pt"
      ? item.condition ===
          "refurbished"
        ? "Recondicionado"
        : "Novo"
      : item.condition ===
          "refurbished"
        ? "Refurbished"
        : "New";

  const grade =
    item.refurbishedGrade
      ? getRefurbishedGradeLabel(
          item.refurbishedGrade,
          language
        )
      : null;

  const battery =
    item.batteryGrade
      ? getBatteryGradeLabel(
          item.batteryGrade,
          language
        )
      : null;

  return `
    <div style="padding:18px 0;border-bottom:1px solid #e4e7ec;">
      <div style="font-size:17px;font-weight:900;color:#111827;">
        ${escapeHtml(
          item.productName
        )}
      </div>

      ${
        item.storage
          ? `
            <div style="font-size:13px;color:#667085;margin-top:6px;">
              ${
                language ===
                  "pt"
                  ? "Armazenamento"
                  : "Storage"
              }: ${escapeHtml(
                item.storage
              )}
            </div>
          `
          : ""
      }

      ${
        item.color
          ? `
            <div style="font-size:13px;color:#667085;margin-top:3px;">
              ${
                language ===
                  "pt"
                  ? "Cor"
                  : "Colour"
              }: ${escapeHtml(
                item.color
              )}
            </div>
          `
          : ""
      }

      <div style="font-size:13px;color:#667085;margin-top:3px;">
        ${
          language ===
            "pt"
            ? "Condição"
            : "Condition"
        }: ${escapeHtml(
          conditionLabel
        )}
      </div>

      ${
        grade
          ? `
            <div style="font-size:13px;color:#667085;margin-top:3px;">
              ${
                language ===
                  "pt"
                  ? "Condição estética"
                  : "Cosmetic grade"
              }: ${escapeHtml(
                grade
              )}
            </div>
          `
          : ""
      }

      ${
        battery
          ? `
            <div style="font-size:13px;color:#667085;margin-top:3px;">
              ${
                language ===
                  "pt"
                  ? "Bateria"
                  : "Battery"
              }: ${escapeHtml(
                battery
              )}
            </div>
          `
          : ""
      }

      ${
        item.batteryUpgradeAmount >
        0
          ? `
            <div style="font-size:13px;color:#667085;margin-top:3px;">
              ${
                language ===
                  "pt"
                  ? "Upgrade de bateria"
                  : "Battery upgrade"
              }: +${formatMoney(
                item.batteryUpgradeAmount,
                SETTLEMENT_CURRENCY,
                language
              )}
            </div>
          `
          : ""
      }

      <div style="font-size:13px;color:#667085;margin-top:8px;">
        ${
          language ===
            "pt"
            ? "Quantidade"
            : "Quantity"
        }: ${item.quantity}
      </div>

      <div style="font-size:13px;color:#667085;margin-top:3px;">
        ${
          language ===
            "pt"
            ? "Preço unitário"
            : "Unit price"
        }: ${formatMoney(
          item.unitPrice,
          SETTLEMENT_CURRENCY,
          language
        )}
      </div>

      <div style="font-size:15px;font-weight:900;color:#111827;margin-top:6px;">
        ${
          language ===
            "pt"
            ? "Subtotal"
            : "Subtotal"
        }: ${formatMoney(
          item.lineSubtotal,
          SETTLEMENT_CURRENCY,
          language
        )}
      </div>
    </div>
  `;
}

/* =========================================================
   EMAIL
========================================================= */

async function sendOrderEmail({
  resendApiKey,
  fromEmail,

  customerEmail,
  customerName,

  customerCountry,
  customerStateRegion,
  customerCity,
  customerStreet,
  customerHouseNumber,
  customerAddressLine2,
  customerPostalCode,

  orderNumber,

  items,

  subtotalAmount,
  shippingAmount,
  totalAmount,

  displayCurrency,
  displaySubtotalAmount,
  displayShippingAmount,
  displayTotalAmount,
  exchangeRate,

  paymentReference,

  bank,

  language,
}: {
  resendApiKey:
    string;

  fromEmail:
    string;

  customerEmail:
    string;

  customerName:
    string;

  customerCountry:
    string;

  customerStateRegion:
    string;

  customerCity:
    string;

  customerStreet:
    string;

  customerHouseNumber:
    string;

  customerAddressLine2:
    string;

  customerPostalCode:
    string;

  orderNumber:
    string;

  items:
    ValidatedOrderItem[];

  subtotalAmount:
    number;

  shippingAmount:
    number;

  totalAmount:
    number;

  displayCurrency:
    DisplayCurrency;

  displaySubtotalAmount:
    number;

  displayShippingAmount:
    number;

  displayTotalAmount:
    number;

  exchangeRate:
    number;

  paymentReference:
    string;

  bank:
    BankDetails;

  language:
    Language;
}) {
  const formattedSubtotal =
    formatMoney(
      subtotalAmount,
      SETTLEMENT_CURRENCY,
      language
    );

  const formattedShipping =
    formatMoney(
      shippingAmount,
      SETTLEMENT_CURRENCY,
      language
    );

  const formattedTotal =
    formatMoney(
      totalAmount,
      SETTLEMENT_CURRENCY,
      language
    );

  const formattedDisplaySubtotal =
    formatMoney(
      displaySubtotalAmount,
      displayCurrency,
      language
    );

  const formattedDisplayShipping =
    formatMoney(
      displayShippingAmount,
      displayCurrency,
      language
    );

  const formattedDisplayTotal =
    formatMoney(
      displayTotalAmount,
      displayCurrency,
      language
    );

  const textAddress =
    buildTextAddress({
      street:
        customerStreet,

      houseNumber:
        customerHouseNumber,

      addressLine2:
        customerAddressLine2,

      postalCode:
        customerPostalCode,

      city:
        customerCity,

      stateRegion:
        customerStateRegion,

      country:
        customerCountry,
    });

  const htmlAddress =
    buildHtmlAddress({
      street:
        customerStreet,

      houseNumber:
        customerHouseNumber,

      addressLine2:
        customerAddressLine2,

      postalCode:
        customerPostalCode,

      city:
        customerCity,

      stateRegion:
        customerStateRegion,

      country:
        customerCountry,
    });

  const subject =
    language ===
      "pt"
      ? `Instruções de pagamento — ${orderNumber}`
      : `Payment instructions — ${orderNumber}`;

  const textItems =
    items
      .map(
        (
          item,
          index
        ) =>
          `${
            index + 1
          }. ${buildEmailItemText(
            item,
            language
          )}`
      )
      .join(
        "\n\n"
      );

  const htmlItems =
    items
      .map(
        (
          item
        ) =>
          buildEmailItemHtml(
            item,
            language
          )
      )
      .join(
        ""
      );

  const displayEquivalentText =
    displayCurrency ===
      "CVE"
      ? language ===
          "pt"
        ? `

EQUIVALENTE EM CVE

Subtotal: ${formattedDisplaySubtotal}
Envio: ${formattedDisplayShipping}
Total: ${formattedDisplayTotal}
Taxa: 1 EUR = ${exchangeRate} CVE

O valor em CVE é informativo. A transferência deve ser feita em EUR.`
        : `

CVE DISPLAY EQUIVALENT

Subtotal: ${formattedDisplaySubtotal}
Shipping: ${formattedDisplayShipping}
Total: ${formattedDisplayTotal}
Rate: 1 EUR = ${exchangeRate} CVE

The CVE amount is for reference. The bank transfer must be made in EUR.`
      : "";

  const text =
    language ===
      "pt"
      ? `POKAPOK

Recebemos a sua encomenda.

Olá ${customerName},

Obrigado pela sua encomenda.

NÚMERO DA ENCOMENDA

${orderNumber}

ARTIGOS

${textItems}

RESUMO

Subtotal: ${formattedSubtotal}
Envio: ${formattedShipping}
Total a transferir: ${formattedTotal}${displayEquivalentText}

MORADA DE ENTREGA

${textAddress}

DADOS PARA TRANSFERÊNCIA BANCÁRIA

Titular / Beneficiário:
${bank.account_name}

IBAN:
${bank.iban}

BIC / SWIFT:
${bank.bic}

Banco:
${bank.bank_name}

País do banco:
${bank.country}

Moeda:
${bank.currency}

Montante:
${formattedTotal}

REFERÊNCIA / DESCRIÇÃO:
${paymentReference}

IMPORTANTE:

Introduza exatamente ${paymentReference} na referência, descrição ou mensagem da transferência.

Assim conseguimos associar o pagamento à encomenda ${orderNumber}.

Após confirmação do pagamento, enviaremos uma nova confirmação.

POKAPOK`
      : `POKAPOK

Your order has been received.

Hi ${customerName},

Thank you for your order.

ORDER NUMBER

${orderNumber}

ITEMS

${textItems}

SUMMARY

Subtotal: ${formattedSubtotal}
Shipping: ${formattedShipping}
Total to transfer: ${formattedTotal}${displayEquivalentText}

DELIVERY ADDRESS

${textAddress}

BANK TRANSFER DETAILS

Beneficiary / Account holder:
${bank.account_name}

IBAN:
${bank.iban}

BIC / SWIFT:
${bank.bic}

Bank:
${bank.bank_name}

Bank country:
${bank.country}

Currency:
${bank.currency}

Amount:
${formattedTotal}

PAYMENT REFERENCE:
${paymentReference}

IMPORTANT:

Enter ${paymentReference} exactly in the reference, description or message field of your transfer.

This allows us to match your payment to order ${orderNumber}.

After payment is confirmed, we will send another confirmation.

POKAPOK`;

  const equivalentHtml =
    displayCurrency ===
      "CVE"
      ? `
        <div style="background:#eef4ff;border-radius:16px;padding:18px;margin:20px 0;border:1px solid #d7e5ff;">
          <div style="font-size:12px;font-weight:900;color:#667085;letter-spacing:.5px;">
            ${
              language ===
                "pt"
                ? "EQUIVALENTE EM CVE"
                : "CVE DISPLAY EQUIVALENT"
            }
          </div>

          <div style="font-size:26px;font-weight:900;color:#1261ff;margin-top:7px;">
            ${formattedDisplayTotal}
          </div>

          <div style="font-size:13px;color:#667085;margin-top:8px;">
            ${
              language ===
                "pt"
                ? "Subtotal"
                : "Subtotal"
            }: ${formattedDisplaySubtotal}
          </div>

          <div style="font-size:13px;color:#667085;margin-top:4px;">
            ${
              language ===
                "pt"
                ? "Envio"
                : "Shipping"
            }: ${formattedDisplayShipping}
          </div>

          <div style="font-size:13px;color:#667085;margin-top:8px;">
            ${
              language ===
                "pt"
                ? "Taxa"
                : "Rate"
            }: 1 EUR = ${exchangeRate} CVE
          </div>

          <div style="font-size:12px;color:#667085;margin-top:8px;">
            ${
              language ===
                "pt"
                ? "O valor em CVE é informativo. A transferência deve ser feita em EUR."
                : "The CVE amount is for reference. The bank transfer must be made in EUR."
            }
          </div>
        </div>
      `
      : "";

  const html =
    `
<!doctype html>
<html>
<body style="margin:0;padding:0;background:#f5f5f3;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;color:#111827;">

  <div style="max-width:640px;margin:0 auto;padding:32px 20px;">

    <div style="background:#ffffff;border-radius:24px;padding:30px;border:1px solid #e5e7eb;">

      <div style="font-weight:900;letter-spacing:2px;color:#1261ff;margin-bottom:24px;">
        POKAPOK
      </div>

      <h1 style="font-size:28px;line-height:34px;margin:0;">
        ${
          language ===
            "pt"
            ? "Recebemos a sua encomenda."
            : "We received your order."
        }
      </h1>

      <p style="color:#667085;line-height:1.6;margin-top:12px;">
        ${
          language ===
            "pt"
            ? `Olá ${escapeHtml(
                customerName
              )}, utilize os dados abaixo para concluir o pagamento.`
            : `Hi ${escapeHtml(
                customerName
              )}, use the details below to complete your payment.`
        }
      </p>

      <div style="background:#f6f7f9;border-radius:16px;padding:18px;margin:22px 0;">
        <div style="font-size:11px;color:#667085;font-weight:900;letter-spacing:1px;">
          ${
            language ===
              "pt"
              ? "ENCOMENDA"
              : "ORDER"
          }
        </div>

        <div style="font-size:20px;font-weight:900;margin-top:5px;">
          ${escapeHtml(
            orderNumber
          )}
        </div>
      </div>

      <h2 style="font-size:20px;margin-top:26px;">
        ${
          language ===
            "pt"
            ? "Artigos"
            : "Items"
        }
      </h2>

      <div style="background:#fafafa;border-radius:18px;padding:0 18px;border:1px solid #e5e7eb;">
        ${htmlItems}
      </div>

      <div style="margin-top:22px;background:#111827;border-radius:18px;padding:20px;color:#ffffff;">

        <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
          <span style="color:#cbd5e1;">
            ${
              language ===
                "pt"
                ? "Subtotal"
                : "Subtotal"
            }
          </span>

          <strong>
            ${formattedSubtotal}
          </strong>
        </div>

        <div style="display:flex;justify-content:space-between;margin-bottom:12px;">
          <span style="color:#cbd5e1;">
            ${
              language ===
                "pt"
                ? "Envio"
                : "Shipping"
            }
          </span>

          <strong>
            ${formattedShipping}
          </strong>
        </div>

        <div style="border-top:1px solid rgba(255,255,255,.14);padding-top:14px;font-size:21px;font-weight:900;">
          ${
            language ===
              "pt"
              ? "Total"
              : "Total"
          }: ${formattedTotal}
        </div>

      </div>

      ${equivalentHtml}

      <h2 style="font-size:20px;margin-top:28px;">
        ${
          language ===
            "pt"
            ? "Morada de entrega"
            : "Delivery address"
        }
      </h2>

      <div style="background:#f6f7f9;border-radius:16px;padding:18px;line-height:1.7;">
        ${htmlAddress}
      </div>

      <h2 style="font-size:20px;margin-top:28px;">
        ${
          language ===
            "pt"
            ? "Transferência bancária"
            : "Bank transfer"
        }
      </h2>

      <div style="background:#f6f7f9;border-radius:16px;padding:18px;line-height:1.7;">

        <strong>
          ${
            language ===
              "pt"
              ? "Titular"
              : "Account holder"
          }
        </strong>
        <br>
        ${escapeHtml(
          bank.account_name
        )}

        <br><br>

        <strong>IBAN</strong>
        <br>
        ${escapeHtml(
          bank.iban
        )}

        <br><br>

        <strong>BIC / SWIFT</strong>
        <br>
        ${escapeHtml(
          bank.bic
        )}

        <br><br>

        <strong>
          ${
            language ===
              "pt"
              ? "Banco"
              : "Bank"
          }
        </strong>
        <br>
        ${escapeHtml(
          bank.bank_name
        )}

        <br><br>

        <strong>
          ${
            language ===
              "pt"
              ? "Moeda"
              : "Currency"
          }
        </strong>
        <br>
        ${escapeHtml(
          bank.currency
        )}

        <br><br>

        <strong>
          ${
            language ===
              "pt"
              ? "Montante"
              : "Amount"
          }
        </strong>
        <br>
        ${formattedTotal}

      </div>

      <div style="background:#1261ff;border-radius:18px;padding:20px;margin-top:22px;">

        <div style="font-size:11px;color:#dce8ff;font-weight:900;letter-spacing:1px;">
          ${
            language ===
              "pt"
              ? "REFERÊNCIA / DESCRIÇÃO"
              : "PAYMENT REFERENCE"
          }
        </div>

        <div style="font-size:24px;font-weight:900;color:#ffffff;margin-top:7px;">
          ${escapeHtml(
            paymentReference
          )}
        </div>

      </div>

      <p style="color:#667085;font-size:13px;line-height:1.6;margin-top:18px;">
        ${
          language ===
            "pt"
            ? `Introduza exatamente ${escapeHtml(
                paymentReference
              )} no campo de referência, descrição ou mensagem da transferência.`
            : `Enter ${escapeHtml(
                paymentReference
              )} exactly in the reference, description or message field of your transfer.`
        }
      </p>

    </div>

  </div>

</body>
</html>
`;

  const response =
    await fetch(
      "https://api.resend.com/emails",
      {
        method:
          "POST",

        headers: {
          Authorization:
            `Bearer ${resendApiKey}`,

          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify({
            from:
              fromEmail,

            to: [
              customerEmail,
            ],

            reply_to:
              "orders@pokapok.cv",

            subject,

            html,

            text,
          }),
      }
    );

  const responseBody =
    await response.text();

  if (
    !response.ok
  ) {
    throw new Error(
      `Resend error ${response.status}: ${responseBody}`
    );
  }

  return responseBody;
}

/* =========================================================
   CREATE ORDER
========================================================= */

Deno.serve(
  async (
    req:
      Request
  ) => {
    /* =====================================================
       CORS
    ===================================================== */

    if (
      req.method ===
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
      req.method !==
        "POST"
    ) {
      return jsonResponse(
        {
          success:
            false,

          error:
            "METHOD_NOT_ALLOWED",

          message:
            "Method not allowed.",
        },
        405
      );
    }

    try {
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

      const resendApiKey =
        Deno.env.get(
          "RESEND_API_KEY"
        );

      const fromEmail =
        Deno.env.get(
          "POKAPOK_FROM_EMAIL"
        );

      const accountName =
        Deno.env.get(
          "POKAPOK_BANK_ACCOUNT_NAME"
        ) ??
        Deno.env.get(
          "LUMINA_BANK_ACCOUNT_NAME"
        );

      const iban =
        Deno.env.get(
          "POKAPOK_BANK_IBAN"
        ) ??
        Deno.env.get(
          "LUMINA_BANK_IBAN"
        );

      const bic =
        Deno.env.get(
          "POKAPOK_BANK_BIC"
        ) ??
        Deno.env.get(
          "LUMINA_BANK_BIC"
        );

      const bankName =
        Deno.env.get(
          "POKAPOK_BANK_NAME"
        ) ??
        Deno.env.get(
          "LUMINA_BANK_NAME"
        );

      const bankCountry =
        Deno.env.get(
          "POKAPOK_BANK_COUNTRY"
        ) ??
        Deno.env.get(
          "LUMINA_BANK_COUNTRY"
        ) ??
        "Netherlands";

      const configuredBankCurrency =
        (
          Deno.env.get(
            "POKAPOK_BANK_CURRENCY"
          ) ??
          Deno.env.get(
            "LUMINA_BANK_CURRENCY"
          ) ??
          SETTLEMENT_CURRENCY
        )
          .trim()
          .toUpperCase();

      /* ===================================================
         REQUIRED CONFIGURATION
      =================================================== */

      if (
        !supabaseUrl
      ) {
        return serverError(
          "SUPABASE_CONFIGURATION_MISSING",
          "SUPABASE_URL is not configured."
        );
      }

      if (
        !serviceRoleKey
      ) {
        return serverError(
          "SUPABASE_CONFIGURATION_MISSING",
          "SUPABASE_SERVICE_ROLE_KEY is not configured."
        );
      }

      if (
        !accountName ||
        !iban ||
        !bic ||
        !bankName
      ) {
        return serverError(
          "BANK_CONFIGURATION_MISSING",
          "Bank transfer details are not fully configured."
        );
      }

      if (
        configuredBankCurrency !==
          SETTLEMENT_CURRENCY
      ) {
        return serverError(
          "INVALID_BANK_CURRENCY",
          "The current bank-transfer checkout must be configured in EUR."
        );
      }

      const bank:
        BankDetails = {
        account_name:
          accountName,

        iban,

        bic,

        bank_name:
          bankName,

        country:
          bankCountry,

        currency:
          SETTLEMENT_CURRENCY,
      };

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
         REQUEST BODY
      =================================================== */

      let body:
        Record<
          string,
          unknown
        >;

      try {
        body =
          await req.json();
      } catch {
        return badRequest(
          "INVALID_JSON",
          "Invalid request body."
        );
      }

      /* ===================================================
         CUSTOMER
      =================================================== */

      const customerName =
        cleanString(
          body.customer_name
        );

      const customerEmail =
        cleanString(
          body.customer_email
        ).toLowerCase();

      const customerWhatsapp =
        cleanString(
          body.customer_whatsapp
        );

      /* ===================================================
         DELIVERY
      =================================================== */

      const customerCountry =
        cleanString(
          body.customer_country
        );

      const customerStateRegion =
        cleanString(
          body.customer_state_region
        );

      const customerCity =
        cleanString(
          body.customer_city
        );

      const customerStreet =
        cleanString(
          body.customer_street
        );

      const customerHouseNumber =
        cleanString(
          body.customer_house_number
        );

      const customerAddressLine2 =
        cleanString(
          body.customer_address_line_2
        );

      const customerPostalCode =
        cleanString(
          body.customer_postal_code
        );

      const customerNotes =
        cleanString(
          body.customer_notes
        );

      /* ===================================================
         PAYMENT
      =================================================== */

      const paymentMethod =
        cleanString(
          body.payment_method
        ) ||
        "bank_transfer";

      const language:
        Language =
        cleanString(
          body.language
        ).toLowerCase() ===
          "en"
          ? "en"
          : "pt";

      const displayCurrency =
        normalizeDisplayCurrency(
          body.display_currency
        );

      /* ===================================================
         CUSTOMER VALIDATION
      =================================================== */

      if (
        !customerName
      ) {
        return badRequest(
          "CUSTOMER_NAME_REQUIRED",
          "Customer name is required."
        );
      }

      if (
        !customerWhatsapp
      ) {
        return badRequest(
          "CUSTOMER_WHATSAPP_REQUIRED",
          "Customer phone or WhatsApp number is required."
        );
      }

      if (
        customerEmail &&
        !isValidEmail(
          customerEmail
        )
      ) {
        return badRequest(
          "INVALID_CUSTOMER_EMAIL",
          "The customer email address is invalid."
        );
      }

      if (
        paymentMethod !==
          "bank_transfer"
      ) {
        return badRequest(
          "PAYMENT_METHOD_NOT_AVAILABLE",
          "Only bank transfer is currently available."
        );
      }

      if (
        displayCurrency ===
          null
      ) {
        return badRequest(
          "INVALID_DISPLAY_CURRENCY",
          "Invalid display currency. Use CVE or EUR."
        );
      }

      /* ===================================================
         DESTINATION
      =================================================== */

      const destination =
        validateDestination(
          customerCountry,
          customerStateRegion
        );

      if (
        !destination.valid
      ) {
        return badRequest(
          destination.code,
          destination.message
        );
      }

      const shippingAmount =
        roundMoney(
          destination.shippingPrice
        );

      /* ===================================================
         ITEMS
      =================================================== */

      if (
        !Array.isArray(
          body.items
        ) ||
        body.items.length ===
          0
      ) {
        return badRequest(
          "ITEMS_REQUIRED",
          "At least one order item is required."
        );
      }

      if (
        body.items.length >
        MAX_ORDER_LINES
      ) {
        return badRequest(
          "TOO_MANY_ORDER_LINES",
          `A maximum of ${MAX_ORDER_LINES} different items can be purchased in one order.`
        );
      }

      const validatedItems:
        ValidatedOrderItem[] =
        [];

      let totalQuantity =
        0;

      for (
        let index = 0;
        index <
        body.items.length;
        index++
      ) {
        const rawItem =
          body.items[
            index
          ] as
            RequestItem;

        const result =
          await validateOrderItem(
            supabase,
            rawItem,
            index
          );

        if (
          !result.success
        ) {
          return badRequest(
            result.code,
            result.message
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
            "TOTAL_QUANTITY_TOO_HIGH",
            `A maximum of ${MAX_TOTAL_QUANTITY} total units can be purchased in one order.`
          );
        }

        validatedItems.push(
          result.item
        );
      }

      /* ===================================================
         TOTALS
      =================================================== */

      const subtotalAmount =
        roundMoney(
          validatedItems.reduce(
            (
              total:
                number,

              item:
                ValidatedOrderItem
            ) =>
              total +
              item.lineSubtotal,
            0
          )
        );

      const totalAmount =
        roundMoney(
          subtotalAmount +
            shippingAmount
        );

      if (
        subtotalAmount <= 0 ||
        totalAmount <= 0
      ) {
        return badRequest(
          "INVALID_ORDER_TOTAL",
          "The calculated order total is invalid."
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

      const displaySubtotalAmount =
        convertEurForDisplay(
          subtotalAmount,
          displayCurrency
        );

      const displayShippingAmount =
        convertEurForDisplay(
          shippingAmount,
          displayCurrency
        );

      const displayTotalAmount =
        convertEurForDisplay(
          totalAmount,
          displayCurrency
        );

      /* ===================================================
         IDENTIFIERS
      =================================================== */

      const orderNumber =
        createOrderNumber();

      const paymentReference =
        createPaymentReference();

      /* ===================================================
         LEGACY ORDER FIELDS

         orders still contains the original single-product
         columns. Keep them populated from the first line so
         the existing dashboard remains compatible.
      =================================================== */

      const firstItem =
        validatedItems[0];

      const legacyProductName =
        validatedItems.length ===
          1
          ? firstItem.productName
          : `${firstItem.productName} + ${validatedItems.length - 1} more`;

      const totalBatteryUpgradeAmount =
        roundMoney(
          validatedItems.reduce(
            (
              total:
                number,

              item:
                ValidatedOrderItem
            ) =>
              total +
              (
                item
                  .batteryUpgradeAmount *
                item
                  .quantity
              ),
            0
          )
        );

      const legacyDisplayUnitPrice =
        convertEurForDisplay(
          firstItem.unitPrice,
          displayCurrency
        );

      /* ===================================================
         INSERT ORDER
      =================================================== */

      const {
        data:
          order,

        error:
          insertError,
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
              customerCountry,

            customer_state_region:
              customerStateRegion,

            customer_city:
              customerCity ||
              null,

            customer_street:
              customerStreet ||
              null,

            customer_house_number:
              customerHouseNumber ||
              null,

            customer_address_line_2:
              customerAddressLine2 ||
              null,

            customer_postal_code:
              customerPostalCode ||
              null,

            customer_notes:
              customerNotes ||
              null,

            language,

            /* LEGACY PRODUCT DATA */

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
                ? firstItem.storage
                : null,

            color:
              validatedItems.length ===
                1
                ? firstItem.color
                : null,

            condition:
              firstItem.condition,

            refurbished_grade:
              validatedItems.length ===
                  1 &&
                firstItem.condition ===
                  "refurbished"
                ? firstItem.refurbishedGrade
                : null,

            battery_grade:
              validatedItems.length ===
                  1 &&
                firstItem.condition ===
                  "refurbished"
                ? firstItem.batteryGrade
                : null,

            battery_upgrade_amount:
              totalBatteryUpgradeAmount,

            quantity:
              totalQuantity,

            unit_price:
              firstItem.unitPrice,

            /* ORDER TOTALS */

            subtotal:
              subtotalAmount,

            subtotal_amount:
              subtotalAmount,

            shipping_amount:
              shippingAmount,

            insurance_amount:
              0,

            discount_amount:
              0,

            total:
              totalAmount,

            total_amount:
              totalAmount,

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
              "bank_transfer",

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
          })
          .select()
          .single();

      if (
        insertError
      ) {
        console.error(
          "Order insert error:",
          insertError
        );

        return serverError(
          "ORDER_CREATE_FAILED",
          `Could not create order: ${insertError.message}`
        );
      }

      /* ===================================================
         INSERT ORDER ITEMS
      =================================================== */

      const orderItemsRows =
        validatedItems.map(
          (
            item
          ) => ({
            order_id:
              order.id,

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
        data:
          insertedOrderItems,

        error:
          orderItemsError,
      } =
        await supabase
          .from(
            "order_items"
          )
          .insert(
            orderItemsRows
          )
          .select();

      if (
        orderItemsError
      ) {
        console.error(
          "Order items insert error:",
          orderItemsError
        );

        /*
         * Bank payment has not happened yet.
         * Remove the incomplete parent order.
         */
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
              order.id
            );

        if (
          cleanupError
        ) {
          console.error(
            "Incomplete order cleanup failed:",
            cleanupError
          );
        }

        return serverError(
          "ORDER_ITEMS_CREATE_FAILED",
          `Could not create order items: ${orderItemsError.message}`
        );
      }

      /* ===================================================
         RESPONSE ITEMS
      =================================================== */

      const responseItems =
        validatedItems.map(
          (
            item,
            index
          ) => ({
            id:
              insertedOrderItems
                ?.[index]
                ?.id ??
              undefined,

            order_id:
              order.id,

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
                item.unitPrice,
                displayCurrency
              ),

            display_line_subtotal:
              convertEurForDisplay(
                item.lineSubtotal,
                displayCurrency
              ),
          })
        );

      /* ===================================================
         EMAIL
      =================================================== */

      let emailSent =
        false;

      let warning:
        | string
        | null =
        null;

      if (
        customerEmail
      ) {
        if (
          !resendApiKey ||
          !fromEmail
        ) {
          warning =
            "Order created, but email configuration is missing.";

          console.error(
            "Email configuration missing:",
            {
              resendApiKey:
                Boolean(
                  resendApiKey
                ),

              fromEmail:
                Boolean(
                  fromEmail
                ),
            }
          );
        } else {
          try {
            const resendResult =
              await sendOrderEmail({
                resendApiKey,
                fromEmail,

                customerEmail,
                customerName,

                customerCountry,
                customerStateRegion,
                customerCity,
                customerStreet,
                customerHouseNumber,
                customerAddressLine2,
                customerPostalCode,

                orderNumber,

                items:
                  validatedItems,

                subtotalAmount,
                shippingAmount,
                totalAmount,

                displayCurrency,
                displaySubtotalAmount,
                displayShippingAmount,
                displayTotalAmount,
                exchangeRate,

                paymentReference,

                bank,

                language,
              });

            console.log(
              "Resend success:",
              resendResult
            );

            emailSent =
              true;
          } catch (
            emailError
          ) {
            console.error(
              "Order email error:",
              emailError
            );

            warning =
              emailError instanceof
                Error
                ? `Order created, but email failed: ${emailError.message}`
                : "Order created, but the confirmation email could not be sent.";
          }
        }
      } else {
        console.log(
          "No customer email provided. Skipping confirmation email."
        );
      }

      /* ===================================================
         SUCCESS
      =================================================== */

      return jsonResponse({
        success:
          true,

        email_sent:
          emailSent,

        warning,

        order,

        order_number:
          orderNumber,

        payment_reference:
          paymentReference,

        items:
          responseItems,

        pricing: {
          currency:
            SETTLEMENT_CURRENCY,

          item_subtotal:
            subtotalAmount,

          subtotal_amount:
            subtotalAmount,

          shipping_amount:
            shippingAmount,

          total_amount:
            totalAmount,

          quantity:
            totalQuantity,

          total_quantity:
            totalQuantity,

          item_count:
            validatedItems.length,

          /*
           * Legacy compatibility.
           * These refer to the first order line.
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

          display_unit_price:
            legacyDisplayUnitPrice,

          display_subtotal_amount:
            displaySubtotalAmount,

          display_subtotal:
            displaySubtotalAmount,

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
          country:
            customerCountry,

          state_region:
            customerStateRegion,

          amount:
            shippingAmount,

          currency:
            SETTLEMENT_CURRENCY,

          display_amount:
            displayShippingAmount,

          display_currency:
            displayCurrency,
        },

        payment: {
          method:
            "bank_transfer",

          status:
            "awaiting_payment",

          reference:
            paymentReference,

          bank,
        },
      });
    } catch (
      error
    ) {
      console.error(
        "create-order fatal error:",
        error
      );

      return serverError(
        "ORDER_CREATE_FAILED",
        error instanceof
          Error
          ? error.message
          : "Unexpected create-order error."
      );
    }
  }
);