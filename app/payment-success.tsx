import {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    ActivityIndicator,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

import {
    router,
    useLocalSearchParams,
} from "expo-router";

import { supabase } from "../src/lib/supabase";

/* =========================================================
   TYPES
========================================================= */

type OrderSummary = {
  id: string;

  order_number:
    string | null;

  payment_status:
    string | null;

  order_status:
    string | null;

  stripe_payment_status:
    string | null;

  stripe_payment_method_type:
    string | null;

  total_amount:
    number | string | null;

  currency:
    string | null;

  display_total_amount:
    number | string | null;

  display_currency:
    string | null;

  customer_email:
    string | null;
};

/* =========================================================
   HELPERS
========================================================= */

function cleanString(
  value:
    unknown
) {
  return String(
    value ?? ""
  ).trim();
}

function toNumber(
  value:
    number | string | null | undefined
) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const parsed =
    typeof value === "number"
      ? value
      : Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : null;
}

function formatMoney(
  amount:
    number | string | null | undefined,

  currency:
    string | null | undefined
) {
  const numericAmount =
    toNumber(amount);

  if (
    numericAmount === null
  ) {
    return null;
  }

  const normalizedCurrency =
    cleanString(currency)
      .toUpperCase();

  if (
    normalizedCurrency === "CVE"
  ) {
    return `${Math.round(
      numericAmount
    ).toLocaleString(
      "pt-PT"
    )} CVE`;
  }

  if (
    normalizedCurrency === "EUR"
  ) {
    return new Intl.NumberFormat(
      "pt-PT",
      {
        style:
          "currency",

        currency:
          "EUR",
      }
    ).format(
      numericAmount
    );
  }

  return `${numericAmount.toFixed(
    2
  )} ${normalizedCurrency}`;
}

function paymentMethodLabel(
  method:
    string | null
) {
  switch (
    cleanString(method)
      .toLowerCase()
  ) {
    case "klarna":
      return "Klarna";

    case "card":
      return "Card";

    case "paypal":
      return "PayPal";

    case "ideal":
      return "iDEAL";

    case "bancontact":
      return "Bancontact";

    case "link":
      return "Link";

    default:
      return null;
  }
}

/* =========================================================
   PAGE
========================================================= */

