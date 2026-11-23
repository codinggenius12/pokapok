import {
    useEffect,
    useRef,
    useState,
} from "react";

import {
    StyleSheet,
    Text,
    View,
} from "react-native";

import {
    capturePayPalOrder,
    createPayPalOrder,
    type CreatePayPalOrderItemInput,
    type PayPalDisplayCurrency,
    type PayPalLanguage,
} from "../../services/paypalService";

/* =========================================================
   TYPES
========================================================= */

type Props = {
  /* =======================================================
     PRODUCTS
  ======================================================= */

  items:
    CreatePayPalOrderItemInput[];

  /* CUSTOMER */

  customerName:
    string;

  customerEmail?:
    | string
    | null;

  customerWhatsapp:
    string;

  /* DELIVERY */

  country:
    string;

  stateRegion:
    string;

  city?:
    | string
    | null;

  street?:
    | string
    | null;

  houseNumber?:
    | string
    | null;

  addressLine2?:
    | string
    | null;

  postalCode?:
    | string
    | null;

  /* ORDER */

  notes?:
    | string
    | null;

  language:
    PayPalLanguage;

  displayCurrency:
    PayPalDisplayCurrency;

  /* STATE */

  disabled?:
    boolean;

  onBeforeStart?: () =>
    | boolean
    | Promise<boolean>;

  onSuccess: (
    result: {
      paypalOrderId:
        string;

      captureId:
        string;

      amount:
        | number
        | null;

      currency:
        | string
        | null;

      orderId:
        string
        | null;

      orderNumber:
        string
        | null;

      paymentStatus:
        string
        | null;

      orderStatus:
        string
        | null;

      emailSent:
        boolean;

      warning:
        string
        | null;

      subtotal:
        number
        | null;

      shipping:
        number
        | null;

      total:
        number
        | null;

      displayCurrency:
        string
        | null;

      displayTotal:
        number
        | null;

      exchangeRate:
        number
        | null;
    }
  ) => void;

  onCancel?: () =>
    void;

  onError?: (
    error:
      Error
  ) => void;
};

/* =========================================================
   PAYPAL TYPES
========================================================= */

type PayPalApproveData = {
  orderId:
    string;
};

type PayPalSession = {
  start: (
    options: {
      presentationMode:
        "auto";
    },

    orderPromise:
      Promise<{
        orderId:
          string;
      }>
  ) =>
    Promise<void>;
};

type PayPalEligibility = {
  isEligible: (
    method:
      string
  ) =>
    boolean;
};

type PayPalSdkInstance = {
  findEligibleMethods: (
    options?: {
      currencyCode?:
        string;
    }
  ) =>
    Promise<PayPalEligibility>;

  createPayPalOneTimePaymentSession: (
    options: {
      onApprove: (
        data:
          PayPalApproveData
      ) =>
        Promise<void>;

      onCancel:
        () =>
          void;

      onError: (
        error:
          unknown
      ) =>
        void;
    }
  ) =>
    Promise<PayPalSession>;
};

type PayPalWindow =
  Window & {
    paypal?: {
      createInstance: (
        options: {
          clientId:
            string;

          components:
            string[];

          pageType?:
            string;
        }
      ) =>
        Promise<PayPalSdkInstance>;
    };
  };

/* =========================================================
   SDK
========================================================= */

const PAYPAL_SCRIPT_ID =
  "pokapok-paypal-v6";

const PAYPAL_SCRIPT_URL =
  "https://www.sandbox.paypal.com/web-sdk/v6/core";

