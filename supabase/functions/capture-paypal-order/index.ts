import { createClient } from "@supabase/supabase-js";

/* =========================================================
   TYPES
========================================================= */
type SupabaseServerClient = {
  from: (
    table:
      string
  ) => any;
};

type Language =
  | "pt"
  | "en";

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

type OrderItemRow = {
  id:
    string;

  order_id:
    string;

  product_id:
    string;

  variant_id:
    | string
    | null;

  product_name:
    string;

  variant_storage:
    | string
    | null;

  variant_color:
    | string
    | null;

  condition:
    SellCondition;

  refurbished_grade:
    | RefurbishedGrade
    | null;

  battery_grade:
    | BatteryGrade
    | null;

  quantity:
    number;

  base_unit_price:
    number
    | string;

  battery_upgrade_amount:
    number
    | string;

  unit_price:
    number
    | string;

  line_subtotal:
    number
    | string;
};

type PayPalCapture = {
  id?:
    string;

  status?:
    string;

  amount?: {
    currency_code?:
      string;

    value?:
      string;
  };
};

type PayPalPurchaseUnit = {
  reference_id?:
    string;

  custom_id?:
    string;

  invoice_id?:
    string;

  amount?: {
    currency_code?:
      string;

    value?:
      string;
  };

  payments?: {
    captures?:
      PayPalCapture[];
  };
};