export default function PaymentSuccessScreen() {
  const params =
    useLocalSearchParams<{
      session_id?:
        string | string[];
    }>();

  const sessionId =
    useMemo(
      () => {
        const raw =
          params.session_id;

        if (
          Array.isArray(
            raw
          )
        ) {
          return cleanString(
            raw[0]
          );
        }

        return cleanString(
          raw
        );
      },
      [
        params.session_id,
      ]
    );

  const [
    loading,
    setLoading,
  ] =
    useState(
      true
    );

  const [
    order,
    setOrder,
  ] =
    useState<
      OrderSummary | null
    >(
      null
    );

  const [
    error,
    setError,
  ] =
    useState<
      string | null
    >(
      null
    );

  /* =======================================================
     LOAD ORDER
  ======================================================= */

  useEffect(
    () => {
      let cancelled =
        false;

      async function loadOrder() {
        setLoading(
          true
        );

        setError(
          null
        );

        if (
          !sessionId
        ) {
          if (
            !cancelled
          ) {
            setError(
              "Payment session information is missing."
            );

            setLoading(
              false
            );
          }

          return;
        }

        try {
          const {
            data,
            error:
              queryError,
          } =
            await supabase
              .from(
                "orders"
              )
              .select(
                `
                id,
                order_number,
                payment_status,
                order_status,
                stripe_payment_status,
                stripe_payment_method_type,
                total_amount,
                currency,
                display_total_amount,
                display_currency,
                customer_email
                `
              )
              .eq(
                "stripe_checkout_session_id",
                sessionId
              )
              .maybeSingle();

          if (
            cancelled
          ) {
            return;
          }

          if (
            queryError
          ) {
            console.error(
              "Payment success order query error:",
              queryError
            );

            setError(
              "We received your return from the payment provider, but could not load the order details."
            );

            return;
          }

          if (
            !data
          ) {
            setError(
              "Your payment was returned successfully, but the order is still being confirmed."
            );

            return;
          }

          setOrder(
            data as OrderSummary
          );
        } catch (
          loadError
        ) {
          console.error(
            "Payment success load error:",
            loadError
          );

          if (
            !cancelled
          ) {
            setError(
              "We could not load your order details."
            );
          }
        } finally {
          if (
            !cancelled
          ) {
            setLoading(
              false
            );
          }
        }
      }

      loadOrder();

      return () => {
        cancelled =
          true;
      };
    },
    [
      sessionId,
    ]
  );

  /* =======================================================
     DERIVED STATE
  ======================================================= */

  const paymentStatus =
    cleanString(
      order
        ?.payment_status
    ).toLowerCase();

  const stripePaymentStatus =
    cleanString(
      order
        ?.stripe_payment_status
    ).toLowerCase();

  const paymentConfirmed =
    paymentStatus ===
      "paid" ||
    stripePaymentStatus ===
      "paid";

  const paymentPending =
    !paymentConfirmed &&
    (
      paymentStatus ===
        "awaiting_payment" ||
      paymentStatus ===
        "pending" ||
      stripePaymentStatus ===
        "unpaid" ||
      stripePaymentStatus ===
        "processing"
    );

  const displayTotal =
    order
      ? (
          formatMoney(
            order
              .display_total_amount,
            order
              .display_currency
          ) ??
          formatMoney(
            order
              .total_amount,
            order
              .currency
          )
        )
      : null;

  const methodLabel =
    paymentMethodLabel(
      order
        ?.stripe_payment_method_type ??
        null
    );

  /* =======================================================
     ACTIONS
  ======================================================= */

  function goHome() {
    router.replace(
      "/"
    );
  }

  function continueShopping() {
    router.replace(
      "/"
    );
  }

  /* =======================================================
     LOADING
  ======================================================= */

  if (
    loading
  ) {
    return (
      <View
        style={
          styles.page
        }
      >
        <View
          style={
            styles.loadingContainer
          }
        >
          <ActivityIndicator
            size="large"
          />

          <Text
            style={
              styles.loadingTitle
            }
          >
            Confirming your payment
          </Text>

          <Text
            style={
              styles.loadingText
            }
          >
            Please wait while we check your POKAPOK order.
          </Text>
        </View>
      </View>
    );
  }

  /* =======================================================
     SUCCESS PAGE
  ======================================================= */

  return (
    <ScrollView
      style={
        styles.page
      }
      contentContainerStyle={
        styles.content
      }
      showsVerticalScrollIndicator={
        false
      }
    >
      <View
        style={
          styles.card
        }
      >
        <View
          style={[
            styles.iconCircle,

            paymentConfirmed
              ? styles.successIconCircle
              : styles.pendingIconCircle,
          ]}
        >
          <Text
            style={
              styles.iconText
            }
          >
            {paymentConfirmed
              ? "✓"
              : "…"}
          </Text>
        </View>

        <Text
          style={
            styles.title
          }
        >
          {paymentConfirmed
            ? "Payment successful"
            : paymentPending
              ? "Payment received"
              : "Order received"}
        </Text>

        <Text
          style={
            styles.subtitle
          }
        >
          {paymentConfirmed
            ? "Thank you. Your payment has been confirmed and your POKAPOK order is now being processed."
            : "Your checkout has been completed. We are waiting for the final payment confirmation."}
        </Text>

        {order ? (
          <View
            style={
              styles.orderBox
            }
          >
            {order.order_number ? (
              <View
                style={
                  styles.row
                }
              >
                <Text
                  style={
                    styles.label
                  }
                >
                  Order
                </Text>

                <Text
                  style={
                    styles.value
                  }
                >
                  {
                    order.order_number
                  }
                </Text>
              </View>
            ) : null}

            {displayTotal ? (
              <View
                style={
                  styles.row
                }
              >
                <Text
                  style={
                    styles.label
                  }
                >
                  Total
                </Text>

                <Text
                  style={
                    styles.value
                  }
                >
                  {
                    displayTotal
                  }
                </Text>
              </View>
            ) : null}

            {methodLabel ? (
              <View
                style={
                  styles.row
                }
              >
                <Text
                  style={
                    styles.label
                  }
                >
                  Payment method
                </Text>

                <Text
                  style={
                    styles.value
                  }
                >
                  {
                    methodLabel
                  }
                </Text>
              </View>
            ) : null}

            <View
              style={[
                styles.row,
                styles.lastRow,
              ]}
            >
              <Text
                style={
                  styles.label
                }
              >
                Status
              </Text>

              <Text
                style={[
                  styles.value,

                  paymentConfirmed
                    ? styles.successText
                    : styles.pendingText,
                ]}
              >
                {paymentConfirmed
                  ? "Paid"
                  : "Processing"}
              </Text>
            </View>
          </View>
        ) : null}

        {error ? (
          <View
            style={
              styles.notice
            }
          >
            <Text
              style={
                styles.noticeText
              }
            >
              {
                error
              }
            </Text>
          </View>
        ) : null}

        <View
          style={
            styles.infoSection
          }
        >
          <Text
            style={
              styles.infoTitle
            }
          >
            What happens next?
          </Text>

          <Text
            style={
              styles.infoText
            }
          >
            We will prepare your order and send you an update when it is ready for shipment.
          </Text>

          {order
            ?.customer_email ? (
            <Text
              style={
                styles.infoText
              }
            >
              A confirmation will be sent to{" "}
              {
                order.customer_email
              }.
            </Text>
          ) : null}
        </View>

        <Pressable
          onPress={
            continueShopping
          }
          style={({
            pressed,
          }) => [
            styles.primaryButton,

            pressed &&
              styles.buttonPressed,
          ]}
        >
          <Text
            style={
              styles.primaryButtonText
            }
          >
            Continue shopping
          </Text>
        </Pressable>

        <Pressable
          onPress={
            goHome
          }
          style={({
            pressed,
          }) => [
            styles.secondaryButton,

            pressed &&
              styles.buttonPressed,
          ]}
        >
          <Text
            style={
              styles.secondaryButtonText
            }
          >
            Back to POKAPOK
          </Text>
        </Pressable>

        {sessionId ? (
          <Text
            selectable={
              true
            }
            style={
              styles.sessionText
            }
          >
            Session:{" "}
            {
              sessionId
            }
          </Text>
        ) : null}
      </View>
    </ScrollView>
  );
}

