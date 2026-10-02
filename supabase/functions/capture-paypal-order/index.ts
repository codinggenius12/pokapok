import { createClient } from "@supabase/supabase-js";

/* =========================================================
   TYPES
========================================================= */

type Language =
  | "pt"
  | "en";

type SellCondition =
  | "new"
  | "refurbished";

type RequestBody = {
  paypalOrderId?: string;
};

type OrderRow = {
  id: string;

  order_number:
    string;

  customer_name:
    string;

  customer_email:
    | string
    | null;

  customer_whatsapp:
    string;

  customer_country:
    string;

  customer_state_region:
    string;

  customer_city:
    | string
    | null;

  customer_street:
    | string
    | null;

  customer_house_number:
    | string
    | null;

  customer_address_line_2:
    | string
    | null;

  customer_postal_code:
    | string
    | null;

  language:
    Language;

  product_name:
    string;

  storage:
    | string
    | null;

  color:
    | string
    | null;

  condition:
    SellCondition;

  quantity:
    number;

  unit_price:
    number
    | string;

  subtotal_amount:
    number
    | string
    | null;

  shipping_amount:
    number
    | string
    | null;

  total_amount:
    number
    | string;

  currency:
    string;

  display_currency:
    string
    | null;

  display_total_amount:
    number
    | string
    | null;

  exchange_rate:
    number
    | string
    | null;

  payment_method:
    string;

  payment_status:
    string;

  order_status:
    string;

  payment_received_at:
    string
    | null;

  paypal_order_id:
    string
    | null;

  paypal_capture_id:
    string
    | null;

  paypal_status:
    string
    | null;

  paypal_payer_id:
    string
    | null;
};

type PayPalCapture = {
  id?: string;

  status?: string;

  amount?: {
    currency_code?: string;

    value?: string;
  };
};

type PayPalPurchaseUnit = {
  reference_id?: string;

  custom_id?: string;

  invoice_id?: string;

  amount?: {
    currency_code?: string;

    value?: string;
  };

  payments?: {
    captures?: PayPalCapture[];
  };
};

type PayPalOrderResponse = {
  id?: string;

  status?: string;

  payer?: {
    payer_id?: string;
  };

  purchase_units?:
    PayPalPurchaseUnit[];

  raw?: string;

  [key: string]:
    unknown;
};

type VerifiedCapture = {
  captureId:
    string;

  captureStatus:
    string;

  currency:
    string;

  amount:
    number;

  payerId:
    string
    | null;

  pokapokOrderId:
    string
    | null;
};

/* =========================================================
   CONSTANTS
========================================================= */

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
   RESPONSES
========================================================= */