type PayPalOrderResponse = {
  id?:
    string;

  status?:
    string;

  payer?: {
    payer_id?:
      string;
  };

  purchase_units?:
    PayPalPurchaseUnit[];

  raw?:
    string;

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

      ...(extra ??
        {}),
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
      ) *
        100
    ) /
    100
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
      left *
        100
    ) ===
    Math.round(
      right *
        100
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
  if (
    !value
  ) {
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
   LABEL HELPERS
========================================================= */

function getConditionLabel(
  condition:
    SellCondition,

  language:
    Language
) {
  if (
    language ===
      "pt"
  ) {
    return condition ===
        "refurbished"
      ? "Recondicionado"
      : "Novo";
  }

  return condition ===
      "refurbished"
    ? "Refurbished"
    : "New";
}

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
    switch (
      grade
    ) {
      case "correct":
        return "Correcto";

      case "good":
        return "Bom";

      case "excellent":
        return "Excelente";

      case "premium":
        return "Premium";
    }
  }

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
   ADDRESS
========================================================= */

function buildTextAddress(
  order:
    OrderRow
) {
  const lines:
    string[] =
    [];

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
   ORDER ITEMS
========================================================= */

async function loadOrderItems(
  supabase:
    SupabaseServerClient,

  orderId:
    string
)
 {
  const {
    data,
    error,
  } =
    await supabase
      .from(
        "order_items"
      )
      .select(
        `
        id,
        order_id,
        product_id,
        variant_id,
        product_name,
        variant_storage,
        variant_color,
        condition,
        refurbished_grade,
        battery_grade,
        quantity,
        base_unit_price,
        battery_upgrade_amount,
        unit_price,
        line_subtotal
        `
      )
      .eq(
        "order_id",
        orderId
      )
      .order(
        "created_at",
        {
          ascending:
            true,
        }
      );

  if (
    error
  ) {
    console.error(
      "Order items lookup error:",
      error
    );

    throw new Error(
      "ORDER_ITEMS_LOOKUP_FAILED"
    );
  }

  return (
    data ??
    []
  ) as
    OrderItemRow[];
}

function normalizeOrderItems(
  items:
    OrderItemRow[]
) {
  return items.map(
    (
      item
    ) => ({
      product_id:
        item.product_id,

      variant_id:
        item.variant_id,

      product_name:
        item.product_name,

      storage:
        item.variant_storage,

      color:
        item.variant_color,

      condition:
        item.condition,

      refurbished_grade:
        item.refurbished_grade,

      battery_grade:
        item.battery_grade,

      base_unit_price:
        toMoney(
          item.base_unit_price
        ) ??
        0,

      battery_upgrade_amount:
        toMoney(
          item.battery_upgrade_amount
        ) ??
        0,

      unit_price:
        toMoney(
          item.unit_price
        ) ??
        0,

      quantity:
        Number(
          item.quantity
        ),

      line_subtotal:
        toMoney(
          item.line_subtotal
        ) ??
        0,
    })
  );
}

/* =========================================================
   EMAIL ITEM TEXT
========================================================= */

function buildTextItems(
  items:
    OrderItemRow[],

  language:
    Language
) {
  return items
    .map(
      (
        item,
        index
      ) => {
        const unitPrice =
          toMoney(
            item.unit_price
          ) ??
          0;

        const lineSubtotal =
          toMoney(
            item.line_subtotal
          ) ??
          0;

        const lines = [
          `${
            index +
            1
          }. ${item.product_name}`,
        ];

        if (
          item.variant_storage
        ) {
          lines.push(
            `${
              language ===
                "pt"
                ? "Armazenamento"
                : "Storage"
            }: ${item.variant_storage}`
          );
        }

        if (
          item.variant_color
        ) {
          lines.push(
            `${
              language ===
                "pt"
                ? "Cor"
                : "Colour"
            }: ${item.variant_color}`
          );
        }

        lines.push(
          `${
            language ===
              "pt"
              ? "Condição"
              : "Condition"
          }: ${getConditionLabel(
            item.condition,
            language
          )}`
        );

        if (
          item.refurbished_grade
        ) {
          lines.push(
            `${
              language ===
                "pt"
                ? "Estado estético"
                : "Cosmetic grade"
            }: ${getRefurbishedGradeLabel(
              item.refurbished_grade,
              language
            )}`
          );
        }

        if (
          item.battery_grade
        ) {
          lines.push(
            `${
              language ===
                "pt"
                ? "Bateria"
                : "Battery"
            }: ${getBatteryGradeLabel(
              item.battery_grade,
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
            unitPrice,
            SETTLEMENT_CURRENCY,
            language
          )}`
        );

        lines.push(
          `${
            language ===
              "pt"
              ? "Subtotal do artigo"
              : "Item subtotal"
          }: ${formatMoney(
            lineSubtotal,
            SETTLEMENT_CURRENCY,
            language
          )}`
        );

        return lines.join(
          "\n"
        );
      }
    )
    .join(
      "\n\n"
    );
}

/* =========================================================
   EMAIL ITEM HTML
========================================================= */

function buildHtmlItems(
  items:
    OrderItemRow[],

  language:
    Language
) {
  return items
    .map(
      (
        item
      ) => {
        const unitPrice =
          toMoney(
            item.unit_price
          ) ??
          0;

        const lineSubtotal =
          toMoney(
            item.line_subtotal
          ) ??
          0;

        const safeProductName =
          escapeHtml(
            item.product_name
          );

        const safeStorage =
          item.variant_storage
            ? escapeHtml(
                item.variant_storage
              )
            : null;

        const safeColor =
          item.variant_color
            ? escapeHtml(
                item.variant_color
              )
            : null;

        const conditionLabel =
          escapeHtml(
            getConditionLabel(
              item.condition,
              language
            )
          );

        const gradeLabel =
          item.refurbished_grade
            ? escapeHtml(
                getRefurbishedGradeLabel(
                  item.refurbished_grade,
                  language
                )
              )
            : null;

        const batteryLabel =
          item.battery_grade
            ? escapeHtml(
                getBatteryGradeLabel(
                  item.battery_grade,
                  language
                )
              )
            : null;

        return `
          <div style="padding:16px 0;border-top:1px solid #e5e5e5;">
            <div style="font-size:16px;font-weight:900;color:#111;">
              ${safeProductName}
            </div>

            ${
              safeStorage
                ? `
                  <div style="font-size:13px;color:#666;margin-top:5px;">
                    ${
                      language ===
                        "pt"
                        ? "Armazenamento"
                        : "Storage"
                    }: ${safeStorage}
                  </div>
                `
                : ""
            }

            ${
              safeColor
                ? `
                  <div style="font-size:13px;color:#666;margin-top:3px;">
                    ${
                      language ===
                        "pt"
                        ? "Cor"
                        : "Colour"
                    }: ${safeColor}
                  </div>
                `
                : ""
            }

            <div style="font-size:13px;color:#666;margin-top:3px;">
              ${
                language ===
                  "pt"
                  ? "Condição"
                  : "Condition"
              }: ${conditionLabel}
            </div>

            ${
              gradeLabel
                ? `
                  <div style="font-size:13px;color:#666;margin-top:3px;">
                    ${
                      language ===
                        "pt"
                        ? "Estado estético"
                        : "Cosmetic grade"
                    }: ${gradeLabel}
                  </div>
                `
                : ""
            }

            ${
              batteryLabel
                ? `
                  <div style="font-size:13px;color:#666;margin-top:3px;">
                    ${
                      language ===
                        "pt"
                        ? "Bateria"
                        : "Battery"
                    }: ${batteryLabel}
                  </div>
                `
                : ""
            }

            <div style="display:flex;justify-content:space-between;gap:16px;margin-top:12px;font-size:13px;">
              <span style="color:#666;">
                ${
                  language ===
                    "pt"
                    ? "Quantidade"
                    : "Quantity"
                }: ${item.quantity}
              </span>

              <strong>
                ${formatMoney(
                  unitPrice,
                  SETTLEMENT_CURRENCY,
                  language
                )}
              </strong>
            </div>

            <div style="display:flex;justify-content:space-between;gap:16px;margin-top:6px;font-size:14px;">
              <span style="color:#666;">
                ${
                  language ===
                    "pt"
                    ? "Subtotal"
                    : "Subtotal"
                }
              </span>

              <strong>
                ${formatMoney(
                  lineSubtotal,
                  SETTLEMENT_CURRENCY,
                  language
                )}
              </strong>
            </div>
          </div>
        `;
      }
    )
    .join(
      ""
    );
}

/* =========================================================
   EMAIL
========================================================= */

async function sendPaidOrderEmail({
  resendApiKey,
  fromEmail,
  order,
  items,
  captureId,
}: {
  resendApiKey:
    string;

  fromEmail:
    string;

  order:
    OrderRow;

  items:
    OrderItemRow[];

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

  const displayTotal =
    toMoney(
      order.display_total_amount
    );

  const exchangeRate =
    toMoney(
      order.exchange_rate
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

  const safeCaptureId =
    escapeHtml(
      captureId
    );

  const htmlAddress =
    buildHtmlAddress(
      order
    );

  const itemsText =
    buildTextItems(
      items,
      language
    );

  const itemsHtml =
    buildHtmlItems(
      items,
      language
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

ARTIGOS

${itemsText}

Subtotal: ${formattedSubtotal}
Envio: ${formattedShipping}
Total pago: ${formattedTotal}

${
  showCveEquivalent &&
  formattedDisplayTotal
    ? `Equivalente apresentado: ${formattedDisplayTotal}${
        exchangeRate !==
        null
          ? `\nTaxa: 1 EUR = ${exchangeRate} CVE`
          : ""
      }`
    : ""
}

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

ITEMS

${itemsText}

Subtotal: ${formattedSubtotal}
Shipping: ${formattedShipping}
Total paid: ${formattedTotal}

${
  showCveEquivalent &&
  formattedDisplayTotal
    ? `Displayed equivalent: ${formattedDisplayTotal}${
        exchangeRate !==
        null
          ? `\nRate: 1 EUR = ${exchangeRate} CVE`
          : ""
      }`
    : ""
}

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
        <div style="font-size:12px;color:#667085;font-weight:800;letter-spacing:.5px;">
          ${
            language ===
              "pt"
              ? "ENCOMENDA"
              : "ORDER"
          }
        </div>

        <div style="font-size:18px;font-weight:900;margin-top:5px;">
          ${safeOrderNumber}
        </div>
      </div>

      <h2 style="font-size:20px;margin:28px 0 4px;">
        ${
          language ===
            "pt"
            ? "Artigos"
            : "Items"
        }
      </h2>

      <div>
        ${itemsHtml}
      </div>

      <div style="border-top:1px solid #e5e5e5;padding-top:16px;margin-top:6px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
          <span style="color:#666;">
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

        <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
          <span style="color:#666;">
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

        <div style="display:flex;justify-content:space-between;font-size:20px;border-top:1px solid #e5e5e5;padding-top:14px;margin-top:14px;">
          <strong>
            ${
              language ===
                "pt"
                ? "Total pago"
                : "Total paid"
            }
          </strong>

          <strong>
            ${formattedTotal}
          </strong>
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
        <strong>
          PayPal
        </strong>

        <br>

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
        amount <=
          0
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
   ORDER SELECT
========================================================= */

const ORDER_SELECT = `
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
`;

/* =========================================================
   BUILD RESPONSE PRICING
========================================================= */

function buildPricingResponse(
  order:
    OrderRow,

  items:
    OrderItemRow[]
) {
  const normalizedItems =
    normalizeOrderItems(
      items
    );

  return {
    currency:
      cleanString(
        order.currency
      ).toUpperCase(),

    item_subtotal:
      toMoney(
        order.subtotal_amount
      ),

    subtotal_amount:
      toMoney(
        order.subtotal_amount
      ),

    shipping_amount:
      toMoney(
        order.shipping_amount
      ),

    total_amount:
      toMoney(
        order.total_amount
      ),

    quantity:
      normalizedItems.reduce(
        (
          total,
          item
        ) =>
          total +
          item.quantity,
        0
      ),

    item_count:
      normalizedItems.length,

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

    items:
      normalizedItems,
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
            ORDER_SELECT
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
      =================================================== */

      if (
        order &&
        order.payment_status ===
          "paid" &&
        order.paypal_capture_id
      ) {
        const existingItems =
          await loadOrderItems(
            supabase,
            order.id
          );

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

          payment_status:
            order.payment_status,

          order_status:
            order.order_status,

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

          items:
            normalizeOrderItems(
              existingItems
            ),

          pricing:
            buildPricingResponse(
              order,
              existingItems
            ),
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
                ORDER_SELECT
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

      /* ===================================================
         LOAD ORDER ITEMS
      =================================================== */

      const orderItems =
        await loadOrderItems(
          supabase,
          order.id
        );

      if (
        orderItems.length ===
          0
      ) {
        return serverError(
          "This order does not contain any saved order items.",
          "ORDER_ITEMS_MISSING"
        );
      }

      /* ===================================================
         VERIFY SAVED CHILD TOTALS AGAINST PARENT
      =================================================== */

      const childSubtotal =
        orderItems.reduce(
          (
            total,
            item
          ) =>
            total +
            (
              toMoney(
                item.line_subtotal
              ) ??
              0
            ),
          0
        );

      const expectedSubtotal =
        toMoney(
          order.subtotal_amount
        );

      if (
        expectedSubtotal ===
          null ||
        !moneyMatches(
          childSubtotal,
          expectedSubtotal
        )
      ) {
        console.error(
          "Order item subtotal mismatch:",
          {
            orderId:
              order.id,

            expectedSubtotal,

            childSubtotal,
          }
        );

        return serverError(
          "The saved order items do not match the parent order subtotal.",
          "ORDER_ITEMS_TOTAL_MISMATCH"
        );
      }

      /* ===================================================
         EXPECTED PAYMENT
      =================================================== */

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
        expectedAmount <=
          0
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

      /* ===================================================
         VERIFY CURRENCY
      =================================================== */

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

      /* ===================================================
         VERIFY AMOUNT
      =================================================== */

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

      /* ===================================================
         VERIFY ORDER REFERENCE
      =================================================== */

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
            ORDER_SELECT
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
          finalizedRows
            ?.[0] ??
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
        const {
          data:
            latestOrder,

          error:
            latestOrderError,
        } =
          await supabase
            .from(
              "orders"
            )
            .select(
              ORDER_SELECT
            )
            .eq(
              "id",
              order.id
            )
            .single();

        if (
          latestOrderError
        ) {
          console.error(
            "Could not reload finalized order:",
            latestOrderError
          );
        }

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

              items:
                orderItems,

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
         RESPONSE
      =================================================== */

      const normalizedItems =
        normalizeOrderItems(
          orderItems
        );

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

        items:
          normalizedItems,

        pricing:
          buildPricingResponse(
            order,
            orderItems
          ),
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