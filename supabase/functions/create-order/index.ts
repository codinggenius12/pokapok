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

type ProductRow = {
  id: string;
  name: string;
  slug: string;
  condition:
    | SellCondition
    | "used";
  refurbished_enabled: boolean;
  sale_price:
    | number
    | string
    | null;
  promotional_price:
    | number
    | string
    | null;
  available: boolean;
  published: boolean;
};

type VariantRow = {
  id: string;
  product_id: string;
  storage:
    | string
    | null;
  color:
    | string
    | null;
  sku:
    | string
    | null;
  available: boolean;
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
};

type BankDetails = {
  account_name: string;
  iban: string;
  bic: string;
  bank_name: string;
  country: string;
  currency: string;
};

/* =========================================================
   CURRENCY

   Product prices remain authoritative in EUR.

   The Cape Verde escudo is pegged to the euro at:
   1 EUR = 110.265 CVE.

   CVE is a DISPLAY currency in the current checkout.
   Bank transfers are settled in EUR.
========================================================= */

const EUR_TO_CVE =
  110.265;

const SETTLEMENT_CURRENCY =
  "EUR";

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
  status = 200
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
  message: string
) {
  return jsonResponse(
    {
      success: false,
      error: message,
    },
    400
  );
}

/* =========================================================
   GENERAL HELPERS
========================================================= */

function cleanString(
  value: unknown
) {
  return String(
    value ??
    ""
  ).trim();
}

function toNumber(
  value: unknown
) {
  const parsed =
    Number(
      value
    );

  return Number.isFinite(
    parsed
  )
    ? parsed
    : 0;
}

function toNullableNumber(
  value: unknown
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
  value: number
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
  email: string
) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email
  );
}

