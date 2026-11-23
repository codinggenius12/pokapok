import { createClient } from "@supabase/supabase-js";

/* =========================================================
   TYPES
========================================================= */

type StripeEvent = {
  id?: string;
  type?: string;
  data?: {
    object?: StripeCheckoutSession;
  };
};

type StripePaymentMethod = {
  id?: string;
  type?: string;
};

type StripePaymentIntent = {
  id?: string;
  status?: string;
  payment_method?:
    | string
    | StripePaymentMethod
    | null;
};

type StripeCheckoutSession = {
  id?: string;

  object?: string;

  client_reference_id?:
    | string
    | null;

  metadata?: Record<
    string,
    string
  >;

  payment_status?:
    | string
    | null;

  status?:
    | string
    | null;

  amount_total?:
    | number
    | null;

  currency?:
    | string
    | null;

  customer_email?:
    | string
    | null;

  payment_method_types?:
    string[];

  payment_intent?:
    | string
    | StripePaymentIntent
    | null;

  [key: string]:
    unknown;
};

type OrderRow = {
  id: string;

  order_number:
    string;

  total_amount:
    | number
    | string
    | null;

  currency:
    | string
    | null;

  payment_status:
    | string
    | null;

  order_status:
    | string
    | null;

  status:
    | string
    | null;

  stripe_checkout_session_id:
    | string
    | null;

  stripe_payment_intent_id:
    | string
    | null;

  stripe_payment_status:
    | string
    | null;

  stripe_payment_method_type:
    | string
    | null;
};

/* =========================================================
   CORS
========================================================= */