/* =========================================================
   STYLES
========================================================= */

const styles =
  StyleSheet.create({
    page: {
      flex:
        1,

      backgroundColor:
        "#f7f8fa",
    },

    content: {
      flexGrow:
        1,

      alignItems:
        "center",

      justifyContent:
        "center",

      paddingHorizontal:
        20,

      paddingVertical:
        48,
    },

    loadingContainer: {
      flex:
        1,

      alignItems:
        "center",

      justifyContent:
        "center",

      paddingHorizontal:
        24,
    },

    loadingTitle: {
      marginTop:
        20,

      fontSize:
        24,

      fontWeight:
        "700",

      color:
        "#111827",

      textAlign:
        "center",
    },

    loadingText: {
      marginTop:
        10,

      maxWidth:
        420,

      fontSize:
        15,

      lineHeight:
        22,

      color:
        "#6b7280",

      textAlign:
        "center",
    },

    card: {
      width:
        "100%",

      maxWidth:
        560,

      backgroundColor:
        "#ffffff",

      borderRadius:
        28,

      padding:
        Platform.OS ===
          "web"
          ? 40
          : 26,

      borderWidth:
        1,

      borderColor:
        "#e8eaed",

      ...Platform.select({
        web: {
          boxShadow:
            "0 20px 60px rgba(0,0,0,0.08)",
        },

        default: {
          shadowColor:
            "#000",

          shadowOpacity:
            0.08,

          shadowRadius:
            18,

          shadowOffset: {
            width:
              0,

            height:
              8,
          },

          elevation:
            4,
        },
      }),
    },

    iconCircle: {
      width:
        72,

      height:
        72,

      borderRadius:
        36,

      alignSelf:
        "center",

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    successIconCircle: {
      backgroundColor:
        "#e8f8ef",
    },

    pendingIconCircle: {
      backgroundColor:
        "#fff5dd",
    },

    iconText: {
      fontSize:
        38,

      fontWeight:
        "700",

      color:
        "#111827",
    },

    title: {
      marginTop:
        24,

      fontSize:
        32,

      lineHeight:
        38,

      fontWeight:
        "800",

      letterSpacing:
        -0.7,

      color:
        "#101114",

      textAlign:
        "center",
    },

    subtitle: {
      marginTop:
        12,

      fontSize:
        16,

      lineHeight:
        24,

      color:
        "#64686f",

      textAlign:
        "center",
    },

    orderBox: {
      marginTop:
        30,

      borderRadius:
        18,

      backgroundColor:
        "#f7f8fa",

      paddingHorizontal:
        18,
    },

    row: {
      minHeight:
        58,

      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "space-between",

      gap:
        20,

      borderBottomWidth:
        1,

      borderBottomColor:
        "#e7e9ec",
    },

    lastRow: {
      borderBottomWidth:
        0,
    },

    label: {
      flex:
        1,

      fontSize:
        14,

      color:
        "#777b82",
    },

    value: {
      flexShrink:
        1,

      fontSize:
        14,

      fontWeight:
        "600",

      color:
        "#181a1f",

      textAlign:
        "right",
    },

    successText: {
      color:
        "#17864b",
    },

    pendingText: {
      color:
        "#9a6811",
    },

    notice: {
      marginTop:
        20,

      padding:
        16,

      borderRadius:
        14,

      backgroundColor:
        "#fff8e6",
    },

    noticeText: {
      fontSize:
        14,

      lineHeight:
        20,

      color:
        "#775615",
    },

    infoSection: {
      marginTop:
        28,
    },

    infoTitle: {
      fontSize:
        17,

      fontWeight:
        "700",

      color:
        "#181a1f",
    },

    infoText: {
      marginTop:
        8,

      fontSize:
        14,

      lineHeight:
        21,

      color:
        "#696d74",
    },

    primaryButton: {
      minHeight:
        54,

      marginTop:
        30,

      borderRadius:
        16,

      backgroundColor:
        "#111827",

      alignItems:
        "center",

      justifyContent:
        "center",

      paddingHorizontal:
        22,
    },

    primaryButtonText: {
      fontSize:
        16,

      fontWeight:
        "700",

      color:
        "#ffffff",
    },

    secondaryButton: {
      minHeight:
        52,

      marginTop:
        10,

      borderRadius:
        16,

      borderWidth:
        1,

      borderColor:
        "#dfe2e6",

      backgroundColor:
        "#ffffff",

      alignItems:
        "center",

      justifyContent:
        "center",

      paddingHorizontal:
        22,
    },

    secondaryButtonText: {
      fontSize:
        15,

      fontWeight:
        "600",

      color:
        "#25282d",
    },

    buttonPressed: {
      opacity:
        0.75,
    },

    sessionText: {
      marginTop:
        24,

      fontSize:
        10,

      lineHeight:
        15,

      color:
        "#a0a4aa",

      textAlign:
        "center",
    },
  });