function loadPayPalSdk() {
  return new Promise<void>(
    (
      resolve,
      reject
    ) => {
      const paypalWindow =
        window as
          PayPalWindow;

      if (
        paypalWindow.paypal
      ) {
        resolve();
        return;
      }

      const existing =
        document.getElementById(
          PAYPAL_SCRIPT_ID
        ) as
          | HTMLScriptElement
          | null;

      if (
        existing
      ) {
        if (
          paypalWindow.paypal
        ) {
          resolve();
          return;
        }

        existing.addEventListener(
          "load",
          () => {
            const loadedWindow =
              window as
                PayPalWindow;

            if (
              loadedWindow.paypal
            ) {
              resolve();
            } else {
              reject(
                new Error(
                  "PAYPAL_SDK_NOT_AVAILABLE"
                )
              );
            }
          },
          {
            once:
              true,
          }
        );

        existing.addEventListener(
          "error",
          () => {
            reject(
              new Error(
                "PAYPAL_SDK_LOAD_FAILED"
              )
            );
          },
          {
            once:
              true,
          }
        );

        return;
      }

      const script =
        document.createElement(
          "script"
        );

      script.id =
        PAYPAL_SCRIPT_ID;

      script.src =
        PAYPAL_SCRIPT_URL;

      script.async =
        true;

      script.onload =
        () => {
          const loadedWindow =
            window as
              PayPalWindow;

          if (
            loadedWindow.paypal
          ) {
            resolve();
          } else {
            reject(
              new Error(
                "PAYPAL_SDK_NOT_AVAILABLE"
              )
            );
          }
        };

      script.onerror =
        () => {
          reject(
            new Error(
              "PAYPAL_SDK_LOAD_FAILED"
            )
          );
        };

      document.head.appendChild(
        script
      );
    }
  );
}

/* =========================================================
   ERROR
========================================================= */

function normalizeError(
  error:
    unknown,

  fallback:
    string
) {
  if (
    error instanceof
      Error
  ) {
    return error;
  }

  if (
    typeof error ===
      "string"
  ) {
    return new Error(
      error
    );
  }

  return new Error(
    fallback
  );
}

/* =========================================================
   COMPONENT
========================================================= */

