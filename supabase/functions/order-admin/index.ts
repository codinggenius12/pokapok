import { createClient } from "npm:@supabase/supabase-js@2";
import {
    PDFDocument,
    StandardFonts,
    rgb,
} from "npm:pdf-lib@1.17.1";

type Json = Record<string, unknown>;

type OrderRow = {
  id: string;
  order_number: string | null;
  payment_reference: string | null;

  customer_name: string | null;
  customer_email: string | null;
  customer_whatsapp: string | null;
  customer_city: string | null;
  customer_notes: string | null;
  language: string | null;

  product_name: string | null;
  storage: string | null;
  color: string | null;
  condition: string | null;
  quantity: number | string | null;

  unit_price: number | string | null;
  shipping_amount: number | string | null;
  insurance_amount: number | string | null;
  discount_amount: number | string | null;
  total_amount: number | string | null;
  currency: string | null;

  vat_scheme:
    | "standard"
    | "margin"
    | "zero"
    | "reverse_charge"
    | "exempt"
    | string
    | null;

  vat_rate: number | string | null;
  subtotal_ex_vat: number | string | null;
  vat_amount: number | string | null;

  payment_method: string | null;
  payment_status: string | null;
  order_status: string | null;
  payment_due_at: string | null;
  payment_received_at: string | null;

  estimated_delivery_from: string | null;
  estimated_delivery_to: string | null;
  carrier: string | null;
  tracking_number: string | null;
  shipped_at: string | null;
  delivered_at: string | null;

  warranty_months: number | string | null;
  warranty_starts_at: string | null;

  admin_notes: string | null;
  customer_visible_notes: string | null;

  cancelled_at: string | null;
  cancel_reason: string | null;
  archived_at: string | null;

  created_at: string | null;
  updated_at: string | null;
};

