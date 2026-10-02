import {
    StyleSheet,
    Text,
    View,
} from "react-native";

import type {
    PayPalBatteryGrade,
    PayPalCondition,
    PayPalDisplayCurrency,
    PayPalLanguage,
    PayPalRefurbishedGrade,
} from "../../services/paypalService";

type Props = {
  /* PRODUCT */

  productId:
    string;

  variantId?:
    | string
    | null;

  condition:
    PayPalCondition;

  quantity:
    number;

  /* REFURBISHED CONFIG */

  refurbishedGrade?:
    | PayPalRefurbishedGrade
    | null;

  batteryGrade?:
    | PayPalBatteryGrade
    | null;

  /* CUSTOMER */

  customerName:
    string;

  customerEmail?:
    string;

  customerWhatsapp:
    string;

  /* DELIVERY */

  country:
    string;

  stateRegion:
    string;

  city?:
    string;

  street?:
    string;

  houseNumber?:
    string;

  addressLine2?:
    string;

  postalCode?:
    string;

  /* ORDER */

  notes?:
    string;

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

export default function PayPalCheckout(
  _props:
    Props
) {
  return (
    <View
      style={
        styles.box
      }
    >
      <Text
        style={
          styles.text
        }
      >
        PayPal está disponível através da versão web do checkout.
      </Text>
    </View>
  );
}

const styles =
  StyleSheet.create({
    box: {
      padding:
        12,

      borderRadius:
        14,

      backgroundColor:
        "#F5F5F5",
    },

    text: {
      fontSize:
        12,

      color:
        "#667085",
    },
  });