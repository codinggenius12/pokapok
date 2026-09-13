import { createClient } from "@supabase/supabase-js";

/* =========================================================
   CORS
========================================================= */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

/* =========================================================
   TYPES
========================================================= */

type SellCondition =
  | "new"
  | "refurbished";

type ProductRow = {
  id: string;
  name: string;
  slug: string;
  condition:
    | "new"
    | "refurbished"
    | "used";

  refurbished_enabled: boolean;

  sale_price: number | string;
  promotional_price:
    | number
    | string
    | null;

  refurbished_price:
    | number
    | string
    | null;

  refurbished_promotional_price:
    | number
    | string
    | null;

  stock: number | string;

  available: boolean;
  published: boolean;
};

type VariantRow = {
  id: string;
  product_id: string;

  storage: string | null;
  color: string | null;
  sku: string | null;

  price_adjustment:
    | number
    | string
    | null;

  stock: number | string;
  available: boolean;
};

/* =========================================================
   RESPONSE HELPERS
========================================================= */

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

function badRequest(
  error: string
) {
  return jsonResponse(
    {
      success: false,
      error,
    },
    400
  );
}

/* =========================================================
   VALUE HELPERS
========================================================= */

function toNumber(
  value: unknown
): number {
  const parsed =
    Number(value ?? 0);

  return Number.isFinite(
    parsed
  )
    ? parsed
    : 0;
}

function toNullableNumber(
  value: unknown
): number | null {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const parsed =
    Number(value);

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
      (value + Number.EPSILON) *
        100
    ) / 100
  );
}

/* =========================================================
   ORDER IDENTIFIERS
========================================================= */

function randomCode(
  length = 6
) {
  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  let result = "";

  for (
    let i = 0;
    i < length;
    i++
  ) {
    result +=
      chars.charAt(
        Math.floor(
          Math.random() *
            chars.length
        )
      );
  }

  return result;
}

function createOrderNumber() {
  const year =
    new Date().getFullYear();

  return (
    `LUM-${year}-${randomCode(8)}`
  );
}

function createPaymentReference() {
  return (
    `LUM-${randomCode(7)}`
  );
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

function displayCondition(
  condition: SellCondition
) {
  return condition ===
      "refurbished"
    ? "Refurbished"
    : "New";
}

/* =========================================================
   EMAIL VALIDATION
========================================================= */

function isValidEmail(
  email: string
) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email
  );
}

/* =========================================================
   CONDITION AVAILABILITY
========================================================= */

function productCanBeSoldNew(
  product: ProductRow
) {
  return (
    product.condition ===
    "new"
  );
}

function productCanBeSoldRefurbished(
  product: ProductRow
) {
  return (
    product.condition ===
      "refurbished" ||
    product.refurbished_enabled
  );
}

/* =========================================================
   NEW PRODUCT PRICE
========================================================= */

function getNewProductPrice(
  product: ProductRow
) {
  const salePrice =
    toNumber(
      product.sale_price
    );

  const promotionalPrice =
    toNullableNumber(
      product.promotional_price
    );

  if (salePrice <= 0) {
    throw new Error(
      "This product does not have a valid sale price."
    );
  }

  if (
    promotionalPrice !==
      null &&
    promotionalPrice > 0 &&
    promotionalPrice <
      salePrice
  ) {
    return promotionalPrice;
  }

  return salePrice;
}

/* =========================================================
   REFURBISHED PRODUCT PRICE
========================================================= */

function getRefurbishedProductPrice(
  product: ProductRow
) {
  if (
    !productCanBeSoldRefurbished(
      product
    )
  ) {
    throw new Error(
      "This product is not available refurbished."
    );
  }

  const refurbishedPrice =
    toNullableNumber(
      product.refurbished_price
    );

  const promotionalPrice =
    toNullableNumber(
      product.refurbished_promotional_price
    );

  if (
    refurbishedPrice ===
      null ||
    refurbishedPrice <= 0
  ) {
    throw new Error(
      "Refurbished price is not configured for this product."
    );
  }

  if (
    promotionalPrice !==
      null &&
    promotionalPrice > 0 &&
    promotionalPrice <
      refurbishedPrice
  ) {
    return promotionalPrice;
  }

  return refurbishedPrice;
}