type CompanySettings = {
  brand_name: string | null;
  legal_name: string | null;
  kvk_number: string | null;
  vat_id: string | null;

  address_line_1: string | null;
  address_line_2: string | null;
  city: string | null;
  island: string | null;
  postal_code: string | null;
  country: string | null;

  email: string | null;
  phone: string | null;

  bank_account_holder: string | null;
  bank_name: string | null;
  bank_account_number: string | null;
  bank_iban: string | null;
  bank_swift_bic: string | null;
  bank_currency: string | null;

  default_vat_scheme:
    | "standard"
    | "margin"
    | "zero"
    | "reverse_charge"
    | "exempt"
    | string
    | null;

  default_vat_rate:
    | number
    | string
    | null;

  payment_due_days: number | null;
  default_delivery_min_days: number | null;
  default_delivery_max_days: number | null;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(
  body: unknown,
  status = 200
) {
  return new Response(
    JSON.stringify(body),
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

function numberValue(
  value: unknown
) {
  const parsed = Number(value);

  return Number.isFinite(
    parsed
  )
    ? parsed
    : 0;
}

function textValue(
  value: unknown
) {
  const text = String(
    value ?? ""
  ).trim();

  return text || null;
}

function formatMoney(
  value: number,
  currency: string
) {
  return new Intl.NumberFormat(
    "en-IE",
    {
      style: "currency",
      currency,
    }
  ).format(value);
}

function formatDate(
  value:
    | string
    | null
    | undefined
) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  ).format(date);
}

function base64FromBytes(
  bytes: Uint8Array
) {
  let binary = "";

  const chunkSize = 0x8000;

  for (
    let i = 0;
    i < bytes.length;
    i += chunkSize
  ) {
    const chunk =
      bytes.subarray(
        i,
        Math.min(
          i + chunkSize,
          bytes.length
        )
      );

    binary +=
      String.fromCharCode(
        ...chunk
      );
  }

  return btoa(binary);
}

/*
 * pdf-lib StandardFonts use WinAnsi.
 * Keep the generated payment request reliable without bundling
 * an external font by normalizing unsupported characters.
 */
function pdfSafe(
  value:
    | string
    | null
    | undefined
) {
  return String(
    value ?? ""
  )
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .replace(/[^\x20-\x7E€]/g, "?");
}

function safeFilename(
  value: string
) {
  return value
    .replace(
      /[^a-zA-Z0-9._-]+/g,
      "-"
    )
    .replace(
      /-+/g,
      "-"
    )
    .replace(
      /^-|-$|^\.+/g,
      ""
    );
}

async function requireUser(
  req: Request,
  supabaseUrl: string,
  anonKey: string
) {
  const authHeader =
    req.headers.get(
      "Authorization"
    );

  if (!authHeader) {
    throw new Error(
      "UNAUTHORIZED"
    );
  }

  const userClient =
    createClient(
      supabaseUrl,
      anonKey,
      {
        global: {
          headers: {
            Authorization:
              authHeader,
          },
        },
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

  const {
    data,
    error,
  } =
    await userClient.auth
      .getUser();

  if (
    error ||
    !data.user
  ) {
    throw new Error(
      "UNAUTHORIZED"
    );
  }

  return data.user;
}

async function sendResendEmail({
  apiKey,
  from,
  to,
  subject,
  html,
  text,
  attachment,
}: {
  apiKey: string;
  from: string;
  to: string;
  subject: string;
  html: string;
  text: string;
  attachment?: {
    filename: string;
    content: string;
  };
}) {
  const response =
    await fetch(
      "https://api.resend.com/emails",
      {
        method: "POST",
        headers: {
          Authorization:
            `Bearer ${apiKey}`,
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          from,
          to: [to],
          subject,
          html,
          text,
          attachments:
            attachment
              ? [
                  {
                    filename:
                      attachment.filename,
                    content:
                      attachment.content,
                  },
                ]
              : undefined,
        }),
      }
    );

  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(
      typeof data?.message ===
        "string"
        ? data.message
        : "Resend email failed."
    );
  }

  return data;
}

async function loadCompanySettings(
  admin: ReturnType<
    typeof createClient
  >
): Promise<CompanySettings> {
  const {
    data,
  } =
    await admin
      .from(
        "company_settings"
      )
      .select("*")
      .eq("id", "default")
      .maybeSingle();

  return {
    brand_name:
      textValue(
        data?.brand_name
      ) ??
      "POKAPOK",

    legal_name:
      textValue(
        data?.legal_name
      ),

    kvk_number:
      textValue(
        data?.kvk_number
      ),

    vat_id:
      textValue(
        data?.vat_id
      ),

    address_line_1:
      textValue(
        data?.address_line_1
      ),

    address_line_2:
      textValue(
        data?.address_line_2
      ),

    city:
      textValue(data?.city),

    island:
      textValue(
        data?.island
      ),

    postal_code:
      textValue(
        data?.postal_code
      ),

    country:
      textValue(
        data?.country
      ) ??
      "Netherlands",

    email:
      textValue(data?.email),

    phone:
      textValue(data?.phone),

    bank_account_holder:
      textValue(
        data?.bank_account_holder
      ) ??
      textValue(
        Deno.env.get(
          "POKAPOK_BANK_ACCOUNT_NAME"
        )
      ) ??
      textValue(
        Deno.env.get(
          "LUMINA_BANK_ACCOUNT_NAME"
        )
      ),

    bank_name:
      textValue(
        data?.bank_name
      ) ??
      textValue(
        Deno.env.get(
          "POKAPOK_BANK_NAME"
        )
      ) ??
      textValue(
        Deno.env.get(
          "LUMINA_BANK_NAME"
        )
      ),

    bank_account_number:
      textValue(
        data?.bank_account_number
      ),

    bank_iban:
      textValue(
        data?.bank_iban
      ) ??
      textValue(
        Deno.env.get(
          "POKAPOK_BANK_IBAN"
        )
      ) ??
      textValue(
        Deno.env.get(
          "LUMINA_BANK_IBAN"
        )
      ),

    bank_swift_bic:
      textValue(
        data?.bank_swift_bic
      ) ??
      textValue(
        Deno.env.get(
          "POKAPOK_BANK_BIC"
        )
      ) ??
      textValue(
        Deno.env.get(
          "LUMINA_BANK_BIC"
        )
      ),

    bank_currency:
      textValue(
        data?.bank_currency
      ) ??
      "EUR",

    default_vat_scheme:
      textValue(
        data?.default_vat_scheme
      ) ??
      "standard",

    default_vat_rate:
      numberValue(
        data?.default_vat_rate
      ) || 21,

    payment_due_days:
      numberValue(
        data?.payment_due_days
      ) || 5,

    default_delivery_min_days:
      numberValue(
        data?.default_delivery_min_days
      ) || 2,

    default_delivery_max_days:
      numberValue(
        data?.default_delivery_max_days
      ) || 7,
  };
}

function effectiveTotal(
  order: OrderRow
) {
  return numberValue(
    order.total_amount
  );
}

function effectiveWarrantyMonths(
  order: OrderRow
) {
  const configured =
    numberValue(
      order.warranty_months
    );

  if (configured > 0) {
    return configured;
  }

  return (
    order.condition ===
      "refurbished"
      ? 12
      : 24
  );
}

async function buildPaymentRequestPdf({
  order,
  company,
}: {
  order: OrderRow;
  company: CompanySettings;
}) {
  const pdf =
    await PDFDocument.create();

  const page =
    pdf.addPage([
      595.28,
      841.89,
    ]);

  const regular =
    await pdf.embedFont(
      StandardFonts.Helvetica
    );

  const bold =
    await pdf.embedFont(
      StandardFonts.HelveticaBold
    );

  const blue =
    rgb(
      0.03,
      0.36,
      0.98
    );

  const ink =
    rgb(
      0.05,
      0.06,
      0.09
    );

  const muted =
    rgb(
      0.39,
      0.43,
      0.5
    );

  const light =
    rgb(
      0.95,
      0.96,
      0.98
    );

  const pageWidth =
    page.getWidth();

  const margin = 44;
  const contentWidth =
    pageWidth -
    margin * 2;

  let y = 795;

  const draw = (
    text: string,
    x: number,
    fontSize: number,
    font = regular,
    color = ink
  ) => {
    page.drawText(
      pdfSafe(text),
      {
        x,
        y,
        size: fontSize,
        font,
        color,
      }
    );
  };

  const line = (
    x1: number,
    x2: number,
    yy: number,
    color = rgb(
      0.88,
      0.89,
      0.91
    )
  ) => {
    page.drawLine({
      start: {
        x: x1,
        y: yy,
      },
      end: {
        x: x2,
        y: yy,
      },
      thickness: 1,
      color,
    });
  };

  // Header
  draw(
    company.brand_name ??
      "POKAPOK",
    margin,
    24,
    bold,
    blue
  );

  y -= 24;

  draw(
    "PAYMENT REQUEST / PRO FORMA",
    margin,
    10,
    bold,
    muted
  );

  const docNumber =
    `PR-${order.order_number ?? order.id}`;

  page.drawText(
    pdfSafe(docNumber),
    {
      x:
        pageWidth -
        margin -
        bold.widthOfTextAtSize(
          pdfSafe(docNumber),
          11
        ),
      y: y + 2,
      size: 11,
      font: bold,
      color: ink,
    }
  );

  y -= 25;
  line(
    margin,
    pageWidth - margin,
    y
  );
  y -= 28;

  // Company + customer columns
  const colGap = 24;
  const colWidth =
    (contentWidth -
      colGap) /
    2;

  draw(
    "FROM",
    margin,
    9,
    bold,
    muted
  );

  draw(
    "CUSTOMER",
    margin +
      colWidth +
      colGap,
    9,
    bold,
    muted
  );

  y -= 18;

  const companyLines = [
    company.legal_name ??
      company.brand_name ??
      "POKAPOK",
    company.kvk_number
      ? `KVK: ${company.kvk_number}`
      : null,
    company.vat_id
      ? `VAT ID: ${company.vat_id}`
      : null,
    company.address_line_1,
    company.address_line_2,
    [
      company.postal_code,
      company.city,
    ]
      .filter(Boolean)
      .join(" "),
    company.island,
    company.country,
    company.email,
    company.phone,
  ].filter(Boolean) as string[];

  const customerLines = [
    order.customer_name ??
      "Customer",
    order.customer_email,
    order.customer_whatsapp,
    order.customer_city,
  ].filter(Boolean) as string[];

  const maxLines =
    Math.max(
      companyLines.length,
      customerLines.length
    );

  for (
    let i = 0;
    i < maxLines;
    i += 1
  ) {
    if (companyLines[i]) {
      draw(
        companyLines[i],
        margin,
        10,
        i === 0
          ? bold
          : regular,
        i === 0
          ? ink
          : muted
      );
    }

    if (customerLines[i]) {
      draw(
        customerLines[i],
        margin +
          colWidth +
          colGap,
        10,
        i === 0
          ? bold
          : regular,
        i === 0
          ? ink
          : muted
      );
    }

    y -= 15;
  }

  y -= 8;

  // Key dates / order identifiers
  page.drawRectangle({
    x: margin,
    y: y - 68,
    width: contentWidth,
    height: 68,
    color: light,
    borderColor:
      rgb(
        0.88,
        0.89,
        0.91
      ),
    borderWidth: 1,
  });

  const topY = y - 19;

  const summaryItems = [
    [
      "ORDER",
      order.order_number ??
        "—",
    ],
    [
      "CREATED",
      formatDate(
        order.created_at
      ),
    ],
    [
      "PAYMENT DUE",
      formatDate(
        order.payment_due_at
      ),
    ],
    [
      "REFERENCE",
      order.payment_reference ??
        "—",
    ],
  ];

  summaryItems.forEach(
    (
      [label, value],
      index
    ) => {
      const x =
        margin +
        14 +
        index *
          (
            (
              contentWidth -
              28
            ) /
            4
          );

      page.drawText(
        label,
        {
          x,
          y: topY,
          size: 8,
          font: bold,
          color: muted,
        }
      );

      page.drawText(
        pdfSafe(value),
        {
          x,
          y: topY - 17,
          size: 10,
          font: bold,
          color: ink,
          maxWidth:
            (
              contentWidth -
              42
            ) /
            4,
        }
      );
    }
  );

  y -= 92;

  // Product table
  draw(
    "ORDER DETAILS",
    margin,
    10,
    bold,
    muted
  );

  y -= 19;

  const product =
    [
      order.product_name,
      order.storage,
      order.color,
      order.condition
        ? order.condition ===
          "refurbished"
          ? "Refurbished"
          : "New"
        : null,
    ]
      .filter(Boolean)
      .join(" · ");

  draw(
    product || "Product",
    margin,
    13,
    bold,
    ink
  );

  y -= 18;

  draw(
    `Quantity: ${numberValue(order.quantity) || 1}`,
    margin,
    10,
    regular,
    muted
  );

  y -= 16;

  const vatScheme =
    order.vat_scheme ??
    company.default_vat_scheme ??
    "standard";

  const vatRate =
    numberValue(
      order.vat_rate
    ) ||
    numberValue(
      company.default_vat_rate
    );

  const vatLabel =
    vatScheme === "margin"
      ? "VAT: margin scheme - used goods"
      : vatScheme === "reverse_charge"
        ? "VAT: reverse charged"
        : vatScheme === "zero"
          ? "VAT: 0%"
          : vatScheme === "exempt"
            ? "VAT: exempt"
            : `VAT: ${vatRate}%`;

  draw(
    vatLabel,
    margin,
    9,
    regular,
    muted
  );

  const currency =
    order.currency ??
    company.bank_currency ??
    "EUR";

  const unitPrice =
    numberValue(
      order.unit_price
    );

  const total =
    effectiveTotal(order);

  const unitPriceText =
    unitPrice > 0
      ? formatMoney(
          unitPrice,
          currency
        )
      : "—";

  const totalText =
    formatMoney(
      total,
      currency
    );

  page.drawText(
    pdfSafe(
      `Unit: ${unitPriceText}`
    ),
    {
      x:
        pageWidth -
        margin -
        160,
      y,
      size: 10,
      font: regular,
      color: muted,
      maxWidth: 160,
    }
  );

  y -= 25;
  line(
    margin,
    pageWidth - margin,
    y
  );
  y -= 22;

  const extras = [
    [
      "Shipping",
      numberValue(
        order.shipping_amount
      ),
    ],
    [
      "Insurance",
      numberValue(
        order.insurance_amount
      ),
    ],
    [
      "Discount",
      -Math.abs(
        numberValue(
          order.discount_amount
        )
      ),
    ],
  ] as const;

  for (
    const [label, value]
    of extras
  ) {
    if (value === 0) {
      continue;
    }

    draw(
      label,
      margin,
      10,
      regular,
      muted
    );

    const valueText =
      formatMoney(
        value,
        currency
      );

    page.drawText(
      pdfSafe(valueText),
      {
        x:
          pageWidth -
          margin -
          regular.widthOfTextAtSize(
            pdfSafe(valueText),
            10
          ),
        y,
        size: 10,
        font: regular,
        color: muted,
      }
    );

    y -= 17;
  }

  y -= 4;

  draw(
    "TOTAL PAYABLE",
    margin,
    10,
    bold,
    muted
  );

  const totalWidth =
    bold.widthOfTextAtSize(
      pdfSafe(totalText),
      24
    );

  page.drawText(
    pdfSafe(totalText),
    {
      x:
        pageWidth -
        margin -
        totalWidth,
      y: y - 5,
      size: 24,
      font: bold,
      color: blue,
    }
  );

  y -= 40;

  // Bank details
  page.drawRectangle({
    x: margin,
    y: y - 128,
    width: contentWidth,
    height: 128,
    color:
      rgb(
        0.98,
        0.98,
        0.99
      ),
    borderColor:
      rgb(
        0.88,
        0.89,
        0.91
      ),
    borderWidth: 1,
  });

  draw(
    "BANK TRANSFER DETAILS",
    margin + 14,
    10,
    bold,
    ink
  );

  y -= 20;

  const bankRows = [
    [
      "Account holder",
      company.bank_account_holder ??
        "—",
    ],
    [
      "Bank",
      company.bank_name ??
        "—",
    ],
    [
      "Account / IBAN",
      company.bank_iban ??
        company.bank_account_number ??
        "—",
    ],
    [
      "SWIFT / BIC",
      company.bank_swift_bic ??
        "—",
    ],
    [
      "Payment reference",
      order.payment_reference ??
        "—",
    ],
  ];

  for (
    const [
      label,
      value,
    ] of bankRows
  ) {
    draw(
      `${label}:`,
      margin + 14,
      9,
      bold,
      muted
    );

    draw(
      value,
      margin + 130,
      9,
      regular,
      ink
    );

    y -= 18;
  }

  y -= 26;

  // Warranty + delivery
  const warrantyMonths =
    effectiveWarrantyMonths(
      order
    );

  draw(
    "PRACTICAL INFORMATION",
    margin,
    10,
    bold,
    muted
  );

  y -= 19;

  draw(
    `Guarantee: ${warrantyMonths} months`,
    margin,
    10,
    bold,
    ink
  );

  y -= 16;

  const delivery =
    order.estimated_delivery_from ||
    order.estimated_delivery_to
      ? `${formatDate(
          order.estimated_delivery_from
        )} - ${formatDate(
          order.estimated_delivery_to
        )}`
      : "To be confirmed after payment";

  draw(
    `Estimated delivery: ${delivery}`,
    margin,
    10,
    regular,
    muted
  );

  y -= 16;

  if (
    order.customer_visible_notes
  ) {
    draw(
      `Note: ${order.customer_visible_notes}`,
      margin,
      9,
      regular,
      muted
    );
    y -= 16;
  }

  y -= 12;
  line(
    margin,
    pageWidth - margin,
    y
  );
  y -= 18;

  draw(
    "This document is a payment request / pro forma and is not the Dutch VAT invoice.",
    margin,
    8,
    regular,
    muted
  );

  return {
    bytes:
      await pdf.save(),

    documentNumber:
      docNumber,
  };
}

async function loadOrder(
  admin: ReturnType<
    typeof createClient
  >,
  orderId: string
) {
  const {
    data,
    error,
  } =
    await admin
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

  if (
    error ||
    !data
  ) {
    throw new Error(
      error?.message ??
        "Order not found."
    );
  }

  return data as OrderRow;
}

async function insertEvent({
  admin,
  order,
  userId,
  eventType,
  note,
  before,
  after,
}: {
  admin: ReturnType<
    typeof createClient
  >;
  order:
    | OrderRow
    | null;
  userId: string;
  eventType: string;
  note?: string | null;
  before?: Json | null;
  after?: Json | null;
}) {
  await admin
    .from("order_events")
    .insert({
      order_id:
        order?.id ??
        null,
      order_number:
        order?.order_number ??
        null,
      event_type:
        eventType,
      actor_user_id:
        userId,
      note:
        note ??
        null,
      before_data:
        before ??
        null,
      after_data:
        after ??
        null,
    });
}

async function generatePaymentRequest({
  admin,
  order,
  company,
  resendApiKey,
  fromEmail,
  sendEmail,
}: {
  admin: ReturnType<
    typeof createClient
  >;
  order: OrderRow;
  company: CompanySettings;
  resendApiKey: string;
  fromEmail: string;
  sendEmail: boolean;
}) {
  const {
    bytes,
    documentNumber,
  } =
    await buildPaymentRequestPdf({
      order,
      company,
    });

  const filename =
    safeFilename(
      `${documentNumber}.pdf`
    );

  const storagePath =
    `payment-requests/${order.id}/${filename}`;

  const upload =
    await admin.storage
      .from(
        "order-documents"
      )
      .upload(
        storagePath,
        bytes,
        {
          contentType:
            "application/pdf",
          upsert: true,
        }
      );

  if (upload.error) {
    throw new Error(
      `Could not save PDF: ${upload.error.message}`
    );
  }

  let emailStatus:
    | "not_sent"
    | "sent"
    | "failed" =
    "not_sent";

  let emailSentAt:
    | string
    | null =
    null;

  let emailError:
    | string
    | null =
    null;

  if (
    sendEmail &&
    order.customer_email
  ) {
    try {
      const currency =
        order.currency ??
        company.bank_currency ??
        "EUR";

      const total =
        formatMoney(
          effectiveTotal(order),
          currency
        );

      const html = `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;background:#f5f6f8;padding:30px">
          <div style="max-width:620px;margin:auto;background:white;border:1px solid #e5e7eb;border-radius:18px;overflow:hidden">
            <div style="background:#0b5cff;padding:26px 30px;color:#fff">
              <div style="font-size:22px;font-weight:900;letter-spacing:2px">POKAPOK</div>
              <div style="font-size:12px;opacity:.75;margin-top:3px">SMARTPHONES</div>
            </div>
            <div style="padding:30px;color:#111827">
              <h1 style="font-size:24px;margin:0 0 12px">Payment request</h1>
              <p style="color:#667085;line-height:1.6">
                Hi ${order.customer_name ?? "there"}, your order ${order.order_number ?? ""} has been created.
              </p>
              <div style="background:#f7f8fa;border-radius:14px;padding:18px;margin:22px 0">
                <div style="font-size:12px;color:#98a2b3;font-weight:700">TOTAL PAYABLE</div>
                <div style="font-size:28px;font-weight:900;margin-top:3px">${total}</div>
                <div style="font-size:13px;color:#667085;margin-top:8px">Payment due: ${formatDate(order.payment_due_at)}</div>
              </div>
              <p style="color:#667085;line-height:1.6">
                Your PDF payment request is attached. It contains the order, bank transfer, delivery and guarantee information.
              </p>
              <p style="color:#667085;line-height:1.6">
                This payment request / pro forma is not the Dutch VAT invoice.
              </p>
            </div>
          </div>
        </div>
      `;

      const text = `
POKAPOK
Payment request

Order: ${order.order_number ?? "—"}
Total payable: ${total}
Payment due: ${formatDate(order.payment_due_at)}

Your PDF payment request is attached.

This payment request / pro forma is not the Dutch VAT invoice.
      `.trim();

      await sendResendEmail({
        apiKey:
          resendApiKey,
        from:
          fromEmail,
        to:
          order.customer_email,
        subject:
          `POKAPOK payment request ${order.order_number ?? ""}`,
        html,
        text,
        attachment: {
          filename,
          content:
            base64FromBytes(
              bytes
            ),
        },
      });

      emailStatus = "sent";
      emailSentAt =
        new Date().toISOString();
    } catch (error) {
      emailStatus = "failed";
      emailError =
        error instanceof
          Error
          ? error.message
          : "Email failed.";
    }
  }

  const {
    data: document,
    error: documentError,
  } =
    await admin
      .from(
        "order_documents"
      )
      .upsert(
        {
          order_id:
            order.id,
          document_type:
            "payment_request",
          document_number:
            documentNumber,
          storage_path:
            storagePath,
          mime_type:
            "application/pdf",
          email_status:
            emailStatus,
          email_sent_at:
            emailSentAt,
          generated_at:
            new Date()
              .toISOString(),
          metadata: {
            email_error:
              emailError,
          },
        },
        {
          onConflict:
            "order_id,document_type,document_number",
        }
      )
      .select()
      .single();

  if (documentError) {
    throw new Error(
      documentError.message
    );
  }

  const signed =
    await admin.storage
      .from(
        "order-documents"
      )
      .createSignedUrl(
        storagePath,
        60 * 10
      );

  if (signed.error) {
    throw new Error(
      signed.error.message
    );
  }

  return {
    document,
    signed_url:
      signed.data
        .signedUrl,
    email_status:
      emailStatus,
    email_error:
      emailError,
  };
}

Deno.serve(
  async (req) => {
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
      const supabaseUrl =
        Deno.env.get(
          "SUPABASE_URL"
        );

      const anonKey =
        Deno.env.get(
          "SUPABASE_ANON_KEY"
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
        !anonKey ||
        !serviceRoleKey
      ) {
        throw new Error(
          "Supabase environment variables are incomplete."
        );
      }

      const user =
        await requireUser(
          req,
          supabaseUrl,
          anonKey
        );

      const admin =
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

      let body: Json;

      try {
        body =
          await req.json();
      } catch {
        return jsonResponse(
          {
            success: false,
            error:
              "Invalid request body.",
          },
          400
        );
      }

      const action =
        textValue(
          body.action
        );

      const orderId =
        textValue(
          body.order_id
        );

      if (!action) {
        return jsonResponse(
          {
            success: false,
            error:
              "action is required.",
          },
          400
        );
      }

      if (
        !orderId &&
        action !==
          "health"
      ) {
        return jsonResponse(
          {
            success: false,
            error:
              "order_id is required.",
          },
          400
        );
      }

      if (
        action ===
        "health"
      ) {
        return jsonResponse({
          success: true,
          service:
            "order-admin",
        });
      }

      const order =
        await loadOrder(
          admin,
          orderId!
        );

      const company =
        await loadCompanySettings(
          admin
        );

      if (
        action ===
        "update_order"
      ) {
        const changes =
          (
            body.changes ??
            {}
          ) as Json;

        const allowedFields =
          new Set([
            "customer_name",
            "customer_email",
            "customer_whatsapp",
            "customer_city",
            "customer_notes",
            "language",

            "product_name",
            "storage",
            "color",
            "condition",
            "quantity",

            "unit_price",
            "shipping_amount",
            "insurance_amount",
            "discount_amount",
            "total_amount",
            "currency",

            "vat_scheme",
            "vat_rate",
            "subtotal_ex_vat",
            "vat_amount",

            "payment_status",
            "order_status",
            "payment_due_at",
            "payment_received_at",

            "estimated_delivery_from",
            "estimated_delivery_to",
            "carrier",
            "tracking_number",
            "shipped_at",
            "delivered_at",

            "warranty_months",
            "warranty_starts_at",

            "admin_notes",
            "customer_visible_notes",

            "cancelled_at",
            "cancel_reason",
            "archived_at",
          ]);

        const update: Json =
          {};

        for (
          const [
            key,
            value,
          ] of Object.entries(
            changes
          )
        ) {
          if (
            allowedFields.has(
              key
            )
          ) {
            update[key] =
              value;
          }
        }

        const now =
          new Date()
            .toISOString();

        if (
          update.payment_status ===
            "paid" &&
          order.payment_status !==
            "paid" &&
          !update.payment_received_at
        ) {
          update.payment_received_at =
            now;
        }

        if (
          update.order_status ===
            "shipped" &&
          order.order_status !==
            "shipped" &&
          !update.shipped_at
        ) {
          update.shipped_at =
            now;
        }

        if (
          update.order_status ===
            "delivered" &&
          order.order_status !==
            "delivered"
        ) {
          if (
            !update.delivered_at
          ) {
            update.delivered_at =
              now;
          }

          if (
            !update.warranty_starts_at
          ) {
            update.warranty_starts_at =
              now;
          }
        }

        if (
          update.order_status ===
            "cancelled" &&
          order.order_status !==
            "cancelled" &&
          !update.cancelled_at
        ) {
          update.cancelled_at =
            now;
        }

        const {
          data: updated,
          error,
        } =
          await admin
            .from("orders")
            .update(update)
            .eq(
              "id",
              order.id
            )
            .select()
            .single();

        if (error) {
          throw new Error(
            error.message
          );
        }

        await insertEvent({
          admin,
          order,
          userId:
            user.id,
          eventType:
            "order_updated",
          note:
            textValue(
              body.note
            ),
          before:
            order as unknown as Json,
          after:
            updated as Json,
        });

        // Operational customer emails.
        if (
          resendApiKey &&
          fromEmail &&
          order.customer_email
        ) {
          try {
            if (
              order.payment_status !==
                "paid" &&
              updated.payment_status ===
                "paid"
            ) {
              await sendResendEmail({
                apiKey:
                  resendApiKey,
                from:
                  fromEmail,
                to:
                  updated.customer_email,
                subject:
                  `POKAPOK payment confirmed ${updated.order_number ?? ""}`,
                html:
                  `<p>Hi ${updated.customer_name ?? "there"},</p><p>We have confirmed payment for order <strong>${updated.order_number ?? ""}</strong>.</p><p>We will now prepare your order and keep you updated.</p>`,
                text:
                  `POKAPOK\nPayment confirmed for order ${updated.order_number ?? ""}.`,
              });
            }

            if (
              order.order_status !==
                "shipped" &&
              updated.order_status ===
                "shipped"
            ) {
              await sendResendEmail({
                apiKey:
                  resendApiKey,
                from:
                  fromEmail,
                to:
                  updated.customer_email,
                subject:
                  `POKAPOK order shipped ${updated.order_number ?? ""}`,
                html:
                  `<p>Hi ${updated.customer_name ?? "there"},</p><p>Your order <strong>${updated.order_number ?? ""}</strong> has been shipped.</p><p>Carrier: ${updated.carrier ?? "—"}<br/>Tracking: ${updated.tracking_number ?? "—"}<br/>Estimated delivery: ${formatDate(updated.estimated_delivery_from)} - ${formatDate(updated.estimated_delivery_to)}</p>`,
                text:
                  `POKAPOK\nOrder ${updated.order_number ?? ""} shipped.\nCarrier: ${updated.carrier ?? "—"}\nTracking: ${updated.tracking_number ?? "—"}`,
              });
            }

            if (
              order.order_status !==
                "delivered" &&
              updated.order_status ===
                "delivered"
            ) {
              const months =
                effectiveWarrantyMonths(
                  updated as OrderRow
                );

              await sendResendEmail({
                apiKey:
                  resendApiKey,
                from:
                  fromEmail,
                to:
                  updated.customer_email,
                subject:
                  `POKAPOK order delivered ${updated.order_number ?? ""}`,
                html:
                  `<p>Hi ${updated.customer_name ?? "there"},</p><p>Order <strong>${updated.order_number ?? ""}</strong> is marked as delivered.</p><p>Your device guarantee is recorded as <strong>${months} months</strong>.</p>`,
                text:
                  `POKAPOK\nOrder ${updated.order_number ?? ""} delivered.\nGuarantee: ${months} months.`,
              });
            }
          } catch (
            emailError
          ) {
            console.error(
              "Operational email failed:",
              emailError
            );
          }
        }

        return jsonResponse({
          success: true,
          order:
            updated,
        });
      }

      if (
        action ===
        "archive_order"
      ) {
        const {
          data: updated,
          error,
        } =
          await admin
            .from("orders")
            .update({
              archived_at:
                order.archived_at
                  ? null
                  : new Date()
                      .toISOString(),
            })
            .eq(
              "id",
              order.id
            )
            .select()
            .single();

        if (error) {
          throw new Error(
            error.message
          );
        }

        await insertEvent({
          admin,
          order,
          userId:
            user.id,
          eventType:
            order.archived_at
              ? "order_unarchived"
              : "order_archived",
          before:
            order as unknown as Json,
          after:
            updated as Json,
        });

        return jsonResponse({
          success: true,
          order:
            updated,
        });
      }

      if (
        action ===
        "delete_order"
      ) {
        if (
          order.payment_status ===
          "paid"
        ) {
          return jsonResponse(
            {
              success: false,
              error:
                "Paid orders cannot be permanently deleted. Cancel or archive the order instead.",
            },
            409
          );
        }

        const {
          data: officialDocs,
        } =
          await admin
            .from(
              "order_documents"
            )
            .select(
              "id, document_type"
            )
            .eq(
              "order_id",
              order.id
            )
            .in(
              "document_type",
              [
                "invoice",
                "credit_note",
              ]
            );

        if (
          officialDocs &&
          officialDocs.length >
            0
        ) {
          return jsonResponse(
            {
              success: false,
              error:
                "Orders with issued invoices or credit notes cannot be permanently deleted.",
            },
            409
          );
        }

        const {
          data: docs,
        } =
          await admin
            .from(
              "order_documents"
            )
            .select(
              "storage_path"
            )
            .eq(
              "order_id",
              order.id
            );

        const paths =
          (
            docs ??
            []
          )
            .map(
              (
                item: {
                  storage_path:
                    | string
                    | null;
                }
              ) =>
                item
                  .storage_path
            )
            .filter(
              (
                path
              ): path is string =>
                Boolean(path)
            );

        if (
          paths.length >
          0
        ) {
          await admin.storage
            .from(
              "order-documents"
            )
            .remove(paths);
        }

        await insertEvent({
          admin,
          order,
          userId:
            user.id,
          eventType:
            "order_deleted",
          note:
            textValue(
              body.note
            ),
          before:
            order as unknown as Json,
        });

        const {
          error,
        } =
          await admin
            .from("orders")
            .delete()
            .eq(
              "id",
              order.id
            );

        if (error) {
          throw new Error(
            error.message
          );
        }

        return jsonResponse({
          success: true,
        });
      }

      if (
        action ===
          "generate_payment_request" ||
        action ===
          "resend_payment_request"
      ) {
        if (
          !resendApiKey ||
          !fromEmail
        ) {
          return jsonResponse(
            {
              success: false,
              error:
                "RESEND_API_KEY and POKAPOK_FROM_EMAIL/LUMINA_FROM_EMAIL must be configured.",
            },
            500
          );
        }

        const result =
          await generatePaymentRequest({
            admin,
            order,
            company,
            resendApiKey,
            fromEmail,
            sendEmail:
              true,
          });

        await insertEvent({
          admin,
          order,
          userId:
            user.id,
          eventType:
            action,
          after:
            result.document as Json,
        });

        return jsonResponse({
          success: true,
          ...result,
        });
      }

      if (
        action ===
        "get_document_url"
      ) {
        const documentId =
          textValue(
            body.document_id
          );

        if (!documentId) {
          return jsonResponse(
            {
              success: false,
              error:
                "document_id is required.",
            },
            400
          );
        }

        const {
          data: document,
          error,
        } =
          await admin
            .from(
              "order_documents"
            )
            .select("*")
            .eq(
              "id",
              documentId
            )
            .eq(
              "order_id",
              order.id
            )
            .single();

        if (
          error ||
          !document
        ) {
          throw new Error(
            error?.message ??
              "Document not found."
          );
        }

        if (
          !document.storage_path
        ) {
          throw new Error(
            "Document has no stored PDF."
          );
        }

        const signed =
          await admin.storage
            .from(
              "order-documents"
            )
            .createSignedUrl(
              document.storage_path,
              60 * 10
            );

        if (signed.error) {
          throw new Error(
            signed.error.message
          );
        }

        return jsonResponse({
          success: true,
          signed_url:
            signed.data
              .signedUrl,
        });
      }

      return jsonResponse(
        {
          success: false,
          error:
            "Unknown action.",
        },
        400
      );
    } catch (
      error
    ) {
      if (
        error instanceof
          Error &&
        error.message ===
          "UNAUTHORIZED"
      ) {
        return jsonResponse(
          {
            success: false,
            error:
              "Unauthorized.",
          },
          401
        );
      }

      console.error(
        "order-admin error:",
        error
      );

      return jsonResponse(
        {
          success: false,
          error:
            error instanceof
              Error
              ? error.message
              : "Unexpected error.",
        },
        500
      );
    }
  }
);