function jsonResponse(
  body: unknown,
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

function conflictResponse(
  message:
    string,

  code:
    string,

  extra?:
    Record<
      string,
      unknown
    >
) {
  return jsonResponse(
    {
      success:
        false,

      error:
        code,

      message,

      ...(extra ?? {}),
    },
    409
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

function toMoney(
  value:
    unknown
) {
  const parsed =
    Number(
      value
    );

  if (
    !Number.isFinite(
      parsed
    )
  ) {
    return null;
  }

  return (
    Math.round(
      (
        parsed +
        Number.EPSILON
      ) * 100
    ) / 100
  );
}

function moneyMatches(
  left:
    number,

  right:
    number
) {
  return (
    Math.round(
      left * 100
    ) ===
    Math.round(
      right * 100
    )
  );
}

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

function parseJsonObject(
  value:
    string
) {
  if (!value) {
    return {};
  }

  try {
    return JSON.parse(
      value
    ) as
      Record<
        string,
        unknown
      >;
  } catch {
    return {
      raw:
        value,
    };
  }
}

/* =========================================================
   ADDRESS
========================================================= */

function buildTextAddress(
  order:
    OrderRow
) {
  const lines:
    string[] = [];

  const streetLine =
    [
      cleanString(
        order.customer_street
      ),

      cleanString(
        order.customer_house_number
      ),
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

  const line2 =
    cleanString(
      order.customer_address_line_2
    );

  if (
    line2
  ) {
    lines.push(
      line2
    );
  }

  const cityLine =
    [
      cleanString(
        order.customer_postal_code
      ),

      cleanString(
        order.customer_city
      ),
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
    order.customer_state_region
  ) {
    lines.push(
      order.customer_state_region
    );
  }

  if (
    order.customer_country
  ) {
    lines.push(
      order.customer_country
    );
  }

  return lines.join(
    "\n"
  );
}

function buildHtmlAddress(
  order:
    OrderRow
) {
  return buildTextAddress(
    order
  )
    .split(
      "\n"
    )
    .filter(
      Boolean
    )
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
   EMAIL
========================================================= */

async function sendPaidOrderEmail({
  resendApiKey,
  fromEmail,
  order,
  captureId,
}: {
  resendApiKey:
    string;

  fromEmail:
    string;

  order:
    OrderRow;

  captureId:
    string;
}) {
  if (
    !order.customer_email
  ) {
    return;
  }

  const language =
    order.language ===
      "en"
      ? "en"
      : "pt";

  const totalAmount =
    toMoney(
      order.total_amount
    ) ??
    0;

  const subtotal =
    toMoney(
      order.subtotal_amount
    ) ??
    0;

  const shipping =
    toMoney(
      order.shipping_amount
    ) ??
    0;

  const unitPrice =
    toMoney(
      order.unit_price
    ) ??
    0;

  const displayTotal =
    toMoney(
      order.display_total_amount
    );

  const exchangeRate =
    toMoney(
      order.exchange_rate
    );

  const conditionLabel =
    language ===
      "pt"
      ? order.condition ===
          "refurbished"
        ? "Recondicionado"
        : "Novo"
      : order.condition ===
          "refurbished"
        ? "Refurbished"
        : "New";

  const formattedUnit =
    formatMoney(
      unitPrice,
      SETTLEMENT_CURRENCY,
      language
    );

  const formattedSubtotal =
    formatMoney(
      subtotal,
      SETTLEMENT_CURRENCY,
      language
    );

  const formattedShipping =
    formatMoney(
      shipping,
      SETTLEMENT_CURRENCY,
      language
    );

  const formattedTotal =
    formatMoney(
      totalAmount,
      SETTLEMENT_CURRENCY,
      language
    );

  const showCveEquivalent =
    order.display_currency ===
      "CVE" &&
    displayTotal !==
      null;

  const formattedDisplayTotal =
    showCveEquivalent &&
      displayTotal !==
        null
      ? formatMoney(
          displayTotal,
          "CVE",
          language
        )
      : null;

  const subject =
    language ===
      "pt"
      ? `Pagamento confirmado — ${order.order_number}`
      : `Payment confirmed — ${order.order_number}`;

  const address =
    buildTextAddress(
      order
    );

  const safeName =
    escapeHtml(
      order.customer_name
    );

  const safeOrderNumber =
    escapeHtml(
      order.order_number
    );

  const safeProduct =
    escapeHtml(
      order.product_name
    );

  const safeStorage =
    order.storage
      ? escapeHtml(
          order.storage
        )
      : "";

  const safeColor =
    order.color
      ? escapeHtml(
          order.color
        )
      : "";

  const safeCaptureId =
    escapeHtml(
      captureId
    );

  const htmlAddress =
    buildHtmlAddress(
      order
    );

  const text =
    language ===
      "pt"
      ? `POKAPOK

Pagamento confirmado.

Olá ${order.customer_name},

O pagamento da sua encomenda foi recebido com sucesso.

ENCOMENDA

Número: ${order.order_number}
Produto: ${order.product_name}
${order.storage ? `Armazenamento: ${order.storage}` : ""}
${order.color ? `Cor: ${order.color}` : ""}
Condição: ${conditionLabel}
Quantidade: ${order.quantity}
Preço unitário: ${formattedUnit}

Subtotal: ${formattedSubtotal}
Envio: ${formattedShipping}
Total pago: ${formattedTotal}

${showCveEquivalent && formattedDisplayTotal
  ? `Equivalente apresentado: ${formattedDisplayTotal}${
      exchangeRate !== null
        ? `\nTaxa: 1 EUR = ${exchangeRate} CVE`
        : ""
    }`
  : ""}

MORADA DE ENTREGA

${address}

PAGAMENTO

Método: PayPal
Estado: Pago
Referência PayPal: ${captureId}

A sua encomenda seguirá agora para processamento.

POKAPOK`
      : `POKAPOK

Payment confirmed.

Hi ${order.customer_name},

We successfully received payment for your order.

ORDER

Order number: ${order.order_number}
Product: ${order.product_name}
${order.storage ? `Storage: ${order.storage}` : ""}
${order.color ? `Colour: ${order.color}` : ""}
Condition: ${conditionLabel}
Quantity: ${order.quantity}
Unit price: ${formattedUnit}

Subtotal: ${formattedSubtotal}
Shipping: ${formattedShipping}
Total paid: ${formattedTotal}

${showCveEquivalent && formattedDisplayTotal
  ? `Displayed equivalent: ${formattedDisplayTotal}${
      exchangeRate !== null
        ? `\nRate: 1 EUR = ${exchangeRate} CVE`
        : ""
    }`
  : ""}

DELIVERY ADDRESS

${address}

PAYMENT

Method: PayPal
Status: Paid
PayPal reference: ${captureId}

Your order will now move to processing.

POKAPOK`;

  const equivalentHtml =
    showCveEquivalent &&
      formattedDisplayTotal
      ? `
        <div style="background:#eef4ff;border-radius:16px;padding:18px;margin-top:18px;border:1px solid #d7e5ff;">
          <div style="font-size:12px;font-weight:800;color:#5d6673;letter-spacing:.5px;">
            ${
              language ===
                "pt"
                ? "EQUIVALENTE EM CVE"
                : "CVE DISPLAY EQUIVALENT"
            }
          </div>

          <div style="font-size:24px;font-weight:900;color:#1261ff;margin-top:6px;">
            ${formattedDisplayTotal}
          </div>

          ${
            exchangeRate !==
            null
              ? `
                <div style="font-size:13px;color:#5d6673;margin-top:8px;">
                  1 EUR = ${exchangeRate} CVE
                </div>
              `
              : ""
          }
        </div>
      `
      : "";

  const html =
    `
<!doctype html>
<html>
<body style="margin:0;padding:0;background:#f5f5f3;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;color:#111;">
  <div style="max-width:620px;margin:0 auto;padding:32px 20px;">
    <div style="background:#fff;border-radius:24px;padding:30px;border:1px solid #e5e5e5;">

      <div style="font-weight:900;letter-spacing:2px;color:#1261ff;margin-bottom:22px;">
        POKAPOK
      </div>

      <div style="display:inline-block;background:#effaf2;color:#147a36;border:1px solid #cbe8d1;border-radius:999px;padding:7px 11px;font-size:12px;font-weight:800;">
        ${
          language ===
            "pt"
            ? "PAGAMENTO CONFIRMADO"
            : "PAYMENT CONFIRMED"
        }
      </div>

      <h1 style="font-size:28px;margin:18px 0 10px;">
        ${
          language ===
            "pt"
            ? "Recebemos o seu pagamento."
            : "We received your payment."
        }
      </h1>

      <p style="color:#555;line-height:1.6;">
        ${
          language ===
            "pt"
            ? `Olá ${safeName}, a sua encomenda está agora paga e seguirá para processamento.`
            : `Hi ${safeName}, your order is now paid and will move to processing.`
        }
      </p>

      <div style="background:#f6f7f9;border-radius:16px;padding:18px;margin:22px 0;">
        <strong>
          ${
            language ===
              "pt"
              ? "Encomenda"
              : "Order"
          } ${safeOrderNumber}
        </strong>

        <br><br>

        ${safeProduct}<br>

        ${
          safeStorage
            ? `${safeStorage}<br>`
            : ""
        }

        ${
          safeColor
            ? `${safeColor}<br>`
            : ""
        }

        ${conditionLabel}<br>

        ${
          language ===
            "pt"
            ? "Quantidade"
            : "Quantity"
        }: ${order.quantity}
      </div>

      <div style="border-top:1px solid #e5e5e5;padding-top:16px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
          <span style="color:#666;">${
            language ===
              "pt"
              ? "Subtotal"
              : "Subtotal"
          }</span>

          <strong>${formattedSubtotal}</strong>
        </div>

        <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
          <span style="color:#666;">${
            language ===
              "pt"
              ? "Envio"
              : "Shipping"
          }</span>

          <strong>${formattedShipping}</strong>
        </div>

        <div style="display:flex;justify-content:space-between;font-size:20px;border-top:1px solid #e5e5e5;padding-top:14px;margin-top:14px;">
          <strong>${
            language ===
              "pt"
              ? "Total pago"
              : "Total paid"
          }</strong>

          <strong>${formattedTotal}</strong>
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
            ? "Pagamento"
            : "Payment"
        }
      </h2>

      <div style="background:#f6f7f9;border-radius:16px;padding:18px;line-height:1.7;">
        <strong>PayPal</strong><br>

        ${
          language ===
            "pt"
            ? "Estado: Pago"
            : "Status: Paid"
        }

        <br>

        ${
          language ===
            "pt"
            ? "Referência"
            : "Reference"
        }: ${safeCaptureId}
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
              order.customer_email,
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

  const data =
    parseJsonObject(
      responseText
    );

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
      data
    );

    throw new Error(
      "PAYPAL_AUTH_FAILED"
    );
  }

  return accessToken;
}

async function getPayPalOrder(
  paypalOrderId:
    string,

  accessToken:
    string
) {
  const response =
    await fetch(
      `${getPayPalBaseUrl()}/v2/checkout/orders/${encodeURIComponent(
        paypalOrderId
      )}`,
      {
        method:
          "GET",

        headers: {
          Authorization:
            `Bearer ${accessToken}`,

          "Content-Type":
            "application/json",
        },

        signal:
          AbortSignal.timeout(
            10000
          ),
      }
    );

  const responseText =
    await response.text();

  const data =
    parseJsonObject(
      responseText
    ) as
      PayPalOrderResponse;

  return {
    ok:
      response.ok,

    status:
      response.status,

    data,
  };
}

async function capturePayPalPayment(
  paypalOrderId:
    string,

  accessToken:
    string
) {
  const response =
    await fetch(
      `${getPayPalBaseUrl()}/v2/checkout/orders/${encodeURIComponent(
        paypalOrderId
      )}/capture`,
      {
        method:
          "POST",

        headers: {
          Authorization:
            `Bearer ${accessToken}`,

          "Content-Type":
            "application/json",

          /*
           * Stable idempotency key for this specific
           * PayPal order.
           */
          "PayPal-Request-Id":
            `pokapok-capture-${paypalOrderId}`,
        },

        body:
          JSON.stringify(
            {}
          ),

        signal:
          AbortSignal.timeout(
            10000
          ),
      }
    );

  const responseText =
    await response.text();

  const data =
    parseJsonObject(
      responseText
    ) as
      PayPalOrderResponse;

  return {
    ok:
      response.ok,

    status:
      response.status,

    data,
  };
}

/* =========================================================
   PAYPAL VERIFICATION
========================================================= */

function getVerifiedCapture(
  paypalData:
    PayPalOrderResponse
):
  | VerifiedCapture
  | null {
  const purchaseUnits =
    paypalData
      .purchase_units ??
    [];

  for (
    const purchaseUnit
    of purchaseUnits
  ) {
    const captures =
      purchaseUnit
        .payments
        ?.captures ??
      [];

    for (
      const capture
      of captures
    ) {
      if (
        capture.status !==
          "COMPLETED"
      ) {
        continue;
      }

      const captureId =
        cleanString(
          capture.id
        );

      const currency =
        cleanString(
          capture.amount
            ?.currency_code
        ).toUpperCase();

      const amount =
        toMoney(
          capture.amount
            ?.value
        );

      if (
        !captureId ||
        !currency ||
        amount === null ||
        amount <= 0
      ) {
        continue;
      }

      return {
        captureId,

        captureStatus:
          "COMPLETED",

        currency,

        amount,

        payerId:
          cleanString(
            paypalData
              .payer
              ?.payer_id
          ) ||
          null,

        pokapokOrderId:
          cleanString(
            purchaseUnit
              .reference_id
          ) ||
          cleanString(
            purchaseUnit
              .custom_id
          ) ||
          null,
      };
    }
  }

  return null;
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

      const paypalOrderId =
        cleanString(
          body.paypalOrderId
        );

      if (
        !paypalOrderId
      ) {
        return badRequest(
          "PayPal order ID is required.",
          "PAYPAL_ORDER_ID_REQUIRED"
        );
      }

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
        ) ??
        Deno.env.get(
          "LUMINA_FROM_EMAIL"
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
         LOAD POKAPOK ORDER
      =================================================== */

      const {
        data:
          initialOrderData,

        error:
          initialOrderError,
      } =
        await supabase
          .from(
            "orders"
          )
          .select(
            `
            id,
            order_number,
            customer_name,
            customer_email,
            customer_whatsapp,
            customer_country,
            customer_state_region,
            customer_city,
            customer_street,
            customer_house_number,
            customer_address_line_2,
            customer_postal_code,
            language,
            product_name,
            storage,
            color,
            condition,
            quantity,
            unit_price,
            subtotal_amount,
            shipping_amount,
            total_amount,
            currency,
            display_currency,
            display_total_amount,
            exchange_rate,
            payment_method,
            payment_status,
            order_status,
            payment_received_at,
            paypal_order_id,
            paypal_capture_id,
            paypal_status,
            paypal_payer_id
            `
          )
          .eq(
            "paypal_order_id",
            paypalOrderId
          )
          .maybeSingle();

      if (
        initialOrderError
      ) {
        console.error(
          "Order lookup error:",
          initialOrderError
        );

        return serverError(
          "Could not load the POKAPOK order.",
          "ORDER_LOOKUP_FAILED"
        );
      }

      let order =
        initialOrderData as
          | OrderRow
          | null;

      /* ===================================================
         ALREADY FINALIZED

         If our DB already says paid, do not capture or
         email again.
      =================================================== */

      if (
        order &&
        order.payment_status ===
          "paid" &&
        order.paypal_capture_id
      ) {
        return jsonResponse({
          success:
            true,

          already_captured:
            true,

          already_finalized:
            true,

          order_id:
            order.id,

          order_number:
            order.order_number,

          email_sent:
            false,

          warning:
            null,

          paypal_order_id:
            paypalOrderId,

          paypal_status:
            order.paypal_status ??
            "COMPLETED",

          capture: {
            id:
              order.paypal_capture_id,

            status:
              "COMPLETED",

            currency:
              order.currency,

            amount:
              toMoney(
                order.total_amount
              ),
          },
        });
      }

      /* ===================================================
         PAYPAL AUTH
      =================================================== */

      const accessToken =
        await getPayPalAccessToken();

      /* ===================================================
         CHECK CURRENT PAYPAL ORDER
      =================================================== */

      let paypalResult =
        await getPayPalOrder(
          paypalOrderId,
          accessToken
        );

      if (
        !paypalResult.ok
      ) {
        return jsonResponse(
          {
            success:
              false,

            error:
              "PAYPAL_ORDER_LOOKUP_FAILED",

            message:
              "Could not verify the PayPal order.",

            paypal_http_status:
              paypalResult.status,

            paypal:
              paypalResult.data,
          },
          502
        );
      }

      /* ===================================================
         RECOVER ORDER BY PAYPAL REFERENCE

         This protects against the rare case where PayPal was
         created successfully but saving paypal_order_id into
         Supabase failed.
      =================================================== */

      if (
        !order
      ) {
        const purchaseUnit =
          paypalResult
            .data
            .purchase_units
            ?.[0];

        const referencedOrderId =
          cleanString(
            purchaseUnit
              ?.reference_id
          ) ||
          cleanString(
            purchaseUnit
              ?.custom_id
          );

        if (
          referencedOrderId
        ) {
          const {
            data:
              recoveredOrderData,

            error:
              recoveredOrderError,
          } =
            await supabase
              .from(
                "orders"
              )
              .select(
                `
                id,
                order_number,
                customer_name,
                customer_email,
                customer_whatsapp,
                customer_country,
                customer_state_region,
                customer_city,
                customer_street,
                customer_house_number,
                customer_address_line_2,
                customer_postal_code,
                language,
                product_name,
                storage,
                color,
                condition,
                quantity,
                unit_price,
                subtotal_amount,
                shipping_amount,
                total_amount,
                currency,
                display_currency,
                display_total_amount,
                exchange_rate,
                payment_method,
                payment_status,
                order_status,
                payment_received_at,
                paypal_order_id,
                paypal_capture_id,
                paypal_status,
                paypal_payer_id
                `
              )
              .eq(
                "id",
                referencedOrderId
              )
              .maybeSingle();

          if (
            recoveredOrderError
          ) {
            console.error(
              "Recovered order lookup error:",
              recoveredOrderError
            );
          }

          if (
            recoveredOrderData
          ) {
            order =
              recoveredOrderData as
                OrderRow;

            const {
              error:
                recoverLinkError,
            } =
              await supabase
                .from(
                  "orders"
                )
                .update({
                  paypal_order_id:
                    paypalOrderId,

                  paypal_status:
                    paypalResult
                      .data
                      .status ??
                    null,
                })
                .eq(
                  "id",
                  order.id
                );

            if (
              recoverLinkError
            ) {
              console.error(
                "Could not recover PayPal order link:",
                recoverLinkError
              );
            }
          }
        }
      }

      if (
        !order
      ) {
        return conflictResponse(
          "The matching POKAPOK order could not be found.",
          "POKAPOK_ORDER_NOT_FOUND",
          {
            paypal_order_id:
              paypalOrderId,
          }
        );
      }

      if (
        order.payment_method !==
          "paypal"
      ) {
        return conflictResponse(
          "This POKAPOK order is not a PayPal order.",
          "INVALID_PAYMENT_METHOD"
        );
      }

      const expectedAmount =
        toMoney(
          order.total_amount
        );

      const expectedCurrency =
        cleanString(
          order.currency
        ).toUpperCase();

      if (
        expectedAmount ===
          null ||
        expectedAmount <= 0
      ) {
        return serverError(
          "The POKAPOK order has an invalid expected total.",
          "INVALID_EXPECTED_TOTAL"
        );
      }

      if (
        expectedCurrency !==
          SETTLEMENT_CURRENCY
      ) {
        return serverError(
          "The POKAPOK order has an invalid settlement currency.",
          "INVALID_EXPECTED_CURRENCY"
        );
      }

      /* ===================================================
         CAPTURE WHEN NECESSARY
      =================================================== */

      if (
        paypalResult
          .data
          .status !==
        "COMPLETED"
      ) {
        if (
          paypalResult
            .data
            .status !==
          "APPROVED"
        ) {
          return conflictResponse(
            "The PayPal order has not been approved for capture.",
            "PAYPAL_ORDER_NOT_APPROVED",
            {
              paypal_order_id:
                paypalOrderId,

              paypal_status:
                paypalResult
                  .data
                  .status ??
                null,
            }
          );
        }

        const captureResult =
          await capturePayPalPayment(
            paypalOrderId,
            accessToken
          );

        if (
          captureResult.ok
        ) {
          paypalResult =
            captureResult;
        } else {
          /*
           * Network/API response can be ambiguous after
           * PayPal has actually accepted a capture.
           * Re-fetch before declaring failure.
           */
          const retryLookup =
            await getPayPalOrder(
              paypalOrderId,
              accessToken
            );

          if (
            retryLookup.ok &&
            retryLookup
              .data
              .status ===
              "COMPLETED"
          ) {
            paypalResult =
              retryLookup;
          } else {
            console.error(
              "PayPal capture error:",
              {
                status:
                  captureResult.status,

                data:
                  captureResult.data,
              }
            );

            return jsonResponse(
              {
                success:
                  false,

                error:
                  "PAYPAL_CAPTURE_FAILED",

                message:
                  "PayPal could not capture the payment.",

                paypal_http_status:
                  captureResult.status,

                paypal:
                  captureResult.data,
              },
              502
            );
          }
        }
      }

      /* ===================================================
         VERIFY COMPLETED PAYPAL PAYMENT
      =================================================== */

      if (
        paypalResult
          .data
          .status !==
        "COMPLETED"
      ) {
        return conflictResponse(
          "PayPal did not return a completed order.",
          "PAYPAL_PAYMENT_NOT_COMPLETED",
          {
            paypal_order_id:
              paypalOrderId,

            paypal_status:
              paypalResult
                .data
                .status ??
              null,
          }
        );
      }

      const verifiedCapture =
        getVerifiedCapture(
          paypalResult.data
        );

      if (
        !verifiedCapture
      ) {
        return conflictResponse(
          "PayPal did not return a valid completed capture.",
          "PAYPAL_CAPTURE_NOT_COMPLETED"
        );
      }

      if (
        verifiedCapture.currency !==
          SETTLEMENT_CURRENCY
      ) {
        return conflictResponse(
          "The PayPal payment currency does not match the order.",
          "PAYPAL_CURRENCY_MISMATCH",
          {
            expected_currency:
              SETTLEMENT_CURRENCY,

            received_currency:
              verifiedCapture
                .currency,
          }
        );
      }

      if (
        !moneyMatches(
          verifiedCapture.amount,
          expectedAmount
        )
      ) {
        console.error(
          "PayPal amount mismatch:",
          {
            orderId:
              order.id,

            orderNumber:
              order.order_number,

            expectedAmount,

            receivedAmount:
              verifiedCapture
                .amount,
          }
        );

        return conflictResponse(
          "The PayPal payment amount does not match the POKAPOK order.",
          "PAYPAL_AMOUNT_MISMATCH",
          {
            expected_amount:
              expectedAmount,

            received_amount:
              verifiedCapture
                .amount,

            currency:
              SETTLEMENT_CURRENCY,
          }
        );
      }

      if (
        verifiedCapture
          .pokapokOrderId &&
        verifiedCapture
          .pokapokOrderId !==
          order.id
      ) {
        return conflictResponse(
          "The PayPal payment is linked to a different POKAPOK order.",
          "PAYPAL_ORDER_REFERENCE_MISMATCH"
        );
      }

      /* ===================================================
         FINALIZE ORDER

         Predicate payment_status != paid makes this transition
         idempotent. If another request finalizes it first, this
         update returns no row and we skip the email.
      =================================================== */

      const paidAt =
        new Date()
          .toISOString();

      const {
        data:
          finalizedRows,

        error:
          finalizeError,
      } =
        await supabase
          .from(
            "orders"
          )
          .update({
            payment_status:
              "paid",

            order_status:
              "processing",

            status:
              "processing",

            payment_received_at:
              paidAt,

            paypal_order_id:
              paypalOrderId,

            paypal_capture_id:
              verifiedCapture
                .captureId,

            paypal_status:
              "COMPLETED",

            paypal_payer_id:
              verifiedCapture
                .payerId,
          })
          .eq(
            "id",
            order.id
          )
          .neq(
            "payment_status",
            "paid"
          )
          .select(
            `
            id,
            order_number,
            customer_name,
            customer_email,
            customer_whatsapp,
            customer_country,
            customer_state_region,
            customer_city,
            customer_street,
            customer_house_number,
            customer_address_line_2,
            customer_postal_code,
            language,
            product_name,
            storage,
            color,
            condition,
            quantity,
            unit_price,
            subtotal_amount,
            shipping_amount,
            total_amount,
            currency,
            display_currency,
            display_total_amount,
            exchange_rate,
            payment_method,
            payment_status,
            order_status,
            payment_received_at,
            paypal_order_id,
            paypal_capture_id,
            paypal_status,
            paypal_payer_id
            `
          );

      if (
        finalizeError
      ) {
        console.error(
          "Order finalization error:",
          finalizeError
        );

        return serverError(
          "Payment was captured, but the POKAPOK order could not be finalized.",
          "ORDER_FINALIZATION_FAILED"
        );
      }

      const finalizedOrder =
        (
          finalizedRows?.[0] ??
          null
        ) as
          | OrderRow
          | null;

      const newlyFinalized =
        Boolean(
          finalizedOrder
        );

      if (
        finalizedOrder
      ) {
        order =
          finalizedOrder;
      } else {
        /*
         * Another request already completed the transition.
         * Re-read the final state.
         */
        const {
          data:
            latestOrder,
        } =
          await supabase
            .from(
              "orders"
            )
            .select(
              `
              id,
              order_number,
              customer_name,
              customer_email,
              customer_whatsapp,
              customer_country,
              customer_state_region,
              customer_city,
              customer_street,
              customer_house_number,
              customer_address_line_2,
              customer_postal_code,
              language,
              product_name,
              storage,
              color,
              condition,
              quantity,
              unit_price,
              subtotal_amount,
              shipping_amount,
              total_amount,
              currency,
              display_currency,
              display_total_amount,
              exchange_rate,
              payment_method,
              payment_status,
              order_status,
              payment_received_at,
              paypal_order_id,
              paypal_capture_id,
              paypal_status,
              paypal_payer_id
              `
            )
            .eq(
              "id",
              order.id
            )
            .single();

        if (
          latestOrder
        ) {
          order =
            latestOrder as
              OrderRow;
        }
      }

      /* ===================================================
         CONFIRMATION EMAIL

         Only the request that actually transitions the order
         to "paid" sends the email.

         A Resend failure NEVER undoes the successful payment.
      =================================================== */

      let emailSent =
        false;

      let warning:
        | string
        | null =
        null;

      if (
        newlyFinalized &&
        order.customer_email
      ) {
        if (
          resendApiKey &&
          fromEmail
        ) {
          try {
            await sendPaidOrderEmail({
              resendApiKey,

              fromEmail,

              order,

              captureId:
                verifiedCapture
                  .captureId,
            });

            emailSent =
              true;
          } catch (
            emailError
          ) {
            console.error(
              "PayPal confirmation email error:",
              emailError
            );

            warning =
              "Payment confirmed, but the confirmation email could not be sent.";
          }
        } else {
          warning =
            "Payment confirmed, but email delivery is not configured.";
        }
      }

      /* ===================================================
         SUCCESS
      =================================================== */

      return jsonResponse({
        success:
          true,

        already_captured:
          !newlyFinalized,

        already_finalized:
          !newlyFinalized,

        email_sent:
          emailSent,

        warning,

        order_id:
          order.id,

        order_number:
          order.order_number,

        payment_status:
          order.payment_status,

        order_status:
          order.order_status,

        paypal_order_id:
          paypalOrderId,

        paypal_status:
          "COMPLETED",

        capture: {
          id:
            verifiedCapture
              .captureId,

          status:
            verifiedCapture
              .captureStatus,

          currency:
            verifiedCapture
              .currency,

          amount:
            verifiedCapture
              .amount,
        },

        pricing: {
          currency:
            expectedCurrency,

          subtotal_amount:
            toMoney(
              order.subtotal_amount
            ),

          shipping_amount:
            toMoney(
              order.shipping_amount
            ),

          total_amount:
            expectedAmount,

          display_currency:
            order.display_currency,

          display_total_amount:
            toMoney(
              order.display_total_amount
            ),

          exchange_rate:
            toMoney(
              order.exchange_rate
            ),
        },
      });
    } catch (
      error
    ) {
      console.error(
        "capture-paypal-order error:",
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
        "Could not capture PayPal payment.",
        code
      );
    }
  }
);