function normalizeDisplayCurrency(
  value: unknown
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

function convertEurForDisplay(
  eurAmount: number,
  displayCurrency:
    DisplayCurrency
) {
  if (
    displayCurrency ===
    "CVE"
  ) {
    /*
     * Match the storefront:
     * display CVE as whole escudos.
     */
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
  amount: number,
  currency: string,
  language: Language
) {
  const locale =
    language === "pt"
      ? "pt-PT"
      : "en-IE";

  if (
    currency === "CVE"
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
  length: number
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
    (byte) =>
      alphabet[
        byte %
        alphabet.length
      ]
  ).join("");
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
  value: string
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
    product
      .refurbished_enabled
  );
}

/* =========================================================
   AUTHORITATIVE VARIANT PRICE

   Existing pricing behavior is intentionally preserved.

   1. NEW product sold as new
      -> variant.sale_price / promotional_price

   2. Dedicated REFURBISHED product
      -> variant.sale_price / promotional_price

   3. NEW product with optional refurbished condition
      -> variant.refurbished_sale_price /
         refurbished_promotional_price

   Currency conversion is applied only AFTER the EUR price
   has been securely resolved from Supabase.
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
    toNumber(
      normalPrice
    );

  const promotional =
    toNullableNumber(
      promotionalPrice
    );

  if (
    normal <= 0
  ) {
    return null;
  }

  if (
    promotional !==
      null &&
    promotional > 0 &&
    promotional <
      normal
  ) {
    return promotional;
  }

  return normal;
}

function getVariantPrice(
  product:
    ProductRow,
  variant:
    VariantRow,
  condition:
    SellCondition
) {
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
        "This product is not available as new."
      );
    }

    const price =
      activePrice(
        variant
          .sale_price,
        variant
          .promotional_price
      );

    if (
      price === null
    ) {
      throw new Error(
        "Variant price is not configured."
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
      "This product is not available refurbished."
    );
  }

  if (
    product.condition ===
    "refurbished"
  ) {
    const price =
      activePrice(
        variant
          .sale_price,
        variant
          .promotional_price
      );

    if (
      price === null
    ) {
      throw new Error(
        "Refurbished variant price is not configured."
      );
    }

    return price;
  }

  const price =
    activePrice(
      variant
        .refurbished_sale_price,
      variant
        .refurbished_promotional_price
    );

  if (
    price === null
  ) {
    throw new Error(
      "Refurbished variant price is not configured."
    );
  }

  return price;
}

/* =========================================================
   LEGACY PRODUCT-LEVEL FALLBACK

   Used only when the request genuinely has no variant_id.
========================================================= */

function getProductFallbackPrice(
  product:
    ProductRow,
  condition:
    SellCondition
) {
  if (
    condition ===
      "refurbished" &&
    product.condition !==
      "refurbished"
  ) {
    throw new Error(
      "A variant is required for this refurbished configuration."
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
      "This product is not available as new."
    );
  }

  const price =
    activePrice(
      product.sale_price,
      product
        .promotional_price
    );

  if (
    price === null
  ) {
    throw new Error(
      "This product does not have a valid sale price."
    );
  }

  return price;
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
  quantity,
  unitPrice,
  totalAmount,
  displayCurrency,
  displayUnitPrice,
  displayTotalAmount,
  exchangeRate,
  paymentReference,
  bank,
  language,
}: {
  resendApiKey: string;
  fromEmail: string;
  customerEmail: string;
  customerName: string;
  customerCountry: string;
  customerStateRegion: string;
  customerCity: string;
  customerStreet: string;
  customerHouseNumber: string;
  customerAddressLine2: string;
  customerPostalCode: string;
  orderNumber: string;
  productName: string;
  storage:
    | string
    | null;
  color:
    | string
    | null;
  condition:
    SellCondition;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  displayCurrency:
    DisplayCurrency;
  displayUnitPrice:
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
  const formattedUnitPrice =
    formatMoney(
      unitPrice,
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
    language === "pt"
      ? condition ===
          "refurbished"
        ? "Recondicionado"
        : "Novo"
      : condition ===
          "refurbished"
        ? "Refurbished"
        : "New";

  const safeCustomerName =
    escapeHtml(customerName);

  const safeCustomerCountry =
    escapeHtml(customerCountry);

  const safeCustomerStateRegion =
    escapeHtml(customerStateRegion);

  const safeCustomerCity =
    escapeHtml(customerCity);

  const safeCustomerStreet =
    escapeHtml(customerStreet);

  const safeCustomerHouseNumber =
    customerHouseNumber ? escapeHtml(customerHouseNumber) : "";

  const safeCustomerAddressLine2 =
    customerAddressLine2 ? escapeHtml(customerAddressLine2) : "";

  const safeCustomerPostalCode =
    customerPostalCode ? escapeHtml(customerPostalCode) : "";

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

  const subject =
    language === "pt"
      ? `Instruções de pagamento — ${orderNumber}`
      : `Payment instructions — ${orderNumber}`;

  const cveTextPt =
    showCveEquivalent
      ? `

EQUIVALENTE APRESENTADO EM CVE

Preço unitário: ${formattedDisplayUnit}
Total: ${formattedDisplayTotal}
Taxa: 1 EUR = ${exchangeRate} CVE

Nota: o valor em CVE é apresentado para referência. A transferência bancária desta encomenda deve ser feita em EUR.`
      : "";

  const cveTextEn =
    showCveEquivalent
      ? `

CVE DISPLAY EQUIVALENT

Unit price: ${formattedDisplayUnit}
Total: ${formattedDisplayTotal}
Rate: 1 EUR = ${exchangeRate} CVE

Note: the CVE amount is shown for reference. The bank transfer for this order must be made in EUR.`
      : "";

  const text =
    language === "pt"
      ? `POKAPOK

Recebemos a sua encomenda.

Olá ${customerName},

Obrigado pela sua encomenda.

DETALHES DA ENCOMENDA

Número: ${orderNumber}
Produto: ${productName}
${storage ? `Armazenamento: ${storage}` : ""}
${color ? `Cor: ${color}` : ""}
Condição: ${conditionLabel}
Quantidade: ${quantity}
Preço unitário: ${formattedUnitPrice}
Total a transferir: ${formattedTotal}${cveTextPt}

MORADA DE ENTREGA

${customerStreet}${customerHouseNumber ? `, ${customerHouseNumber}` : ""}
${customerAddressLine2 ? `${customerAddressLine2}\n` : ""}${customerPostalCode ? `${customerPostalCode} ` : ""}${customerCity}
${customerStateRegion}
${customerCountry}

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
Condition: ${conditionLabel}
Quantity: ${quantity}
Unit price: ${formattedUnitPrice}
Total to transfer: ${formattedTotal}${cveTextEn}

DELIVERY ADDRESS

${customerStreet}${customerHouseNumber ? `, ${customerHouseNumber}` : ""}
${customerAddressLine2 ? `${customerAddressLine2}\n` : ""}${customerPostalCode ? `${customerPostalCode} ` : ""}${customerCity}
${customerStateRegion}
${customerCountry}

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
      ? language === "pt"
        ? `
          <div style="background:#eef4ff;border-radius:16px;padding:18px;margin:18px 0;border:1px solid #d7e5ff;">
            <div style="font-size:12px;font-weight:800;color:#5d6673;letter-spacing:.5px;">EQUIVALENTE EM CVE</div>
            <div style="font-size:24px;font-weight:900;color:#1261ff;margin-top:6px;">${formattedDisplayTotal}</div>
            <div style="font-size:13px;color:#5d6673;margin-top:8px;">Taxa: 1 EUR = ${exchangeRate} CVE</div>
            <div style="font-size:13px;color:#5d6673;margin-top:6px;">O valor em CVE é informativo. A transferência deve ser feita em EUR.</div>
          </div>`
        : `
          <div style="background:#eef4ff;border-radius:16px;padding:18px;margin:18px 0;border:1px solid #d7e5ff;">
            <div style="font-size:12px;font-weight:800;color:#5d6673;letter-spacing:.5px;">CVE DISPLAY EQUIVALENT</div>
            <div style="font-size:24px;font-weight:900;color:#1261ff;margin-top:6px;">${formattedDisplayTotal}</div>
            <div style="font-size:13px;color:#5d6673;margin-top:8px;">Rate: 1 EUR = ${exchangeRate} CVE</div>
            <div style="font-size:13px;color:#5d6673;margin-top:6px;">The CVE amount is for reference. The bank transfer must be made in EUR.</div>
          </div>`
      : "";

  const html =
    language === "pt"
      ? `
<!doctype html>
<html>
<body style="margin:0;padding:0;background:#f5f5f3;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;color:#111;">
  <div style="max-width:620px;margin:0 auto;padding:32px 20px;">
    <div style="background:#fff;border-radius:24px;padding:30px;border:1px solid #e5e5e5;">
      <div style="font-weight:900;letter-spacing:2px;color:#1261ff;margin-bottom:22px;">POKAPOK</div>

      <h1 style="font-size:28px;margin:0 0 10px;">Recebemos a sua encomenda.</h1>
      <p style="color:#555;line-height:1.6;">Olá ${safeCustomerName}, use os dados abaixo para concluir o pagamento.</p>

      <div style="background:#f6f7f9;border-radius:16px;padding:18px;margin:22px 0;">
        <strong>Encomenda ${safeOrderNumber}</strong><br><br>
        ${safeProductName}<br>
        ${safeStorage ? `${safeStorage}<br>` : ""}
        ${safeColor ? `${safeColor}<br>` : ""}
        ${conditionLabel}<br>
        Quantidade: ${quantity}<br><br>
        <strong>Total a transferir: ${formattedTotal}</strong>
      </div>

      ${equivalentHtml}

      <h2 style="font-size:20px;">Morada de entrega</h2>
      <div style="background:#f6f7f9;border-radius:16px;padding:18px;margin:14px 0 22px;line-height:1.7;">
        ${safeCustomerStreet}${safeCustomerHouseNumber ? `, ${safeCustomerHouseNumber}` : ""}<br>
        ${safeCustomerAddressLine2 ? `${safeCustomerAddressLine2}<br>` : ""}
        ${safeCustomerPostalCode ? `${safeCustomerPostalCode} ` : ""}${safeCustomerCity}<br>
        ${safeCustomerStateRegion}<br>
        ${safeCustomerCountry}
      </div>

      <h2 style="font-size:20px;">Transferência bancária</h2>
      <p><strong>Titular:</strong><br>${safeAccountName}</p>
      <p><strong>IBAN:</strong><br>${safeIban}</p>
      <p><strong>BIC / SWIFT:</strong><br>${safeBic}</p>
      <p><strong>Banco:</strong><br>${safeBankName}</p>
      <p><strong>País:</strong><br>${safeBankCountry}</p>
      <p><strong>Moeda:</strong><br>${bank.currency}</p>
      <p><strong>Montante:</strong><br>${formattedTotal}</p>

      <div style="background:#111827;border-radius:16px;padding:18px;margin-top:22px;">
        <div style="font-size:12px;font-weight:700;color:#c7ccd4;">REFERÊNCIA / DESCRIÇÃO</div>
        <div style="font-size:24px;font-weight:900;color:#fff;margin-top:6px;">${safeReference}</div>
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
      <div style="font-weight:900;letter-spacing:2px;color:#1261ff;margin-bottom:22px;">POKAPOK</div>

      <h1 style="font-size:28px;margin:0 0 10px;">We received your order.</h1>
      <p style="color:#555;line-height:1.6;">Hi ${safeCustomerName}, use the bank details below to complete your payment.</p>

      <div style="background:#f6f7f9;border-radius:16px;padding:18px;margin:22px 0;">
        <strong>Order ${safeOrderNumber}</strong><br><br>
        ${safeProductName}<br>
        ${safeStorage ? `${safeStorage}<br>` : ""}
        ${safeColor ? `${safeColor}<br>` : ""}
        ${conditionLabel}<br>
        Quantity: ${quantity}<br><br>
        <strong>Total to transfer: ${formattedTotal}</strong>
      </div>

      ${equivalentHtml}

      <h2 style="font-size:20px;">Delivery address</h2>
      <div style="background:#f6f7f9;border-radius:16px;padding:18px;margin:14px 0 22px;line-height:1.7;">
        ${safeCustomerStreet}${safeCustomerHouseNumber ? `, ${safeCustomerHouseNumber}` : ""}<br>
        ${safeCustomerAddressLine2 ? `${safeCustomerAddressLine2}<br>` : ""}
        ${safeCustomerPostalCode ? `${safeCustomerPostalCode} ` : ""}${safeCustomerCity}<br>
        ${safeCustomerStateRegion}<br>
        ${safeCustomerCountry}
      </div>

      <h2 style="font-size:20px;">Bank transfer</h2>
      <p><strong>Account holder:</strong><br>${safeAccountName}</p>
      <p><strong>IBAN:</strong><br>${safeIban}</p>
      <p><strong>BIC / SWIFT:</strong><br>${safeBic}</p>
      <p><strong>Bank:</strong><br>${safeBankName}</p>
      <p><strong>Country:</strong><br>${safeBankCountry}</p>
      <p><strong>Currency:</strong><br>${bank.currency}</p>
      <p><strong>Amount:</strong><br>${formattedTotal}</p>

      <div style="background:#111827;border-radius:16px;padding:18px;margin-top:22px;">
        <div style="font-size:12px;font-weight:700;color:#c7ccd4;">PAYMENT REFERENCE</div>
        <div style="font-size:24px;font-weight:900;color:#fff;margin-top:6px;">${safeReference}</div>
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
    req: Request
  ) => {
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
          success: false,

          error:
            "Method not allowed.",
        },
        405
      );
    }

    try {
      /* =====================================================
         ENVIRONMENT
      ===================================================== */

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
       * New POKAPOK names are preferred.
       * The old LUMINA names remain as fallbacks so your
       * existing Supabase secrets keep working immediately.
       */
      const fromEmail =
        Deno.env.get(
          "POKAPOK_FROM_EMAIL"
        ) ??
        Deno.env.get(
          "LUMINA_FROM_EMAIL"
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

      if (
        !supabaseUrl
      ) {
        throw new Error(
          "SUPABASE_URL is not configured."
        );
      }

      if (
        !serviceRoleKey
      ) {
        throw new Error(
          "SUPABASE_SERVICE_ROLE_KEY is not configured."
        );
      }

      if (
        !accountName ||
        !iban ||
        !bic ||
        !bankName
      ) {
        throw new Error(
          "Bank transfer details are not fully configured."
        );
      }

      /*
       * Current receiving account / checkout is EUR.
       * CVE is intentionally not accepted as the settlement
       * currency until a CVE-capable receiving rail is added.
       */
      if (
        configuredBankCurrency !==
        SETTLEMENT_CURRENCY
      ) {
        throw new Error(
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

      /* =====================================================
         REQUEST BODY
      ===================================================== */

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
          "Invalid request body."
        );
      }

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

      const customerCountry =
        cleanString(body.customer_country);

      const customerStateRegion =
        cleanString(body.customer_state_region);

      const customerCity =
        cleanString(body.customer_city);

      const customerStreet =
        cleanString(body.customer_street);

      const customerHouseNumber =
        cleanString(body.customer_house_number);

      const customerAddressLine2 =
        cleanString(body.customer_address_line_2);

      const customerPostalCode =
        cleanString(body.customer_postal_code);

      const customerNotes =
        cleanString(
          body.customer_notes
        );

      const productId =
        cleanString(
          body.product_id
        );

      const variantId =
        cleanString(
          body.variant_id
        ) || null;

      const conditionRaw =
        cleanString(
          body.condition
        ).toLowerCase();

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

      /* =====================================================
         INPUT VALIDATION
      ===================================================== */

      if (
        !customerName
      ) {
        return badRequest(
          "Customer name is required."
        );
      }

      if (
        !customerEmail ||
        !isValidEmail(
          customerEmail
        )
      ) {
        return badRequest(
          "A valid customer email is required."
        );
      }

      if (
        !customerWhatsapp ||
        !customerCountry ||
        !customerStateRegion ||
        !customerCity ||
        !customerStreet
      ) {
        return badRequest(
          "Complete delivery address is required."
        );
      }

      if (
        !productId
      ) {
        return badRequest(
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
          "Invalid product condition."
        );
      }

      if (
        displayCurrency ===
        null
      ) {
        return badRequest(
          "Invalid display currency. Use CVE or EUR."
        );
      }

      const condition =
        conditionRaw as
          SellCondition;

      if (
        !Number.isInteger(
          quantity
        ) ||
        quantity < 1
      ) {
        return badRequest(
          "Quantity must be a positive whole number."
        );
      }

      if (
        paymentMethod !==
        "bank_transfer"
      ) {
        return badRequest(
          "Only bank transfer is currently available."
        );
      }

      /* =====================================================
         PRODUCT
      ===================================================== */

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

        throw new Error(
          `Could not load product: ${productError.message}`
        );
      }

      if (
        !productData
      ) {
        return badRequest(
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
          "This product is not available refurbished."
        );
      }

      /* =====================================================
         VARIANT
      ===================================================== */

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
              refurbished_promotional_price
            `)
            .eq(
              "id",
              variantId
            )
            .maybeSingle();

        if (
          variantError
        ) {
          console.error(
            "Variant lookup error:",
            variantError
          );

          throw new Error(
            `Could not load product variant: ${variantError.message}`
          );
        }

        if (
          !variantData
        ) {
          return badRequest(
            "The selected product variant could not be found."
          );
        }

        variant =
          variantData as
            VariantRow;

        if (
          variant.product_id !==
          product.id
        ) {
          return badRequest(
            "The selected variant does not belong to this product."
          );
        }

        if (
          !variant.available
        ) {
          return badRequest(
            "The selected product variant is currently unavailable."
          );
        }
      }

      /* =====================================================
         AUTHORITATIVE EUR PRICE
      ===================================================== */

      let unitPrice:
        number;

      try {
        unitPrice =
          roundMoney(
            variant
              ? getVariantPrice(
                  product,
                  variant,
                  condition
                )
              : getProductFallbackPrice(
                  product,
                  condition
                )
          );
      } catch (
        error
      ) {
        return badRequest(
          error instanceof Error
            ? error.message
            : "Invalid product price."
        );
      }

      if (
        !Number.isFinite(
          unitPrice
        ) ||
        unitPrice <= 0
      ) {
        return badRequest(
          "The selected configuration does not have a valid price."
        );
      }

      const totalAmount =
        roundMoney(
          unitPrice *
          quantity
        );

      /*
       * Display conversion is server-calculated.
       * The browser never supplies an exchange rate.
       */
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

      const displayTotalAmount =
        convertEurForDisplay(
          totalAmount,
          displayCurrency
        );

      const productName =
        cleanString(
          product.name
        );

      const storage =
        variant?.storage
          ? cleanString(
              variant.storage
            )
          : null;

      const color =
        variant?.color
          ? cleanString(
              variant.color
            )
          : null;

      /* =====================================================
         IDENTIFIERS
      ===================================================== */

      const orderNumber =
        createOrderNumber();

      const paymentReference =
        createPaymentReference();

      /* =====================================================
         INSERT ORDER
      ===================================================== */

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
              customerEmail,

            customer_whatsapp:
              customerWhatsapp ||
              null,

            customer_country:
              customerCountry || null,

            customer_state_region:
              customerStateRegion || null,

            customer_city:
              customerCity || null,

            customer_street:
              customerStreet || null,

            customer_house_number:
              customerHouseNumber || null,

            customer_address_line_2:
              customerAddressLine2 || null,

            customer_postal_code:
              customerPostalCode || null,

            customer_notes:
              customerNotes ||
              null,

            language,

            product_id:
              product.id,

            variant_id:
              variant?.id ??
              null,

            product_name:
              productName,

            storage,

            color,

            condition,

            quantity,

            /*
             * Authoritative settlement amounts stay EUR.
             */
            unit_price:
              unitPrice,

            total_amount:
              totalAmount,

            currency:
              SETTLEMENT_CURRENCY,

            /*
             * Customer display values are stored separately.
             */
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

        throw new Error(
          `Could not create order: ${insertError.message}`
        );
      }

      /* =====================================================
         EMAIL

         The order remains created even if Resend fails.
      ===================================================== */

      let emailSent =
        false;

      let warning:
        | string
        | null =
        null;

      if (
        resendApiKey &&
        fromEmail
      ) {
        try {
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
            quantity,
            unitPrice,
            totalAmount,
            displayCurrency,
            displayUnitPrice,
            displayTotalAmount,
            exchangeRate,
            paymentReference,
            bank,
            language,
          });

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
            "Order created, but the confirmation email could not be sent.";
        }
      } else {
        warning =
          "Order created, but email is not configured.";
      }

      /* =====================================================
         SUCCESS
      ===================================================== */

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

          unit_price:
            unitPrice,

          quantity,

          total_amount:
            totalAmount,

          display_currency:
            displayCurrency,

          display_unit_price:
            displayUnitPrice,

          display_total_amount:
            displayTotalAmount,

          exchange_rate:
            exchangeRate,
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

      return jsonResponse(
        {
          success:
            false,

          error:
            error instanceof Error
              ? error.message
              : "Unexpected create-order error.",
        },
        500
      );
    }
  }
);