const corsHeaders = {
  "Access-Control-Allow-Origin":
    "*",

  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, stripe-signature",

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

/* =========================================================
   HELPERS
========================================================= */

function cleanString(
  value: unknown
) {
  return String(
    value ?? ""
  ).trim();
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
      : Number(value);

  if (
    !Number.isFinite(
      parsed
    )
  ) {
    return null;
  }

  return parsed;
}

function moneyToCents(
  value: number
) {
  return Math.round(
    value * 100
  );
}

/* =========================================================
   STRIPE SIGNATURE
========================================================= */

function hexToBytes(
  hex: string
) {
  if (
    hex.length % 2 !==
    0
  ) {
    throw new Error(
      "INVALID_HEX"
    );
  }

  const bytes =
    new Uint8Array(
      hex.length / 2
    );

  for (
    let index = 0;
    index < hex.length;
    index += 2
  ) {
    bytes[
      index / 2
    ] =
      parseInt(
        hex.slice(
          index,
          index + 2
        ),
        16
      );
  }

  return bytes;
}

function parseStripeSignature(
  header: string
) {
  let timestamp:
    number | null =
    null;

  const signatures:
    string[] = [];

  for (
    const part of
      header.split(",")
  ) {
    const [
      key,
      value,
    ] =
      part.split(
        "=",
        2
      );

    if (
      key === "t"
    ) {
      const parsed =
        Number(value);

      if (
        Number.isFinite(
          parsed
        )
      ) {
        timestamp =
          parsed;
      }
    }

    if (
      key === "v1" &&
      value
    ) {
      signatures.push(
        value
      );
    }
  }

  return {
    timestamp,
    signatures,
  };
}

async function verifyStripeSignature(
  payload: string,
  signatureHeader: string,
  webhookSecret: string
) {
  const {
    timestamp,
    signatures,
  } =
    parseStripeSignature(
      signatureHeader
    );

  if (
    !timestamp ||
    signatures.length ===
      0
  ) {
    return false;
  }

  /*
   * Reject signatures older/newer than 5 minutes.
   */
  const now =
    Math.floor(
      Date.now() /
        1000
    );

  const toleranceSeconds =
    300;

  if (
    Math.abs(
      now -
        timestamp
    ) >
    toleranceSeconds
  ) {
    console.error(
      "Stripe webhook timestamp outside tolerance:",
      {
        now,
        timestamp,
      }
    );

    return false;
  }

  const signedPayload =
    `${timestamp}.${payload}`;

  const encoder =
    new TextEncoder();

  const key =
    await crypto.subtle.importKey(
      "raw",
      encoder.encode(
        webhookSecret
      ),
      {
        name:
          "HMAC",
        hash:
          "SHA-256",
      },
      false,
      [
        "verify",
      ]
    );

  for (
    const signature of
      signatures
  ) {
    try {
      const valid =
        await crypto.subtle.verify(
          "HMAC",
          key,
          hexToBytes(
            signature
          ),
          encoder.encode(
            signedPayload
          )
        );

      if (valid) {
        return true;
      }
    } catch (
      error
    ) {
      console.error(
        "Stripe signature verification attempt failed:",
        error
      );
    }
  }

  return false;
}

/* =========================================================
   STRIPE API
========================================================= */

async function retrieveStripeSession(
  stripeSecretKey:
    string,

  sessionId:
    string
) {
  const url =
    new URL(
      `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(
        sessionId
      )}`
    );

  url.searchParams.append(
    "expand[]",
    "payment_intent.payment_method"
  );

  const response =
    await fetch(
      url.toString(),
      {
        method:
          "GET",

        headers: {
          Authorization:
            `Bearer ${stripeSecretKey}`,
        },

        signal:
          AbortSignal.timeout(
            15000
          ),
      }
    );

  const text =
    await response.text();

  let data:
    StripeCheckoutSession &
    {
      error?: {
        message?: string;
      };
    } = {};

  try {
    data =
      text
        ? JSON.parse(
            text
          )
        : {};
  } catch {
    throw new Error(
      "STRIPE_SESSION_RESPONSE_INVALID"
    );
  }

  if (
    !response.ok
  ) {
    console.error(
      "Stripe session retrieval failed:",
      {
        status:
          response.status,
        data,
      }
    );

    throw new Error(
      data.error
        ?.message ??
        "STRIPE_SESSION_RETRIEVE_FAILED"
    );
  }

  return data;
}

/* =========================================================
   PAYMENT METHOD
========================================================= */

function getPaymentIntentId(
  session:
    StripeCheckoutSession
) {
  if (
    typeof session
      .payment_intent ===
    "string"
  ) {
    return session
      .payment_intent;
  }

  if (
    session
      .payment_intent &&
    typeof session
      .payment_intent ===
      "object"
  ) {
    return (
      session
        .payment_intent
        .id ??
      null
    );
  }

  return null;
}

function getPaymentMethodType(
  session:
    StripeCheckoutSession
) {
  const paymentIntent =
    session
      .payment_intent;

  if (
    paymentIntent &&
    typeof paymentIntent ===
      "object"
  ) {
    const paymentMethod =
      paymentIntent
        .payment_method;

    if (
      paymentMethod &&
      typeof paymentMethod ===
        "object" &&
      paymentMethod.type
    ) {
      return paymentMethod.type;
    }
  }

  /*
   * Fallback. Usually only one of these will be relevant
   * for the final successful payment.
   */
  const methods =
    session
      .payment_method_types ??
    [];

  if (
    methods.length ===
      1
  ) {
    return methods[0];
  }

  return null;
}

/* =========================================================
   ORDER LOOKUP
========================================================= */

function getPokapokOrderId(
  session:
    StripeCheckoutSession
) {
  return (
    cleanString(
      session.metadata
        ?.pokapok_order_id
    ) ||
    cleanString(
      session
        .client_reference_id
    ) ||
    null
  );
}

/* =========================================================
   AMOUNT VERIFICATION
========================================================= */

function verifyOrderAmount(
  order:
    OrderRow,

  session:
    StripeCheckoutSession
) {
  const orderTotal =
    toNumber(
      order.total_amount
    );

  const stripeAmount =
    session.amount_total;

  const stripeCurrency =
    cleanString(
      session.currency
    ).toUpperCase();

  const orderCurrency =
    cleanString(
      order.currency
    ).toUpperCase();

  if (
    orderTotal === null ||
    stripeAmount ===
      null ||
    stripeAmount ===
      undefined
  ) {
    return {
      valid:
        false,

      reason:
        "AMOUNT_MISSING",
    };
  }

  if (
    orderCurrency !==
      "EUR" ||
    stripeCurrency !==
      "EUR"
  ) {
    return {
      valid:
        false,

      reason:
        "CURRENCY_MISMATCH",
    };
  }

  const expectedCents =
    moneyToCents(
      orderTotal
    );

  if (
    expectedCents !==
      stripeAmount
  ) {
    return {
      valid:
        false,

      reason:
        "AMOUNT_MISMATCH",

      expectedCents,

      stripeAmount,
    };
  }

  return {
    valid:
      true,
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

      const stripeWebhookSecret =
        Deno.env.get(
          "STRIPE_WEBHOOK_SECRET"
        );

      if (
        !supabaseUrl ||
        !serviceRoleKey
      ) {
        console.error(
          "Supabase environment missing."
        );

        return jsonResponse(
          {
            success:
              false,

            error:
              "SUPABASE_CONFIGURATION_MISSING",
          },
          500
        );
      }

      if (
        !stripeSecretKey
      ) {
        console.error(
          "STRIPE_SECRET_KEY missing."
        );

        return jsonResponse(
          {
            success:
              false,

            error:
              "STRIPE_SECRET_KEY_MISSING",
          },
          500
        );
      }

      if (
        !stripeWebhookSecret
      ) {
        console.error(
          "STRIPE_WEBHOOK_SECRET missing."
        );

        return jsonResponse(
          {
            success:
              false,

            error:
              "STRIPE_WEBHOOK_SECRET_MISSING",
          },
          500
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
         RAW BODY
      =================================================== */

      /*
       * IMPORTANT:
       *
       * Do not call request.json() before verifying the
       * Stripe signature.
       *
       * Stripe signs the exact raw HTTP body.
       */
      const rawBody =
        await request.text();

      const signatureHeader =
        request.headers.get(
          "stripe-signature"
        );

      if (
        !signatureHeader
      ) {
        console.error(
          "Stripe-Signature header missing."
        );

        return jsonResponse(
          {
            success:
              false,

            error:
              "STRIPE_SIGNATURE_MISSING",
          },
          400
        );
      }

      const signatureValid =
        await verifyStripeSignature(
          rawBody,
          signatureHeader,
          stripeWebhookSecret
        );

      if (
        !signatureValid
      ) {
        console.error(
          "Invalid Stripe webhook signature."
        );

        return jsonResponse(
          {
            success:
              false,

            error:
              "INVALID_STRIPE_SIGNATURE",
          },
          400
        );
      }

      /* ===================================================
         PARSE EVENT
      =================================================== */

      let event:
        StripeEvent;

      try {
        event =
          JSON.parse(
            rawBody
          ) as StripeEvent;
      } catch {
        return jsonResponse(
          {
            success:
              false,

            error:
              "INVALID_JSON",
          },
          400
        );
      }

      const eventId =
        cleanString(
          event.id
        );

      const eventType =
        cleanString(
          event.type
        );

      console.log(
        "Stripe webhook received:",
        {
          eventId,
          eventType,
        }
      );

      /* ===================================================
         IGNORE EVENTS WE DON'T USE
      =================================================== */

      const supportedEvents =
        new Set([
          "checkout.session.completed",
          "checkout.session.async_payment_succeeded",
          "checkout.session.async_payment_failed",
        ]);

      if (
        !supportedEvents.has(
          eventType
        )
      ) {
        return jsonResponse({
          success:
            true,

          ignored:
            true,

          event:
            eventType,
        });
      }

      /* ===================================================
         SESSION ID
      =================================================== */

      const eventSession =
        event.data
          ?.object;

      const sessionId =
        cleanString(
          eventSession?.id
        );

      if (
        !sessionId
      ) {
        console.error(
          "Stripe session ID missing from event."
        );

        return jsonResponse(
          {
            success:
              false,

            error:
              "STRIPE_SESSION_ID_MISSING",
          },
          400
        );
      }

      /* ===================================================
         RE-FETCH SESSION DIRECTLY FROM STRIPE
      =================================================== */

      const session =
        await retrieveStripeSession(
          stripeSecretKey,
          sessionId
        );

      const pokapokOrderId =
        getPokapokOrderId(
          session
        );

      if (
        !pokapokOrderId
      ) {
        console.error(
          "POKAPOK order ID missing from Stripe session:",
          sessionId
        );

        return jsonResponse(
          {
            success:
              false,

            error:
              "POKAPOK_ORDER_ID_MISSING",
          },
          400
        );
      }

      /* ===================================================
         LOAD ORDER
      =================================================== */

      const {
        data:
          orderData,

        error:
          orderError,
      } =
        await supabase
          .from(
            "orders"
          )
          .select(
            `
            id,
            order_number,
            total_amount,
            currency,
            payment_status,
            order_status,
            status,
            stripe_checkout_session_id,
            stripe_payment_intent_id,
            stripe_payment_status,
            stripe_payment_method_type
            `
          )
          .eq(
            "id",
            pokapokOrderId
          )
          .maybeSingle();

      if (
        orderError
      ) {
        console.error(
          "POKAPOK order query failed:",
          orderError
        );

        return jsonResponse(
          {
            success:
              false,

            error:
              "ORDER_QUERY_FAILED",
          },
          500
        );
      }

      const order =
        orderData as
          | OrderRow
          | null;

      if (!order) {
        console.error(
          "POKAPOK order not found:",
          pokapokOrderId
        );

        return jsonResponse(
          {
            success:
              false,

            error:
              "ORDER_NOT_FOUND",
          },
          404
        );
      }

      /* ===================================================
         SESSION MUST BELONG TO THIS ORDER
      =================================================== */

      if (
        order
          .stripe_checkout_session_id &&
        order
          .stripe_checkout_session_id !==
          sessionId
      ) {
        console.error(
          "Stripe session does not match stored order:",
          {
            orderId:
              order.id,

            expected:
              order
                .stripe_checkout_session_id,

            received:
              sessionId,
          }
        );

        return jsonResponse(
          {
            success:
              false,

            error:
              "STRIPE_SESSION_MISMATCH",
          },
          400
        );
      }

      /* ===================================================
         VERIFY MONEY
      =================================================== */

      const amountCheck =
        verifyOrderAmount(
          order,
          session
        );

      if (
        !amountCheck.valid
      ) {
        console.error(
          "Stripe amount verification failed:",
          {
            orderId:
              order.id,

            sessionId,

            ...amountCheck,
          }
        );

        await supabase
          .from(
            "orders"
          )
          .update({
            stripe_payment_status:
              "AMOUNT_VERIFICATION_FAILED",
          })
          .eq(
            "id",
            order.id
          );

        return jsonResponse(
          {
            success:
              false,

            error:
              "STRIPE_AMOUNT_VERIFICATION_FAILED",
          },
          400
        );
      }

      /* ===================================================
         STRIPE DETAILS
      =================================================== */

      const paymentIntentId =
        getPaymentIntentId(
          session
        );

      const paymentMethodType =
        getPaymentMethodType(
          session
        );

      const stripePaymentStatus =
        cleanString(
          session
            .payment_status
        ) ||
        "unknown";

      console.log(
        "Verified Stripe Checkout:",
        {
          eventId,
          eventType,

          orderId:
            order.id,

          orderNumber:
            order
              .order_number,

          sessionId,

          paymentIntentId,

          paymentMethodType,

          stripePaymentStatus,

          amountTotal:
            session
              .amount_total,

          currency:
            session
              .currency,
        }
      );

      /* ===================================================
         PAYMENT FAILED
      =================================================== */

      if (
        eventType ===
          "checkout.session.async_payment_failed"
      ) {
        /*
         * Never downgrade an order that has already been
         * confirmed as paid.
         */
        if (
          order.payment_status ===
            "paid"
        ) {
          console.warn(
            "Ignoring async failure because order is already paid:",
            order.id
          );

          return jsonResponse({
            success:
              true,

            ignored:
              true,

            reason:
              "ORDER_ALREADY_PAID",
          });
        }

        const {
          error:
            failedUpdateError,
        } =
          await supabase
            .from(
              "orders"
            )
            .update({
              stripe_checkout_session_id:
                sessionId,

              stripe_payment_intent_id:
                paymentIntentId,

              stripe_payment_status:
                stripePaymentStatus ||
                "failed",

              stripe_payment_method_type:
                paymentMethodType,

              payment_status:
                "payment_failed",
            })
            .eq(
              "id",
              order.id
            );

        if (
          failedUpdateError
        ) {
          console.error(
            "Could not update failed Stripe payment:",
            failedUpdateError
          );

          return jsonResponse(
            {
              success:
                false,

              error:
                "ORDER_UPDATE_FAILED",
            },
            500
          );
        }

        return jsonResponse({
          success:
            true,

          event:
            eventType,

          order_id:
            order.id,

          payment_status:
            "payment_failed",
        });
      }

      /* ===================================================
         COMPLETED BUT NOT YET PAID
      =================================================== */

      /*
       * Some payment methods can finish Checkout before the
       * funds are actually confirmed.
       *
       * checkout.session.completed by itself does NOT mean
       * we should blindly mark the POKAPOK order as paid.
       */
      if (
        stripePaymentStatus !==
          "paid"
      ) {
        /*
         * async_payment_succeeded should normally resolve
         * to payment_status=paid. If Stripe says otherwise,
         * we stay conservative and keep the order pending.
         */
        const {
          error:
            pendingUpdateError,
        } =
          await supabase
            .from(
              "orders"
            )
            .update({
              stripe_checkout_session_id:
                sessionId,

              stripe_payment_intent_id:
                paymentIntentId,

              stripe_payment_status:
                stripePaymentStatus,

              stripe_payment_method_type:
                paymentMethodType,

              payment_status:
                "awaiting_payment",
            })
            .eq(
              "id",
              order.id
            );

        if (
          pendingUpdateError
        ) {
          console.error(
            "Could not update pending Stripe payment:",
            pendingUpdateError
          );

          return jsonResponse(
            {
              success:
                false,

              error:
                "ORDER_UPDATE_FAILED",
            },
            500
          );
        }

        return jsonResponse({
          success:
            true,

          event:
            eventType,

          order_id:
            order.id,

          payment_status:
            "awaiting_payment",

          stripe_payment_status:
            stripePaymentStatus,
        });
      }

      /* ===================================================
         PAYMENT SUCCESS
      =================================================== */

      /*
       * At this point:
       *
       * - Stripe signature is valid
       * - Checkout Session was retrieved from Stripe
       * - POKAPOK order exists
       * - Checkout Session belongs to the order
       * - amount matches
       * - currency matches EUR
       * - Stripe reports payment_status = paid
       */

      const now =
        new Date()
          .toISOString();

      const {
        error:
          paidUpdateError,
      } =
        await supabase
          .from(
            "orders"
          )
          .update({
            stripe_checkout_session_id:
              sessionId,

            stripe_payment_intent_id:
              paymentIntentId,

            stripe_payment_status:
              stripePaymentStatus,

            stripe_payment_method_type:
              paymentMethodType,

            payment_status:
              "paid",

            order_status:
              "confirmed",

            status:
              "confirmed",

            payment_received_at:
              order.payment_status ===
                "paid"
                ? undefined
                : now,
          })
          .eq(
            "id",
            order.id
          );

      if (
        paidUpdateError
      ) {
        console.error(
          "Could not mark Stripe order paid:",
          paidUpdateError
        );

        return jsonResponse(
          {
            success:
              false,

            error:
              "ORDER_UPDATE_FAILED",
          },
          500
        );
      }

      console.log(
        "POKAPOK Stripe order marked paid:",
        {
          orderId:
            order.id,

          orderNumber:
            order
              .order_number,

          sessionId,

          paymentIntentId,

          paymentMethodType,

          eventId,
        }
      );

      return jsonResponse({
        success:
          true,

        event:
          eventType,

        order_id:
          order.id,

        order_number:
          order
            .order_number,

        payment_status:
          "paid",

        stripe_payment_status:
          stripePaymentStatus,

        stripe_payment_method_type:
          paymentMethodType,
      });
    } catch (
      error
    ) {
      console.error(
        "stripe-webhook error:",
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
          },
          504
        );
      }

      return jsonResponse(
        {
          success:
            false,

          error:
            error instanceof
              Error
              ? error.message
              : "UNKNOWN_ERROR",
        },
        500
      );
    }
  }
);