export default function PayPalCheckout(
  {
    items,

    customerName,
    customerEmail,
    customerWhatsapp,

    country,
    stateRegion,
    city,
    street,
    houseNumber,
    addressLine2,
    postalCode,

    notes,
    language,
    displayCurrency,

    disabled = false,

    onBeforeStart,
    onSuccess,
    onCancel,
    onError,
  }: Props
) {
  const containerRef =
    useRef<
      View | null
    >(
      null
    );

  const sessionRef =
    useRef<
      PayPalSession | null
    >(
      null
    );

  /*
   * Stores the PayPal order created immediately before the
   * PayPal checkout window opens.
   *
   * This gives us the server-calculated order / pricing
   * context if we need it after approval.
   */
  const createdOrderRef =
    useRef<{
      orderId:
        string;

      orderNumber:
        string;

      paypalOrderId:
        string;
    } | null>(
      null
    );

  const [
    ready,
    setReady,
  ] =
    useState(
      false
    );

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState<
      string | null
    >(
      null
    );

  /* =======================================================
     INITIALIZE PAYPAL
  ======================================================= */

  useEffect(
    () => {
      let active =
        true;

      let button:
        HTMLElement | null =
          null;

      let clickHandler:
        (() => void)
        | null =
          null;

      async function setup() {
        try {
          setReady(
            false
          );

          setErrorMessage(
            null
          );

          createdOrderRef.current =
            null;

          const clientId =
            process.env
              .EXPO_PUBLIC_PAYPAL_CLIENT_ID
              ?.trim();

          if (
            !clientId
          ) {
            throw new Error(
              "EXPO_PUBLIC_PAYPAL_CLIENT_ID_MISSING"
            );
          }

          console.log(
            "PayPal: loading SDK..."
          );

          await loadPayPalSdk();

          if (
            !active
          ) {
            return;
          }

          const paypalWindow =
            window as
              PayPalWindow;

          if (
            !paypalWindow.paypal
          ) {
            throw new Error(
              "PAYPAL_SDK_NOT_AVAILABLE"
            );
          }

          console.log(
            "PayPal: creating SDK instance..."
          );

          const sdk =
            await paypalWindow
              .paypal
              .createInstance({
                clientId,

                components: [
                  "paypal-payments",
                ],

                pageType:
                  "checkout",
              });

          if (
            !active
          ) {
            return;
          }

          console.log(
            "PayPal: SDK instance created."
          );

          const eligibility =
            await sdk
              .findEligibleMethods({
                currencyCode:
                  "EUR",
              });

          if (
            !active
          ) {
            return;
          }

          const eligible =
            eligibility
              .isEligible(
                "paypal"
              );

          console.log(
            "PayPal eligibility:",
            eligible
          );

          if (
            !eligible
          ) {
            throw new Error(
              "PAYPAL_NOT_ELIGIBLE"
            );
          }

          /* =================================================
             PAYPAL SESSION
          ================================================= */

          const session =
            await sdk
              .createPayPalOneTimePaymentSession({
                /* ===========================================
                   APPROVED

                   The PayPal order was already created in
                   orderPromise below.

                   We only CAPTURE it here.
                =========================================== */

                onApprove:
                  async ({
                    orderId,
                  }) => {
                    try {
                      console.log(
                        "PayPal approved:",
                        orderId
                      );

                      if (
                        !orderId
                      ) {
                        throw new Error(
                          "PAYPAL_ORDER_ID_REQUIRED"
                        );
                      }

                      const result =
                        await capturePayPalOrder(
                          orderId
                        );

                      console.log(
                        "PayPal capture result:",
                        result
                      );

                      const captureId =
                        result
                          .capture
                          ?.id;

                      if (
                        !captureId
                      ) {
                        throw new Error(
                          "PAYPAL_CAPTURE_ID_MISSING"
                        );
                      }

                      const amount =
                        result
                          .capture
                          ?.amount ??
                        result
                          .pricing
                          ?.total_amount ??
                        null;

                      const currency =
                        result
                          .capture
                          ?.currency ??
                        result
                          .pricing
                          ?.currency ??
                        null;

                      const subtotal =
                        result
                          .pricing
                          ?.subtotal_amount ??
                        result
                          .pricing
                          ?.item_subtotal ??
                        null;

                      const shipping =
                        result
                          .pricing
                          ?.shipping_amount ??
                        null;

                      const total =
                        result
                          .pricing
                          ?.total_amount ??
                        result
                          .capture
                          ?.amount ??
                        null;

                      const resultDisplayCurrency =
                        result
                          .pricing
                          ?.display_currency ??
                        null;

                      const displayTotal =
                        result
                          .pricing
                          ?.display_total_amount ??
                        null;

                      const exchangeRate =
                        result
                          .pricing
                          ?.exchange_rate ??
                        null;

                      /*
                       * Prefer the values returned by the
                       * capture function. Fall back to the
                       * order created before PayPal opened.
                       */
                      const orderIdResult =
                        result
                          .order_id ??
                        createdOrderRef
                          .current
                          ?.orderId ??
                        null;

                      const orderNumberResult =
                        result
                          .order_number ??
                        createdOrderRef
                          .current
                          ?.orderNumber ??
                        null;

                      onSuccess({
                        paypalOrderId:
                          result
                            .paypal_order_id ??
                          orderId,

                        captureId,

                        amount,

                        currency,

                        orderId:
                          orderIdResult,

                        orderNumber:
                          orderNumberResult,

                        paymentStatus:
                          result
                            .payment_status ??
                          null,

                        orderStatus:
                          result
                            .order_status ??
                          null,

                        emailSent:
                          Boolean(
                            result
                              .email_sent
                          ),

                        warning:
                          result
                            .warning ??
                          null,

                        subtotal,

                        shipping,

                        total,

                        displayCurrency:
                          resultDisplayCurrency,

                        displayTotal,

                        exchangeRate,
                      });
                    } catch (
                      error
                    ) {
                      const normalized =
                        normalizeError(
                          error,
                          "PAYPAL_CAPTURE_FAILED"
                        );

                      console.error(
                        "PayPal capture error:",
                        normalized
                      );

                      setErrorMessage(
                        normalized
                          .message
                      );

                      onError?.(
                        normalized
                      );
                    }
                  },

                /* ===========================================
                   CANCEL
                =========================================== */

                onCancel:
                  () => {
                    console.log(
                      "PayPal cancelled"
                    );

                    onCancel?.();
                  },

                /* ===========================================
                   SDK ERROR
                =========================================== */

                onError:
                  (
                    error
                  ) => {
                    const normalized =
                      normalizeError(
                        error,
                        "PAYPAL_CHECKOUT_FAILED"
                      );

                    console.error(
                      "PayPal SDK checkout error:",
                      normalized
                    );

                    setErrorMessage(
                      normalized
                        .message
                    );

                    onError?.(
                      normalized
                    );
                  },
              });

          if (
            !active
          ) {
            return;
          }

          sessionRef.current =
            session;

          /* =================================================
             BUTTON CONTAINER
          ================================================= */

          const container =
            containerRef
              .current as
                unknown as
                HTMLElement | null;

          if (
            !container
          ) {
            throw new Error(
              "PAYPAL_CONTAINER_MISSING"
            );
          }

          container.innerHTML =
            "";

          button =
            document.createElement(
              "paypal-button"
            );

          button.setAttribute(
            "type",
            "pay"
          );

          button.style.width =
            "100%";

          /* =================================================
             BUTTON CLICK
          ================================================= */

          clickHandler =
            () => {
              if (
                disabled
              ) {
                return;
              }

              if (
                !sessionRef
                  .current
              ) {
                const error =
                  new Error(
                    "PAYPAL_SESSION_NOT_READY"
                  );

                setErrorMessage(
                  error
                    .message
                );

                onError?.(
                  error
                );

                return;
              }

              /*
               * PayPal SDK expects a promise that resolves
               * with the PayPal order ID.
               */
              const orderPromise =
                (async () => {
                  /* =========================================
                     PAGE VALIDATION
                  ========================================= */

                  if (
                    onBeforeStart
                  ) {
                    const allowed =
                      await onBeforeStart();

                    if (
                      !allowed
                    ) {
                      throw new Error(
                        "PAYPAL_VALIDATION_FAILED"
                      );
                    }
                  }

                  /* =========================================
                     CUSTOMER
                  ========================================= */

                  const cleanCustomerName =
                    customerName
                      .trim();

                  const cleanCustomerEmail =
                    customerEmail
                      ?.trim()
                      .toLowerCase() ??
                    "";

                  const cleanCustomerWhatsapp =
                    customerWhatsapp
                      .trim();

                  const cleanCountry =
                    country
                      .trim();

                  const cleanStateRegion =
                    stateRegion
                      .trim();

                  const cleanCity =
                    city
                      ?.trim() ??
                    "";

                  const cleanStreet =
                    street
                      ?.trim() ??
                    "";

                  const cleanHouseNumber =
                    houseNumber
                      ?.trim() ??
                    "";

                  const cleanAddressLine2 =
                    addressLine2
                      ?.trim() ??
                    "";

                  const cleanPostalCode =
                    postalCode
                      ?.trim() ??
                    "";

                  const cleanNotes =
                    notes
                      ?.trim() ??
                    "";

                  if (
                    !cleanCustomerName
                  ) {
                    throw new Error(
                      "CUSTOMER_NAME_REQUIRED"
                    );
                  }

                  if (
                    !cleanCustomerWhatsapp
                  ) {
                    throw new Error(
                      "CUSTOMER_WHATSAPP_REQUIRED"
                    );
                  }

                  if (
                    !cleanCountry
                  ) {
                    throw new Error(
                      "COUNTRY_REQUIRED"
                    );
                  }

                  if (
                    !cleanStateRegion
                  ) {
                    throw new Error(
                      "STATE_REGION_REQUIRED"
                    );
                  }

                  /* =========================================
                     ITEMS
                  ========================================= */

                  if (
                    !Array.isArray(
                      items
                    ) ||
                    items.length ===
                      0
                  ) {
                    throw new Error(
                      "ITEMS_REQUIRED"
                    );
                  }

                  console.log(
                    "PayPal: creating POKAPOK + PayPal order...",
                    {
                      itemCount:
                        items.length,
                    }
                  );

                  /* =========================================
                     CREATE SERVER ORDER

                     Server calculates:
                     - all item prices
                     - quantities
                     - battery upgrades
                     - subtotal
                     - shipping
                     - total
                     - CVE/EUR display values
                     - exchange rate

                     Browser does NOT supply those values.
                  ========================================= */

                  const created =
                    await createPayPalOrder({
                      items,

                      customerName:
                        cleanCustomerName,

                      customerEmail:
                        cleanCustomerEmail ||
                        null,

                      customerWhatsapp:
                        cleanCustomerWhatsapp,

                      country:
                        cleanCountry,

                      stateRegion:
                        cleanStateRegion,

                      city:
                        cleanCity ||
                        null,

                      street:
                        cleanStreet ||
                        null,

                      houseNumber:
                        cleanHouseNumber ||
                        null,

                      addressLine2:
                        cleanAddressLine2 ||
                        null,

                      postalCode:
                        cleanPostalCode ||
                        null,

                      notes:
                        cleanNotes ||
                        null,

                      language,

                      displayCurrency,
                    });

                  console.log(
                    "POKAPOK PayPal order created:",
                    {
                      orderId:
                        created
                          .order_id,

                      orderNumber:
                        created
                          .order_number,

                      paypalOrderId:
                        created
                          .paypal_order_id,

                      itemCount:
                        created
                          .pricing
                          ?.item_count,

                      settlementTotal:
                        created
                          .pricing
                          ?.total_amount,

                      settlementCurrency:
                        created
                          .pricing
                          ?.currency,

                      displayTotal:
                        created
                          .pricing
                          ?.display_total_amount,

                      displayCurrency:
                        created
                          .pricing
                          ?.display_currency,

                      exchangeRate:
                        created
                          .pricing
                          ?.exchange_rate,
                    }
                  );

                  /*
                   * Keep a small reference for use after the
                   * PayPal approval/capture.
                   */
                  createdOrderRef.current =
                    {
                      orderId:
                        created
                          .order_id,

                      orderNumber:
                        created
                          .order_number,

                      paypalOrderId:
                        created
                          .paypal_order_id,
                    };

                  return {
                    orderId:
                      created
                        .paypal_order_id,
                  };
                })();

              sessionRef
                .current
                .start(
                  {
                    presentationMode:
                      "auto",
                  },

                  orderPromise
                )
                .catch(
                  (
                    error
                  ) => {
                    const normalized =
                      normalizeError(
                        error,
                        "PAYPAL_START_FAILED"
                      );

                    /*
                     * Validation errors are already shown by
                     * checkout.tsx, so don't show an extra
                     * PayPal error box.
                     */
                    if (
                      normalized
                        .message ===
                      "PAYPAL_VALIDATION_FAILED"
                    ) {
                      return;
                    }

                    console.error(
                      "PayPal start error:",
                      normalized
                    );

                    setErrorMessage(
                      normalized
                        .message
                    );

                    onError?.(
                      normalized
                    );
                  }
                );
            };

          button.addEventListener(
            "click",
            clickHandler
          );

          container.appendChild(
            button
          );

          if (
            active
          ) {
            setReady(
              true
            );

            setErrorMessage(
              null
            );

            console.log(
              "PayPal checkout ready."
            );
          }
        } catch (
          error
        ) {
          const normalized =
            normalizeError(
              error,
              "PAYPAL_SETUP_FAILED"
            );

          console.error(
            "PayPal setup error:",
            normalized
          );

          if (
            active
          ) {
            setReady(
              false
            );

            setErrorMessage(
              normalized
                .message
            );
          }

          onError?.(
            normalized
          );
        }
      }

      void setup();

      return () => {
        active =
          false;

        if (
          button &&
          clickHandler
        ) {
          button.removeEventListener(
            "click",
            clickHandler
          );
        }

        if (
          button
            ?.parentNode
        ) {
          button
            .parentNode
            .removeChild(
              button
            );
        }

        sessionRef.current =
          null;

        createdOrderRef.current =
          null;
      };
    },

    [
      items,

      customerName,
      customerEmail,
      customerWhatsapp,

      country,
      stateRegion,
      city,
      street,
      houseNumber,
      addressLine2,
      postalCode,

      notes,
      language,
      displayCurrency,

      disabled,
      onBeforeStart,
      onSuccess,
      onCancel,
      onError,
    ]
  );

  return (
    <View
      style={
        styles.wrapper
      }
    >
      {!ready &&
      !errorMessage ? (
        <Text
          style={
            styles.status
          }
        >
          {language ===
          "pt"
            ? "A carregar PayPal..."
            : "Loading PayPal..."}
        </Text>
      ) : null}

      <View
        ref={
          containerRef
        }
        style={[
          styles.container,

          disabled &&
            styles.disabled,
        ]}
      />

      {errorMessage ? (
        <View
          style={
            styles.errorBox
          }
        >
          <Text
            style={
              styles.error
            }
          >
            {language ===
            "pt"
              ? "Não foi possível carregar ou concluir o pagamento PayPal."
              : "We could not load or complete the PayPal payment."}
          </Text>

          <Text
            style={
              styles.errorCode
            }
          >
            {errorMessage}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

/* =========================================================
   STYLES
========================================================= */

const styles =
  StyleSheet.create({
    wrapper: {
      width:
        "100%",
    },

    container: {
      width:
        "100%",

      minHeight:
        48,
    },

    disabled: {
      opacity:
        0.5,
    },

    status: {
      color:
        "#667085",

      fontSize:
        12,

      marginBottom:
        8,
    },

    errorBox: {
      marginTop:
        8,
    },

    error: {
      color:
        "#9B1C1C",

      fontSize:
        12,

      fontWeight:
        "700",
    },

    errorCode: {
      color:
        "#667085",

      fontSize:
        10,

      marginTop:
        4,
    },
  });