/* =========================================================
   PRODUCT PRICE BY CONDITION
========================================================= */

function getProductPriceByCondition(
  product: ProductRow,
  condition: SellCondition
) {
  if (
    condition ===
    "refurbished"
  ) {
    return (
      getRefurbishedProductPrice(
        product
      )
    );
  }

  if (
    !productCanBeSoldNew(
      product
    )
  ) {
    throw new Error(
      "This product is not available as new."
    );
  }

  return getNewProductPrice(
    product
  );
}

/* =========================================================
   CREATE ORDER
========================================================= */

Deno.serve(
  async (req) => {
    /*
     * ----------------------------------------------------
     * CORS
     * ----------------------------------------------------
     */

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
      /*
       * ----------------------------------------------------
       * ENVIRONMENT VARIABLES
       * ----------------------------------------------------
       */

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
          "LUMINA_FROM_EMAIL"
        );

      /*
       * BANK DETAILS
       */

      const iban =
        Deno.env.get(
          "LUMINA_BANK_IBAN"
        );

      const bic =
        Deno.env.get(
          "LUMINA_BANK_BIC"
        );

      const accountName =
        Deno.env.get(
          "LUMINA_BANK_ACCOUNT_NAME"
        );

      const bankName =
        Deno.env.get(
          "LUMINA_BANK_NAME"
        );

      const bankCountry =
        Deno.env.get(
          "LUMINA_BANK_COUNTRY"
        ) ??
        "Portugal";

      const currency =
        (
          Deno.env.get(
            "LUMINA_BANK_CURRENCY"
          ) ??
          "EUR"
        )
          .trim()
          .toUpperCase();

      /*
       * ----------------------------------------------------
       * ENV VALIDATION
       * ----------------------------------------------------
       */

      if (!supabaseUrl) {
        throw new Error(
          "SUPABASE_URL is not configured."
        );
      }

      if (!serviceRoleKey) {
        throw new Error(
          "SUPABASE_SERVICE_ROLE_KEY is not configured."
        );
      }

      if (!resendApiKey) {
        throw new Error(
          "RESEND_API_KEY is not configured."
        );
      }

      if (!fromEmail) {
        throw new Error(
          "LUMINA_FROM_EMAIL is not configured."
        );
      }

      if (!accountName) {
        throw new Error(
          "LUMINA_BANK_ACCOUNT_NAME is not configured."
        );
      }

      if (!iban) {
        throw new Error(
          "LUMINA_BANK_IBAN is not configured."
        );
      }

      if (!bic) {
        throw new Error(
          "LUMINA_BANK_BIC is not configured."
        );
      }

      if (!bankName) {
        throw new Error(
          "LUMINA_BANK_NAME is not configured."
        );
      }

      /*
       * ----------------------------------------------------
       * READ REQUEST
       * ----------------------------------------------------
       *
       * IMPORTANT:
       *
       * We intentionally DO NOT accept:
       *
       * - product_name
       * - storage
       * - color
       * - price
       * - total_amount
       *
       * These values come from Supabase.
       * ----------------------------------------------------
       */

      let body: Record<
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
        String(
          body.customer_name ??
            ""
        ).trim();

      const customerEmail =
        String(
          body.customer_email ??
            ""
        )
          .trim()
          .toLowerCase();

      const productId =
        String(
          body.product_id ??
            ""
        ).trim();

      const variantId =
        body.variant_id
          ? String(
              body.variant_id
            ).trim()
          : null;

      const requestedCondition =
        String(
          body.condition ??
            "new"
        )
          .trim()
          .toLowerCase();

      const rawQuantity =
        Number(
          body.quantity ??
            1
        );

      /*
       * ----------------------------------------------------
       * REQUEST VALIDATION
       * ----------------------------------------------------
       */

      if (!customerName) {
        return badRequest(
          "Customer name is required."
        );
      }

      if (!customerEmail) {
        return badRequest(
          "Customer email is required."
        );
      }

      if (
        !isValidEmail(
          customerEmail
        )
      ) {
        return badRequest(
          "Invalid customer email."
        );
      }

      if (!productId) {
        return badRequest(
          "Product ID is required."
        );
      }

      if (
        requestedCondition !==
          "new" &&
        requestedCondition !==
          "refurbished"
      ) {
        return badRequest(
          "Condition must be new or refurbished."
        );
      }

      const condition =
        requestedCondition as
          SellCondition;

      if (
        !Number.isFinite(
          rawQuantity
        ) ||
        !Number.isInteger(
          rawQuantity
        ) ||
        rawQuantity < 1
      ) {
        return badRequest(
          "Quantity must be a positive integer."
        );
      }

      const quantity =
        rawQuantity;

      /*
       * ----------------------------------------------------
       * SUPABASE ADMIN CLIENT
       * ----------------------------------------------------
       */

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

      /*
       * ----------------------------------------------------
       * LOAD AUTHORITATIVE PRODUCT
       * ----------------------------------------------------
       */

      const {
        data: productData,
        error: productError,
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
            refurbished_price,
            refurbished_promotional_price,
            stock,
            available,
            published
          `)
          .eq(
            "id",
            productId
          )
          .maybeSingle();

      if (productError) {
        console.error(
          "Product lookup error:",
          productError
        );

        throw new Error(
          `Could not load product: ${productError.message}`
        );
      }

      if (!productData) {
        return badRequest(
          "The selected product could not be found."
        );
      }

      const product =
        productData as ProductRow;

      /*
       * ----------------------------------------------------
       * PRODUCT AVAILABILITY
       * ----------------------------------------------------
       */

      if (
        !product.published
      ) {
        return badRequest(
          "This product is not currently available for purchase."
        );
      }

      if (
        !product.available
      ) {
        return badRequest(
          "This product is currently unavailable."
        );
      }

      /*
       * ----------------------------------------------------
       * CONDITION VALIDATION
       * ----------------------------------------------------
       */

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

      /*
       * ----------------------------------------------------
       * AUTHORITATIVE BASE PRICE
       * ----------------------------------------------------
       */

      let basePrice: number;

      try {
        basePrice =
          getProductPriceByCondition(
            product,
            condition
          );
      } catch (error) {
        return badRequest(
          error instanceof Error
            ? error.message
            : "Invalid product price."
        );
      }

      /*
       * ----------------------------------------------------
       * LOAD VARIANT
       * ----------------------------------------------------
       */

      let variant:
        | VariantRow
        | null =
        null;

      if (variantId) {
        const {
          data: variantData,
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
              price_adjustment,
              stock,
              available
            `)
            .eq(
              "id",
              variantId
            )
            .maybeSingle();

        if (variantError) {
          console.error(
            "Variant lookup error:",
            variantError
          );

          throw new Error(
            `Could not load product variant: ${variantError.message}`
          );
        }

        if (!variantData) {
          return badRequest(
            "The selected product variant could not be found."
          );
        }

        variant =
          variantData as
            VariantRow;

        /*
         * Critical security check.
         *
         * A customer cannot send:
         *
         * product A ID
         * +
         * cheaper variant belonging
         * to product B.
         */

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

        const variantStock =
          toNumber(
            variant.stock
          );

        if (
          variantStock <
          quantity
        ) {
          return badRequest(
            "There is not enough stock available for the selected variant."
          );
        }
      } else {
        /*
         * Products without variants
         * use product-level stock.
         */

        const productStock =
          toNumber(
            product.stock
          );

        if (
          productStock <
          quantity
        ) {
          return badRequest(
            "There is not enough stock available for this product."
          );
        }
      }

      /*
       * ----------------------------------------------------
       * AUTHORITATIVE PRICE CALCULATION
       * ----------------------------------------------------
       */

      const variantPriceAdjustment =
        variant
          ? toNumber(
              variant.price_adjustment
            )
          : 0;

      const unitPrice =
        roundMoney(
          basePrice +
            variantPriceAdjustment
        );

      if (
        !Number.isFinite(
          unitPrice
        ) ||
        unitPrice <= 0
      ) {
        throw new Error(
          "Calculated unit price is invalid."
        );
      }

      const totalAmount =
        roundMoney(
          unitPrice *
            quantity
        );

      /*
       * ----------------------------------------------------
       * AUTHORITATIVE PRODUCT DETAILS
       * ----------------------------------------------------
       */

      const productName =
        String(
          product.name
        ).trim();

      const storage =
        variant?.storage
          ? String(
              variant.storage
            ).trim()
          : null;

      const color =
        variant?.color
          ? String(
              variant.color
            ).trim()
          : null;

      /*
       * ----------------------------------------------------
       * GENERATE ORDER IDENTIFIERS
       * ----------------------------------------------------
       */

      const orderNumber =
        createOrderNumber();

      const paymentReference =
        createPaymentReference();

      /*
       * ----------------------------------------------------
       * CREATE ORDER
       * ----------------------------------------------------
       */

      const {
        data: order,
        error: insertError,
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

            product_name:
              productName,

            storage,

            color,

            condition,

            quantity,

            total_amount:
              totalAmount,

            payment_method:
              "bank_transfer",

            payment_status:
              "awaiting_payment",

            order_status:
              "pending",
          })
          .select()
          .single();

      if (insertError) {
        console.error(
          "Order insert error:",
          insertError
        );

        throw new Error(
          `Could not create order: ${insertError.message}`
        );
      }

      /*
       * ----------------------------------------------------
       * FORMAT VALUES
       * ----------------------------------------------------
       */

      const formattedUnitPrice =
        new Intl.NumberFormat(
          "en-IE",
          {
            style:
              "currency",

            currency,
          }
        ).format(
          unitPrice
        );

      const formattedAmount =
        new Intl.NumberFormat(
          "en-IE",
          {
            style:
              "currency",

            currency,
          }
        ).format(
          totalAmount
        );

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
          accountName
        );

      const safeIban =
        escapeHtml(
          iban
        );

      const safeBic =
        escapeHtml(
          bic
        );

      const safeBankName =
        escapeHtml(
          bankName
        );

      const safeBankCountry =
        escapeHtml(
          bankCountry
        );

      const safeCurrency =
        escapeHtml(
          currency
        );

      const safeCondition =
        escapeHtml(
          displayCondition(
            condition
          )
        );

      const safeStorage =
        storage
          ? escapeHtml(
              storage
            )
          : null;

      const safeColor =
        color
          ? escapeHtml(
              color
            )
          : null;

      /*
       * ----------------------------------------------------
       * PLAIN TEXT EMAIL
       * ----------------------------------------------------
       */

      const emailText = `
LUMINA PHONES

Your order has been received

Hi ${customerName},

Thank you for your order.

ORDER DETAILS

Order number: ${orderNumber}
Product: ${productName}
${storage ? `Storage: ${storage}` : ""}
${color ? `Colour: ${color}` : ""}
Condition: ${displayCondition(condition)}
Quantity: ${quantity}
Unit price: ${formattedUnitPrice}
Total to transfer: ${formattedAmount}

INTERNATIONAL BANK TRANSFER DETAILS

Beneficiary / Account holder:
${accountName}

IBAN:
${iban}

BIC / SWIFT:
${bic}

Bank:
${bankName}

Bank country:
${bankCountry}

Transfer currency:
${currency}

Amount:
${formattedAmount}

PAYMENT REFERENCE / DESCRIPTION:
${paymentReference}

IMPORTANT:
Enter ${paymentReference} exactly in the reference, description or message field of your bank transfer.

This allows us to match your payment to order ${orderNumber}.

Once your payment has been received and verified, we will send you another email confirming your payment and estimated delivery time.

Lumina Phones
`.trim();

      /*
       * ----------------------------------------------------
       * HTML EMAIL
       * ----------------------------------------------------
       */

      const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  />

  <title>
    Payment details for ${safeOrderNumber}
  </title>
