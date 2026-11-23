import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods":
    "POST, OPTIONS",
};

const allowedEvents = new Set([
  "page_view",
  "page_exit",
  "click",
  "search",
  "search_no_results",
  "product_view",
  "product_click",
  "filter_used",
  "add_to_cart",
  "remove_from_cart",
  "cart_view",
  "checkout_started",
  "checkout_completed",
  "language_changed",
  "currency_changed",
]);

function cleanString(
  value: unknown,
  maxLength = 500
) {
  return String(value ?? "")
    .trim()
    .slice(0, maxLength);
}

function cleanNullableString(
  value: unknown,
  maxLength = 500
) {
  const result =
    cleanString(
      value,
      maxLength
    );

  return result || null;
}

function sanitizeMetadata(
  value: unknown
): Record<string, unknown> {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return {};
  }

  const original =
    value as Record<
      string,
      unknown
    >;

  const allowedKeys =
    new Set([
      "target",
      "source",
      "brand",
      "condition",
      "storage",
      "color",
      "price",
      "currency",
      "result_count",
      "filter_name",
      "filter_value",
      "quantity",
      "viewport",
      "referrer_path",
    ]);

  const safe:
    Record<
      string,
      unknown
    > = {};

  for (
    const [
      key,
      val,
    ] of Object.entries(
      original
    )
  ) {
    if (
      !allowedKeys.has(
        key
      )
    ) {
      continue;
    }

    if (
      typeof val ===
        "string"
    ) {
      safe[key] =
        val.slice(
          0,
          300
        );

      continue;
    }

    if (
      typeof val ===
        "number" ||
      typeof val ===
        "boolean" ||
      val === null
    ) {
      safe[key] =
        val;
    }
  }

  return safe;
}

Deno.serve(
  async (
    req
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
      return new Response(
        JSON.stringify({
          success:
            false,

          message:
            "Method not allowed.",
        }),
        {
          status:
            405,

          headers: {
            ...corsHeaders,
            "Content-Type":
              "application/json",
          },
        }
      );
    }

    try {
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
        throw new Error(
          "Supabase configuration missing."
        );
      }

      const body =
        await req.json();

      const eventName =
        cleanString(
          body.event_name,
          80
        );

      const sessionId =
        cleanString(
          body.session_id,
          100
        );

      if (
        !eventName ||
        !allowedEvents.has(
          eventName
        )
      ) {
        return new Response(
          JSON.stringify({
            success:
              false,

            message:
              "Invalid analytics event.",
          }),
          {
            status:
              400,

            headers: {
              ...corsHeaders,
              "Content-Type":
                "application/json",
            },
          }
        );
      }

      if (
        !sessionId
      ) {
        return new Response(
          JSON.stringify({
            success:
              false,

            message:
              "Session ID required.",
          }),
          {
            status:
              400,

            headers: {
              ...corsHeaders,
              "Content-Type":
                "application/json",
            },
          }
        );
      }

      let durationMs:
        number | null =
        null;

      if (
        body.duration_ms !==
          undefined &&
        body.duration_ms !==
          null
      ) {
        const parsed =
          Number(
            body.duration_ms
          );

        if (
          Number.isFinite(
            parsed
          ) &&
          parsed >= 0
        ) {
          durationMs =
            Math.min(
              Math.round(
                parsed
              ),
              1000 *
                60 *
                60 *
                6
            );
        }
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

      const {
        error,
      } =
        await supabase
          .from(
            "analytics_events"
          )
          .insert({
            session_id:
              sessionId,

            event_name:
              eventName,

            page_path:
              cleanNullableString(
                body.page_path,
                500
              ),

            product_id:
              cleanNullableString(
                body.product_id,
                100
              ),

            product_slug:
              cleanNullableString(
                body.product_slug,
                200
              ),

            search_query:
              cleanNullableString(
                body.search_query,
                250
              ),

            duration_ms:
              durationMs,

            metadata:
              sanitizeMetadata(
                body.metadata
              ),
          });

      if (
        error
      ) {
        console.error(
          "analytics insert:",
          error
        );

        throw error;
      }

      return new Response(
        JSON.stringify({
          success:
            true,
        }),
        {
          status:
            200,

          headers: {
            ...corsHeaders,
            "Content-Type":
              "application/json",
          },
        }
      );
    } catch (
      error
    ) {
      console.error(
        "Analytics error:",
        error
      );

      return new Response(
        JSON.stringify({
          success:
            false,
        }),
        {
          status:
            500,

          headers: {
            ...corsHeaders,
            "Content-Type":
              "application/json",
          },
        }
      );
    }
  }
);