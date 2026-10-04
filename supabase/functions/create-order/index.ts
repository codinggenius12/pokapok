import { createClient } from "@supabase/supabase-js";

/* =========================================================
   TYPES
========================================================= */

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

type ProductRow = {
  id: string;
  name: string;
  slug: string;

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
  id: string;

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

  /* EXACT REFURBISHED GRADES */

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
      escapeHtml(
        streetLine
      )
    );
  }

  if (
    addressLine2
  ) {
    lines.push(
      escapeHtml(
        addressLine2
      )
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
      escapeHtml(
        cityLine
      )
    );
  }

  if (
    stateRegion
  ) {
    lines.push(
      escapeHtml(
        stateRegion
      )
    );
  }

  if (
    country
  ) {
    lines.push(
      escapeHtml(
        country
      )
    );
  }

  return lines.join(
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
   EXACT REFURBISHED GRADE PRICE
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

  productName,
  storage,
  color,
  condition,

  refurbishedGrade,
  batteryGrade,
  batteryUpgradeAmount,

  quantity,

  baseUnitPrice,
  unitPrice,
  subtotalAmount,
  shippingAmount,
  totalAmount,

  displayCurrency,
  displayUnitPrice,
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

  productName:
    string;

  storage:
    | string
    | null;

  color:
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

  batteryUpgradeAmount:
    number;

  quantity:
    number;

  baseUnitPrice:
    number;

  unitPrice:
    number;

  subtotalAmount:
    number;

  shippingAmount:
    number;

  totalAmount:
    number;

  displayCurrency:
    DisplayCurrency;

  displayUnitPrice:
    number;

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
  const formattedBaseUnitPrice =
    formatMoney(
      baseUnitPrice,
      SETTLEMENT_CURRENCY,
      language
    );

  const formattedBatteryUpgrade =
    formatMoney(
      batteryUpgradeAmount,
      SETTLEMENT_CURRENCY,
      language
    );

  const formattedUnitPrice =
    formatMoney(
      unitPrice,
      SETTLEMENT_CURRENCY,
      language
    );

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

  const formattedDisplayUnit =
    formatMoney(
      displayUnitPrice,
      displayCurrency,
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

  const showCveEquivalent =
    displayCurrency ===
      "CVE";

  const conditionLabel =
    language ===
      "pt"
      ? condition ===
          "refurbished"
        ? "Recondicionado"
        : "Novo"
      : condition ===
          "refurbished"
        ? "Refurbished"
        : "New";

  const gradeLabel =
    refurbishedGrade
      ? getRefurbishedGradeLabel(
          refurbishedGrade,
          language
        )
      : null;

  const batteryLabel =
    batteryGrade
      ? getBatteryGradeLabel(
          batteryGrade,
          language
        )
      : null;

  const safeCustomerName =
    escapeHtml(
      customerName
    );

  const safeProductName =
    escapeHtml(
      productName
    );

  const safeOrderNumber =
    escapeHtml(
      orderNumber
    );

  const safeReference =
    escapeHtml(
      paymentReference
    );

  const safeAccountName =
    escapeHtml(
      bank.account_name
    );

  const safeIban =
    escapeHtml(
      bank.iban
    );

  const safeBic =
    escapeHtml(
      bank.bic
    );

  const safeBankName =
    escapeHtml(
      bank.bank_name
    );

  const safeBankCountry =
    escapeHtml(
      bank.country
    );

  const safeStorage =
    storage
      ? escapeHtml(
          storage
        )
      : "";

  const safeColor =
    color
      ? escapeHtml(
          color
        )
      : "";

  const safeGradeLabel =
    gradeLabel
      ? escapeHtml(
          gradeLabel
        )
      : "";

  const safeBatteryLabel =
    batteryLabel
      ? escapeHtml(
          batteryLabel
        )
      : "";

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

  const refurbishedTextPt =
    condition ===
        "refurbished" &&
      gradeLabel &&
      batteryLabel
      ? `
Condição estética: ${gradeLabel}
Bateria: ${batteryLabel}
Preço base da configuração: ${formattedBaseUnitPrice}${
  batteryUpgradeAmount > 0
    ? `
Upgrade de bateria: +${formattedBatteryUpgrade}`
    : ""
}`
      : "";

  const refurbishedTextEn =
    condition ===
        "refurbished" &&
      gradeLabel &&
      batteryLabel
      ? `
Cosmetic grade: ${gradeLabel}
Battery: ${batteryLabel}
Base configuration price: ${formattedBaseUnitPrice}${
  batteryUpgradeAmount > 0
    ? `
Battery upgrade: +${formattedBatteryUpgrade}`
    : ""
}`
      : "";

  const cveTextPt =
    showCveEquivalent
      ? `

EQUIVALENTE APRESENTADO EM CVE

Preço unitário: ${formattedDisplayUnit}
Subtotal: ${formattedDisplaySubtotal}
Envio: ${formattedDisplayShipping}
Total: ${formattedDisplayTotal}
Taxa: 1 EUR = ${exchangeRate} CVE

Nota: o valor em CVE é apresentado para referência. A transferência bancária desta encomenda deve ser feita em EUR.`
      : "";

  const cveTextEn =
    showCveEquivalent
      ? `

CVE DISPLAY EQUIVALENT

Unit price: ${formattedDisplayUnit}
Subtotal: ${formattedDisplaySubtotal}
Shipping: ${formattedDisplayShipping}
Total: ${formattedDisplayTotal}
Rate: 1 EUR = ${exchangeRate} CVE

Note: the CVE amount is shown for reference. The bank transfer for this order must be made in EUR.`
      : "";

  const text =
    language ===
      "pt"
      ? `POKAPOK

Recebemos a sua encomenda.

Olá ${customerName},

Obrigado pela sua encomenda.

DETALHES DA ENCOMENDA

Número: ${orderNumber}
Produto: ${productName}
${storage ? `Armazenamento: ${storage}` : ""}
${color ? `Cor: ${color}` : ""}
Condição: ${conditionLabel}${refurbishedTextPt}
Quantidade: ${quantity}
Preço unitário final: ${formattedUnitPrice}
Subtotal: ${formattedSubtotal}
Envio: ${formattedShipping}
Total a transferir: ${formattedTotal}${cveTextPt}

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

Moeda da transferência:
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

ORDER DETAILS

Order number: ${orderNumber}
Product: ${productName}
${storage ? `Storage: ${storage}` : ""}
${color ? `Colour: ${color}` : ""}
Condition: ${conditionLabel}${refurbishedTextEn}
Quantity: ${quantity}
Final unit price: ${formattedUnitPrice}
Subtotal: ${formattedSubtotal}
Shipping: ${formattedShipping}
Total to transfer: ${formattedTotal}${cveTextEn}

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

Transfer currency:
${bank.currency}

Amount:
${formattedTotal}

PAYMENT REFERENCE / DESCRIPTION:
${paymentReference}

IMPORTANT:
Enter ${paymentReference} exactly in the reference, description or message field of your transfer.

This allows us to match your payment to order ${orderNumber}.

After payment is confirmed, we will send another confirmation.

POKAPOK`;

  const equivalentHtml =
    showCveEquivalent
      ? language ===
          "pt"
        ? `
          <div style="background:#eef4ff;border-radius:16px;padding:18px;margin:18px 0;border:1px solid #d7e5ff;">
            <div style="font-size:12px;font-weight:800;color:#5d6673;letter-spacing:.5px;">
              EQUIVALENTE EM CVE
            </div>

            <div style="font-size:24px;font-weight:900;color:#1261ff;margin-top:6px;">
              ${formattedDisplayTotal}
            </div>

            <div style="font-size:13px;color:#5d6673;margin-top:8px;">
              Subtotal: ${formattedDisplaySubtotal}
            </div>

            <div style="font-size:13px;color:#5d6673;margin-top:4px;">
              Envio: ${formattedDisplayShipping}
            </div>

            <div style="font-size:13px;color:#5d6673;margin-top:8px;">
              Taxa: 1 EUR = ${exchangeRate} CVE
            </div>

            <div style="font-size:13px;color:#5d6673;margin-top:6px;">
              O valor em CVE é informativo. A transferência deve ser feita em EUR.
            </div>
          </div>`
        : `
          <div style="background:#eef4ff;border-radius:16px;padding:18px;margin:18px 0;border:1px solid #d7e5ff;">
            <div style="font-size:12px;font-weight:800;color:#5d6673;letter-spacing:.5px;">
              CVE DISPLAY EQUIVALENT
            </div>

            <div style="font-size:24px;font-weight:900;color:#1261ff;margin-top:6px;">
              ${formattedDisplayTotal}
            </div>

            <div style="font-size:13px;color:#5d6673;margin-top:8px;">
              Subtotal: ${formattedDisplaySubtotal}
            </div>

            <div style="font-size:13px;color:#5d6673;margin-top:4px;">
              Shipping: ${formattedDisplayShipping}
            </div>

            <div style="font-size:13px;color:#5d6673;margin-top:8px;">
              Rate: 1 EUR = ${exchangeRate} CVE
            </div>

            <div style="font-size:13px;color:#5d6673;margin-top:6px;">
              The CVE amount is for reference. The bank transfer must be made in EUR.
            </div>
          </div>`
      : "";

  const refurbishedHtml =
    condition ===
        "refurbished" &&
      gradeLabel &&
      batteryLabel
      ? `
        <div style="margin-top:12px;padding-top:12px;border-top:1px solid #e2e4e8;">
          <div>
            <strong>${
              language ===
                "pt"
                ? "Condição estética"
                : "Cosmetic grade"
            }:</strong>
            ${safeGradeLabel}
          </div>

          <div style="margin-top:5px;">
            <strong>${
              language ===
                "pt"
                ? "Bateria"
                : "Battery"
            }:</strong>
            ${safeBatteryLabel}
          </div>

          ${
            batteryUpgradeAmount >
            0
              ? `
                <div style="margin-top:5px;">
                  <strong>${
                    language ===
                      "pt"
                      ? "Upgrade de bateria"
                      : "Battery upgrade"
                  }:</strong>
                  +${formattedBatteryUpgrade}
                </div>
              `
              : ""
          }
        </div>
      `
      : "";

  const html =
    language ===
      "pt"
      ? `
<!doctype html>
<html>
<body style="margin:0;padding:0;background:#f5f5f3;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;color:#111;">
  <div style="max-width:620px;margin:0 auto;padding:32px 20px;">
    <div style="background:#fff;border-radius:24px;padding:30px;border:1px solid #e5e5e5;">

      <div style="font-weight:900;letter-spacing:2px;color:#1261ff;margin-bottom:22px;">
        POKAPOK
      </div>

      <h1 style="font-size:28px;margin:0 0 10px;">
        Recebemos a sua encomenda.
      </h1>

      <p style="color:#555;line-height:1.6;">
        Olá ${safeCustomerName}, use os dados abaixo para concluir o pagamento.
      </p>

      <div style="background:#f6f7f9;border-radius:16px;padding:18px;margin:22px 0;">
        <strong>Encomenda ${safeOrderNumber}</strong>

        <br><br>

        ${safeProductName}<br>

        ${safeStorage ? `${safeStorage}<br>` : ""}

        ${safeColor ? `${safeColor}<br>` : ""}

        ${conditionLabel}<br>

        ${refurbishedHtml}

        <div style="margin-top:12px;">
          Quantidade: ${quantity}
        </div>

        <div style="margin-top:5px;">
          Preço unitário: ${formattedUnitPrice}
        </div>

        <div style="margin-top:5px;">
          Subtotal: ${formattedSubtotal}
        </div>

        <div style="margin-top:5px;">
          Envio: ${formattedShipping}
        </div>

        <div style="margin-top:12px;font-size:18px;">
          <strong>Total a transferir: ${formattedTotal}</strong>
        </div>
      </div>

      ${equivalentHtml}

      <h2 style="font-size:20px;">
        Morada de entrega
      </h2>

      <div style="background:#f6f7f9;border-radius:16px;padding:18px;margin:14px 0 22px;line-height:1.7;">
        ${htmlAddress}
      </div>

      <h2 style="font-size:20px;">
        Transferência bancária
      </h2>

      <p>
        <strong>Titular:</strong><br>
        ${safeAccountName}
      </p>

      <p>
        <strong>IBAN:</strong><br>
        ${safeIban}
      </p>

      <p>
        <strong>BIC / SWIFT:</strong><br>
        ${safeBic}
      </p>

      <p>
        <strong>Banco:</strong><br>
        ${safeBankName}
      </p>

      <p>
        <strong>País:</strong><br>
        ${safeBankCountry}
      </p>

      <p>
        <strong>Moeda:</strong><br>
        ${bank.currency}
      </p>

      <p>
        <strong>Montante:</strong><br>
        ${formattedTotal}
      </p>

      <div style="background:#111827;border-radius:16px;padding:18px;margin-top:22px;">
        <div style="font-size:12px;font-weight:700;color:#c7ccd4;">
          REFERÊNCIA / DESCRIÇÃO
        </div>

        <div style="font-size:24px;font-weight:900;color:#fff;margin-top:6px;">
          ${safeReference}
        </div>
      </div>

      <p style="color:#555;line-height:1.6;margin-top:22px;">
        Introduza esta referência exatamente no campo de descrição/mensagem da transferência.
      </p>

    </div>
  </div>
</body>
</html>`
      : `
<!doctype html>
<html>
<body style="margin:0;padding:0;background:#f5f5f3;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;color:#111;">
  <div style="max-width:620px;margin:0 auto;padding:32px 20px;">
    <div style="background:#fff;border-radius:24px;padding:30px;border:1px solid #e5e5e5;">

      <div style="font-weight:900;letter-spacing:2px;color:#1261ff;margin-bottom:22px;">
        POKAPOK
      </div>

      <h1 style="font-size:28px;margin:0 0 10px;">
        We received your order.
      </h1>

      <p style="color:#555;line-height:1.6;">
        Hi ${safeCustomerName}, use the bank details below to complete your payment.
      </p>

      <div style="background:#f6f7f9;border-radius:16px;padding:18px;margin:22px 0;">
        <strong>Order ${safeOrderNumber}</strong>

        <br><br>

        ${safeProductName}<br>

        ${safeStorage ? `${safeStorage}<br>` : ""}

        ${safeColor ? `${safeColor}<br>` : ""}

        ${conditionLabel}<br>

        ${refurbishedHtml}

        <div style="margin-top:12px;">
          Quantity: ${quantity}
        </div>

        <div style="margin-top:5px;">
          Unit price: ${formattedUnitPrice}
        </div>

        <div style="margin-top:5px;">
          Subtotal: ${formattedSubtotal}
        </div>

        <div style="margin-top:5px;">
          Shipping: ${formattedShipping}
        </div>

        <div style="margin-top:12px;font-size:18px;">
          <strong>Total to transfer: ${formattedTotal}</strong>
        </div>
      </div>

      ${equivalentHtml}

      <h2 style="font-size:20px;">
        Delivery address
      </h2>

      <div style="background:#f6f7f9;border-radius:16px;padding:18px;margin:14px 0 22px;line-height:1.7;">
        ${htmlAddress}
      </div>

      <h2 style="font-size:20px;">
        Bank transfer
      </h2>

      <p>
        <strong>Account holder:</strong><br>
        ${safeAccountName}
      </p>

      <p>
        <strong>IBAN:</strong><br>
        ${safeIban}
      </p>

      <p>
        <strong>BIC / SWIFT:</strong><br>
        ${safeBic}
      </p>

      <p>
        <strong>Bank:</strong><br>
        ${safeBankName}
      </p>

      <p>
        <strong>Country:</strong><br>
        ${safeBankCountry}
      </p>

      <p>
        <strong>Currency:</strong><br>
        ${bank.currency}
      </p>

      <p>
        <strong>Amount:</strong><br>
        ${formattedTotal}
      </p>

      <div style="background:#111827;border-radius:16px;padding:18px;margin-top:22px;">
        <div style="font-size:12px;font-weight:700;color:#c7ccd4;">
          PAYMENT REFERENCE
        </div>

        <div style="font-size:24px;font-weight:900;color:#fff;margin-top:6px;">
          ${safeReference}
        </div>
      </div>

    </div>
  </div>
</body>
</html>`;

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

      /*
       * IMPORTANT:
       * Do not fall back to the old Lumina sender.
       *
       * Example secret:
       *
       * POKAPOK_FROM_EMAIL="POKAPOK <orders@pokapok.cv>"
       */
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

      /*
       * Resend is required whenever the customer supplies
       * an email address.
       *
       * We validate the configuration here so a broken
       * deployment is easy to detect.
       */
      if (
        !resendApiKey
      ) {
        return serverError(
          "RESEND_CONFIGURATION_MISSING",
          "RESEND_API_KEY is not configured."
        );
      }

      if (
        !fromEmail
      ) {
        return serverError(
          "RESEND_CONFIGURATION_MISSING",
          "POKAPOK_FROM_EMAIL is not configured."
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
         PRODUCT
      =================================================== */

      const productId =
        cleanString(
          body.product_id
        );

      const variantId =
        cleanString(
          body.variant_id
        ) ||
        null;

      const conditionRaw =
        cleanString(
          body.condition
        ).toLowerCase();

      const refurbishedGradeRaw =
        cleanString(
          body.refurbished_grade
        );

      const batteryGradeRaw =
        cleanString(
          body.battery_grade
        );

      /* ===================================================
         ORDER / PAYMENT
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

      const quantity =
        Number(
          body.quantity ??
            1
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

      /* ===================================================
         DESTINATION VALIDATION
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
         PRODUCT VALIDATION
      =================================================== */

      if (
        !productId
      ) {
        return badRequest(
          "PRODUCT_REQUIRED",
          "Product ID is required."
        );
      }

      if (
        conditionRaw !==
          "new" &&
        conditionRaw !==
          "refurbished"
      ) {
        return badRequest(
          "INVALID_CONDITION",
          "Invalid product condition."
        );
      }

      const condition =
        conditionRaw as
          SellCondition;

      if (
        !Number.isInteger(
          quantity
        ) ||
        quantity < 1 ||
        quantity > 10
      ) {
        return badRequest(
          "INVALID_QUANTITY",
          "Quantity must be a whole number between 1 and 10."
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
         REFURBISHED CONFIGURATION VALIDATION
      =================================================== */

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
            refurbishedGradeRaw
          );

        batteryGrade =
          normalizeBatteryGrade(
            batteryGradeRaw
          );

        if (
          !variantId
        ) {
          return badRequest(
            "REFURBISHED_VARIANT_REQUIRED",
            "A variant is required for a refurbished order."
          );
        }

        if (
          !refurbishedGrade
        ) {
          return badRequest(
            "REFURBISHED_GRADE_REQUIRED",
            "A valid refurbished cosmetic grade is required."
          );
        }

        if (
          !batteryGrade
        ) {
          return badRequest(
            "BATTERY_GRADE_REQUIRED",
            "A valid battery option is required."
          );
        }
      } else {
        if (
          refurbishedGradeRaw ||
          batteryGradeRaw
        ) {
          return badRequest(
            "INVALID_REFURBISHED_CONFIGURATION",
            "Refurbished grade and battery options cannot be used with a new product."
          );
        }
      }

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
          productError
        );

        return serverError(
          "PRODUCT_QUERY_FAILED",
          "Could not load product."
        );
      }

      if (
        !productData
      ) {
        return badRequest(
          "PRODUCT_NOT_FOUND",
          "The selected product could not be found."
        );
      }

      const product =
        productData as
          ProductRow;

      if (
        !product.published ||
        !product.available
      ) {
        return badRequest(
          "PRODUCT_UNAVAILABLE",
          "This product is currently unavailable."
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
          "NEW_NOT_AVAILABLE",
          "This product is not available as new."
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
          "REFURBISHED_NOT_AVAILABLE",
          "This product is not available refurbished."
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
            variantError
          );

          return serverError(
            "VARIANT_QUERY_FAILED",
            "Could not load product variant."
          );
        }

        if (
          !variantData
        ) {
          return badRequest(
            "VARIANT_NOT_FOUND",
            "The selected product variant could not be found."
          );
        }

        variant =
          variantData as
            VariantRow;

        if (
          !variant.available
        ) {
          return badRequest(
            "VARIANT_UNAVAILABLE",
            "The selected product variant is currently unavailable."
          );
        }
      }

      /* ===================================================
         AUTHORITATIVE BASE PRICE
      =================================================== */

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

        const message =
          code ===
            "REFURBISHED_GRADE_PRICE_NOT_AVAILABLE"
            ? "No valid price is configured for the selected refurbished cosmetic grade."
            : code ===
                "REFURBISHED_VARIANT_REQUIRED"
              ? "A product variant is required for this refurbished configuration."
              : code ===
                  "REFURBISHED_GRADE_REQUIRED"
                ? "A refurbished cosmetic grade is required."
                : code ===
                    "NEW_NOT_AVAILABLE"
                  ? "This product is not available as new."
                  : code ===
                      "REFURBISHED_NOT_AVAILABLE"
                    ? "This product is not available refurbished."
                    : "The selected configuration does not have a valid price.";

        return badRequest(
          code,
          message
        );
      }

      if (
        !Number.isFinite(
          baseUnitPrice
        ) ||
        baseUnitPrice <= 0
      ) {
        return badRequest(
          "PRICE_NOT_AVAILABLE",
          "The selected configuration does not have a valid price."
        );
      }

      /* ===================================================
         BATTERY PRICE
      =================================================== */

      const batteryUpgradeAmount =
        condition ===
            "refurbished" &&
          batteryGrade ===
            "new"
          ? NEW_BATTERY_UPGRADE_PRICE
          : 0;

      /* ===================================================
         FINAL UNIT PRICE
      =================================================== */

      const unitPrice =
        roundMoney(
          baseUnitPrice +
            batteryUpgradeAmount
        );

      /* ===================================================
         SUBTOTAL
      =================================================== */

      const subtotalAmount =
        roundMoney(
          unitPrice *
            quantity
        );

      /* ===================================================
         FINAL TOTAL
      =================================================== */

      const totalAmount =
        roundMoney(
          subtotalAmount +
            shippingAmount
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
          unitPrice,
          displayCurrency
        );

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
         PRODUCT DISPLAY DATA
      =================================================== */

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
         IDENTIFIERS
      =================================================== */

      const orderNumber =
        createOrderNumber();

      const paymentReference =
        createPaymentReference();

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

            quantity,

            unit_price:
              unitPrice,

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
              displayUnitPrice,

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

              productName,
              storage,
              color,
              condition,

              refurbishedGrade,
              batteryGrade,
              batteryUpgradeAmount,

              quantity,

              baseUnitPrice,
              unitPrice,
              subtotalAmount,
              shippingAmount,
              totalAmount,

              displayCurrency,
              displayUnitPrice,
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

        pricing: {
          currency:
            SETTLEMENT_CURRENCY,

          base_unit_price:
            baseUnitPrice,

          battery_upgrade_amount:
            batteryUpgradeAmount,

          unit_price:
            unitPrice,

          quantity,

          subtotal_amount:
            subtotalAmount,

          shipping_amount:
            shippingAmount,

          total_amount:
            totalAmount,

          display_currency:
            displayCurrency,

          display_unit_price:
            displayUnitPrice,

          display_subtotal_amount:
            displaySubtotalAmount,

          display_shipping_amount:
            displayShippingAmount,

          display_total_amount:
            displayTotalAmount,

          exchange_rate:
            exchangeRate,
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