</head>

<body
  style="
    margin:0;
    padding:0;
    background:#f4f6f8;
    font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,Helvetica,sans-serif;
    color:#111827;
  "
>

<table
  width="100%"
  cellpadding="0"
  cellspacing="0"
  border="0"
  role="presentation"
  style="
    width:100%;
    background:#f4f6f8;
  "
>
<tr>
<td
  align="center"
  style="padding:36px 16px;"
>

<table
  width="600"
  cellpadding="0"
  cellspacing="0"
  border="0"
  role="presentation"
  style="
    width:100%;
    max-width:600px;
    background:#ffffff;
    border:1px solid #e5e7eb;
    border-radius:18px;
    overflow:hidden;
  "
>

<!-- HEADER -->

<tr>
<td
  style="
    background:#111827;
    padding:30px 34px;
    color:#ffffff;
  "
>

  <div
    style="
      font-size:22px;
      font-weight:800;
      letter-spacing:3px;
    "
  >
    LUMINA
  </div>

  <div
    style="
      margin-top:5px;
      font-size:12px;
      color:#d1d5db;
    "
  >
    Smartphones
  </div>

</td>
</tr>

<!-- BODY -->

<tr>
<td style="padding:34px;">

  <h1
    style="
      margin:0 0 14px;
      font-size:26px;
      line-height:1.25;
      color:#111827;
    "
  >
    Your order has been received
  </h1>

  <p
    style="
      margin:0 0 14px;
      color:#4b5563;
      font-size:15px;
      line-height:1.7;
    "
  >
    Hi ${safeCustomerName},
  </p>

  <p
    style="
      margin:0 0 28px;
      color:#4b5563;
      font-size:15px;
      line-height:1.7;
    "
  >
    Thank you for your order.
    Please complete the bank transfer
    using the payment information below.
  </p>

  <!-- ORDER SUMMARY -->

  <div
    style="
      padding:22px;
      background:#f8fafc;
      border-radius:14px;
      margin-bottom:28px;
    "
  >

    <div
      style="
        font-size:11px;
        font-weight:700;
        color:#9ca3af;
        letter-spacing:1px;
      "
    >
      ORDER SUMMARY
    </div>

    <div
      style="
        margin-top:10px;
        font-size:18px;
        font-weight:700;
        color:#111827;
      "
    >
      ${safeProductName}
    </div>

    ${
      safeStorage
        ? `
          <div
            style="
              margin-top:8px;
              color:#6b7280;
              font-size:14px;
            "
          >
            Storage: ${safeStorage}
          </div>
        `
        : ""
    }

    ${
      safeColor
        ? `
          <div
            style="
              margin-top:4px;
              color:#6b7280;
              font-size:14px;
            "
          >
            Colour: ${safeColor}
          </div>
        `
        : ""
    }

    <div
      style="
        margin-top:4px;
        color:#6b7280;
        font-size:14px;
      "
    >
      Condition: ${safeCondition}
    </div>

    <div
      style="
        margin-top:4px;
        color:#6b7280;
        font-size:14px;
      "
    >
      Quantity: ${quantity}
    </div>

    <div
      style="
        margin-top:4px;
        color:#6b7280;
        font-size:14px;
      "
    >
      Unit price: ${formattedUnitPrice}
    </div>

  </div>

  <!-- ORDER INFORMATION -->

  <table
    width="100%"
    cellpadding="0"
    cellspacing="0"
    border="0"
    role="presentation"
    style="margin-bottom:28px;"
  >

    <tr>

      <td
        width="50%"
        valign="top"
        style="padding-right:10px;"
      >
        <div
          style="
            font-size:11px;
            font-weight:700;
            color:#9ca3af;
            letter-spacing:1px;
          "
        >
          ORDER NUMBER
        </div>

        <div
          style="
            margin-top:6px;
            font-size:15px;
            font-weight:700;
            color:#111827;
          "
        >
          ${safeOrderNumber}
        </div>
      </td>

      <td
        width="50%"
        valign="top"
      >
        <div
          style="
            font-size:11px;
            font-weight:700;
            color:#9ca3af;
            letter-spacing:1px;
          "
        >
          STATUS
        </div>

        <div
          style="
            margin-top:6px;
            font-size:15px;
            font-weight:700;
            color:#92400e;
          "
        >
          Awaiting payment
        </div>
      </td>

    </tr>

  </table>

  <!-- TOTAL -->

  <div
    style="
      margin-bottom:30px;
    "
  >

    <div
      style="
        font-size:11px;
        font-weight:700;
        color:#9ca3af;
        letter-spacing:1px;
      "
    >
      TOTAL TO TRANSFER
    </div>

    <div
      style="
        margin-top:6px;
        font-size:30px;
        font-weight:800;
        color:#111827;
      "
    >
      ${formattedAmount}
    </div>

    <div
      style="
        margin-top:4px;
        font-size:13px;
        color:#6b7280;
      "
    >
      Currency: ${safeCurrency}
    </div>

  </div>

  <!-- INTERNATIONAL BANK TRANSFER -->

  <div
    style="
      border:1px solid #dfe3e8;
      border-radius:14px;
      overflow:hidden;
      margin-bottom:24px;
    "
  >

    <div
      style="
        background:#f8fafc;
        border-bottom:1px solid #e5e7eb;
        padding:18px 22px;
      "
    >

      <div
        style="
          font-size:16px;
          font-weight:700;
          color:#111827;
        "
      >
        International bank transfer
      </div>

      <div
        style="
          margin-top:4px;
          font-size:13px;
          color:#6b7280;
        "
      >
        Use these details to complete your payment.
      </div>

    </div>

    <div style="padding:22px;">

      <!-- BENEFICIARY -->

      <div style="margin-bottom:20px;">

        <div
          style="
            font-size:11px;
            color:#9ca3af;
            font-weight:700;
            letter-spacing:1px;
          "
        >
          BENEFICIARY / ACCOUNT HOLDER
        </div>

        <div
          style="
            margin-top:5px;
            font-size:15px;
            font-weight:700;
            color:#111827;
          "
        >
          ${safeAccountName}
        </div>

      </div>

      <!-- IBAN -->

      <div style="margin-bottom:20px;">

        <div
          style="
            font-size:11px;
            color:#9ca3af;
            font-weight:700;
            letter-spacing:1px;
          "
        >
          IBAN
        </div>

        <div
          style="
            margin-top:5px;
            font-size:17px;
            font-weight:800;
            color:#111827;
            word-break:break-all;
          "
        >
          ${safeIban}
        </div>

      </div>

      <!-- BIC / SWIFT -->

      <div style="margin-bottom:20px;">

        <div
          style="
            font-size:11px;
            color:#9ca3af;
            font-weight:700;
            letter-spacing:1px;
          "
        >
          BIC / SWIFT
        </div>

        <div
          style="
            margin-top:5px;
            font-size:16px;
            font-weight:700;
            color:#111827;
          "
        >
          ${safeBic}
        </div>

      </div>

      <!-- BANK -->

      <div style="margin-bottom:20px;">

        <div
          style="
            font-size:11px;
            color:#9ca3af;
            font-weight:700;
            letter-spacing:1px;
          "
        >
          BANK NAME
        </div>

        <div
          style="
            margin-top:5px;
            font-size:15px;
            font-weight:600;
            color:#111827;
          "
        >
          ${safeBankName}
        </div>

      </div>

      <!-- COUNTRY -->

      <div style="margin-bottom:20px;">

        <div
          style="
            font-size:11px;
            color:#9ca3af;
            font-weight:700;
            letter-spacing:1px;
          "
        >
          BANK COUNTRY
        </div>

        <div
          style="
            margin-top:5px;
            font-size:15px;
            font-weight:600;
            color:#111827;
          "
        >
          ${safeBankCountry}
        </div>

      </div>

      <!-- CURRENCY -->

      <div style="margin-bottom:20px;">

        <div
          style="
            font-size:11px;
            color:#9ca3af;
            font-weight:700;
            letter-spacing:1px;
          "
        >
          TRANSFER CURRENCY
        </div>

        <div
          style="
            margin-top:5px;
            font-size:15px;
            font-weight:700;
            color:#111827;
          "
        >
          ${safeCurrency}
        </div>

      </div>

      <!-- AMOUNT -->

      <div>

        <div
          style="
            font-size:11px;
            color:#9ca3af;
            font-weight:700;
            letter-spacing:1px;
          "
        >
          AMOUNT
        </div>

        <div
          style="
            margin-top:5px;
            font-size:18px;
            font-weight:800;
            color:#111827;
          "
        >
          ${formattedAmount}
        </div>

      </div>

    </div>

  </div>

  <!-- PAYMENT REFERENCE -->

  <div
    style="
      background:#111827;
      border-radius:14px;
      padding:22px;
      margin-bottom:20px;
    "
  >

    <div
      style="
        font-size:11px;
        color:#9ca3af;
        font-weight:700;
        letter-spacing:1px;
      "
    >
      PAYMENT REFERENCE / DESCRIPTION
    </div>

    <div
      style="
        margin-top:8px;
        font-size:23px;
        font-weight:800;
        color:#ffffff;
        letter-spacing:1px;
      "
    >
      ${safeReference}
    </div>

  </div>

  <!-- IMPORTANT -->

  <div
    style="
      background:#fff7ed;
      border:1px solid #fed7aa;
      border-radius:12px;
      padding:17px;
      margin-bottom:26px;
    "
  >

    <div
      style="
        font-size:14px;
        line-height:1.65;
        color:#9a3412;
      "
    >
      <strong>Important:</strong>
      enter
      <strong>${safeReference}</strong>
      exactly in the reference, description or
      message field of your bank transfer.
      This allows us to match the payment to order
      <strong>${safeOrderNumber}</strong>.
    </div>

  </div>

  <!-- NEXT STEPS -->

  <div
    style="
      border-top:1px solid #e5e7eb;
      padding-top:24px;
    "
  >

    <div
      style="
        font-size:15px;
        font-weight:700;
        color:#111827;
        margin-bottom:8px;
      "
    >
      What happens next?
    </div>

    <p
      style="
        margin:0;
        color:#4b5563;
        font-size:14px;
        line-height:1.7;
      "
    >
      Once we receive and verify your payment,
      we'll send you a confirmation email and
      begin preparing your order. That confirmation
      will also include your estimated delivery time.
    </p>

  </div>

</td>
</tr>

<!-- FOOTER -->

<tr>
<td
  style="
    border-top:1px solid #e5e7eb;
    padding:24px 34px;
    color:#9ca3af;
    font-size:12px;
    line-height:1.6;
  "
>

  <strong style="color:#6b7280;">
    Lumina Phones
  </strong>

  <br />

  Order ${safeOrderNumber}

  <br />

  This is an automated order and payment
  instruction email.

</td>
</tr>

</table>

</td>
</tr>
</table>

</body>
</html>
`;

      /*
       * ----------------------------------------------------
       * SEND EMAIL WITH RESEND
       * ----------------------------------------------------
       */

      const resendResponse =
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
                  `Lumina Phones <${fromEmail}>`,

                to: [
                  customerEmail,
                ],

                subject:
                  `Payment instructions for ${orderNumber}`,

                html:
                  emailHtml,

                text:
                  emailText,
              }),
          }
        );

      let resendResult:
        unknown =
        null;

      try {
        resendResult =
          await resendResponse.json();
      } catch {
        resendResult =
          null;
      }

      /*
       * ----------------------------------------------------
       * RESEND ERROR
       * ----------------------------------------------------
       */

      if (
        !resendResponse.ok
      ) {
        console.error(
          "Resend error:",
          resendResult
        );

        /*
         * The order has already been
         * created.
         *
         * Do not delete it just because
         * email delivery failed.
         */

        return jsonResponse({
          success: true,

          email_sent:
            false,

          order,

          order_number:
            orderNumber,

          payment_reference:
            paymentReference,

          pricing: {
            currency,
            base_price:
              basePrice,

            variant_adjustment:
              variantPriceAdjustment,

            unit_price:
              unitPrice,

            quantity,

            total_amount:
              totalAmount,
          },

          warning:
            "Order created but payment email could not be sent.",
        });
      }

      /*
       * ----------------------------------------------------
       * SUCCESS
       * ----------------------------------------------------
       */

      return jsonResponse({
        success: true,

        email_sent:
          true,

        order,

        order_number:
          orderNumber,

        payment_reference:
          paymentReference,

        pricing: {
          currency,

          base_price:
            basePrice,

          variant_adjustment:
            variantPriceAdjustment,

          unit_price:
            unitPrice,

          quantity,

          total_amount:
            totalAmount,
        },
      });
    } catch (error) {
      console.error(
        "create-order error:",
        error
      );

      return jsonResponse(
        {
          success: false,

          error:
            error instanceof
              Error
              ? error.message
              : "Unexpected server error.",
        },
        500
      );
    }
  }
);