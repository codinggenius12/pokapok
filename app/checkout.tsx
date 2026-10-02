import { Link, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";

import PayPalCheckout from "../src/components/payment/PayPalCheckout";
import { useCart } from "../src/context/CartContext";
import { useCurrency } from "../src/context/CurrencyStore";
import { useLanguage } from "../src/context/LanguageContext";
import { phones } from "../src/data/phones";
import {
  createOrder,
  formatOrderPrice,
  type CreateOrderResult,
} from "../src/services/orderService";
import {
  calculateMonthlyPrice,
  calculateUnitPrice,
} from "../src/services/pricingService";
import {
  getColorImage,
  getPublicProductById,
  getPublicProductBySlug,
  getPublicProductVariants,
} from "../src/services/productService";
import { colors } from "../src/theme/colors";
import type { PaymentMode, Phone } from "../src/types/phone";
import {
  localizePhoneColor,
  localizePhoneCondition,
} from "../src/utils/localizePhone";

/* =========================================================
   TYPES
========================================================= */

type CheckoutPaymentMethod =
  | "card"
  | "paypal"
  | "bank_transfer"
  | "upay";

type PayPalCheckoutSuccessResult = {
  paypalOrderId: string;

  captureId: string;

  amount: number | null;

  currency: string | null;

  orderId: string | null;

  orderNumber: string | null;

  paymentStatus: string | null;

  orderStatus: string | null;

  emailSent: boolean;

  warning: string | null;

  subtotal: number | null;

  shipping: number | null;

  total: number | null;

  displayCurrency: string | null;

  displayTotal: number | null;

  exchangeRate: number | null;
};

type ShippingCountry = {
  value: string;
  pt: string;
  en: string;
};

/* =========================================================
   SHIPPING DESTINATIONS
========================================================= */

const SHIPPING_COUNTRIES: ShippingCountry[] = [
  {
    value: "Cabo Verde",
    pt: "Cabo Verde",
    en: "Cape Verde",
  },
  {
    value: "Portugal",
    pt: "Portugal",
    en: "Portugal",
  },
  {
    value: "Netherlands",
    pt: "Países Baixos",
    en: "Netherlands",
  },
  {
    value: "Belgium",
    pt: "Bélgica",
    en: "Belgium",
  },
  {
    value: "Germany",
    pt: "Alemanha",
    en: "Germany",
  },
  {
    value: "France",
    pt: "França",
    en: "France",
  },
  {
    value: "Spain",
    pt: "Espanha",
    en: "Spain",
  },
  {
    value: "Italy",
    pt: "Itália",
    en: "Italy",
  },
  {
    value: "Luxembourg",
    pt: "Luxemburgo",
    en: "Luxembourg",
  },
  {
    value: "Austria",
    pt: "Áustria",
    en: "Austria",
  },
  {
    value: "Denmark",
    pt: "Dinamarca",
    en: "Denmark",
  },
  {
    value: "Sweden",
    pt: "Suécia",
    en: "Sweden",
  },
  {
    value: "Finland",
    pt: "Finlândia",
    en: "Finland",
  },
  {
    value: "Ireland",
    pt: "Irlanda",
    en: "Ireland",
  },
  {
    value: "Greece",
    pt: "Grécia",
    en: "Greece",
  },
  {
    value: "Poland",
    pt: "Polónia",
    en: "Poland",
  },
  {
    value: "Czech Republic",
    pt: "Chéquia",
    en: "Czech Republic",
  },
  {
    value: "Slovakia",
    pt: "Eslováquia",
    en: "Slovakia",
  },
  {
    value: "Slovenia",
    pt: "Eslovénia",
    en: "Slovenia",
  },
  {
    value: "Croatia",
    pt: "Croácia",
    en: "Croatia",
  },
  {
    value: "Hungary",
    pt: "Hungria",
    en: "Hungary",
  },
  {
    value: "Romania",
    pt: "Roménia",
    en: "Romania",
  },
  {
    value: "Bulgaria",
    pt: "Bulgária",
    en: "Bulgaria",
  },
  {
    value: "Estonia",
    pt: "Estónia",
    en: "Estonia",
  },
  {
    value: "Latvia",
    pt: "Letónia",
    en: "Latvia",
  },
  {
    value: "Lithuania",
    pt: "Lituânia",
    en: "Lithuania",
  },
  {
    value: "Cyprus",
    pt: "Chipre",
    en: "Cyprus",
  },
  {
    value: "Malta",
    pt: "Malta",
    en: "Malta",
  },
];

const CABO_VERDE_ISLANDS = [
  "Santiago",
  "São Vicente",
  "Santo Antão",
  "São Nicolau",
  "Sal",
  "Boa Vista",
  "Maio",
  "Fogo",
  "Brava",
];

/* =========================================================
   HELPERS
========================================================= */

function getParamValue(
  value: string | string[] | undefined
) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function getValidPaymentMode(
  value: string | string[] | undefined
): PaymentMode {
  const payment = getParamValue(value);

  if (payment === "buy") {
    return "buy";
  }

  if (payment === "installments") {
    return "installments";
  }

  if (payment === "lease") {
    return "lease";
  }

  return "buy";
}

function findIndexByName<T>(
  items: T[],
  getName: (item: T) => string,
  value: string | undefined
) {
  if (!value) {
    return 0;
  }

  const index = items.findIndex(
    (item) =>
      getName(item).trim().toLowerCase() ===
      value.trim().toLowerCase()
  );

  return index >= 0 ? index : 0;
}

function getShippingPrice(
  country: string
) {
  if (!country) {
    return 0;
  }

  return country === "Cabo Verde"
    ? 21
    : 12.75;
}

/* =========================================================
   SCREEN
========================================================= */

export default function CheckoutScreen() {
  const params = useLocalSearchParams<{
    phone?: string | string[];
    productId?: string | string[];
    variant?: string | string[];
    condition?: string | string[];
    color?: string | string[];
    storage?: string | string[];
    payment?: string | string[];
    insurance?: string | string[];
  }>();

  const {
    items,
    clearCart,
    totalBuyNow,
    totalMonthly,
  } = useCart();

  const { language } = useLanguage();

  const {
    currency,
    formatPrice,
  } = useCurrency(language);

  const { width } =
    useWindowDimensions();

  const isMobile =
    width < 720;

  /* =======================================================
     TRANSLATIONS
  ======================================================= */

  const text =
    language === "pt"
      ? {
          backCatalog:
            "Voltar ao catálogo",

          backHome:
            "Voltar ao início",

          backCart:
            "Voltar ao carrinho",

          noProductSelected:
            "NENHUM PRODUTO SELECIONADO",

          checkoutEmpty:
            "A sua finalização de compra está vazia.",

          checkoutEmptyDescription:
            "Adicione primeiro um equipamento ao carrinho e depois volte à finalização da compra.",

          browsePhones:
            "Ver equipamentos",

          requestReceived:
            "PEDIDO RECEBIDO",

          requestReceivedTitle:
            "Recebemos o seu pedido.",

          requestReceivedDescription:
            "A sua encomenda foi criada. Efetue a transferência usando os dados abaixo e a referência exata da encomenda.",

          paypalPaymentConfirmed:
            "PAGAMENTO CONFIRMADO",

          paypalPaymentConfirmedTitle:
            "Pagamento recebido com sucesso.",

          paypalPaymentConfirmedDescription:
            "O pagamento da sua encomenda foi confirmado através do PayPal. A sua encomenda seguirá agora para processamento.",

          paid:
            "Pago",

          processing:
            "Em processamento",

          paymentMethod:
            "Método de pagamento",

          paypalReference:
            "Referência PayPal",

          totalPaid:
            "Total pago",

          paypalEmailSent:
            "Enviámos também a confirmação da encomenda para o seu email.",

          paypalEmailNotSent:
            "O pagamento foi confirmado, mas não foi possível enviar o email de confirmação.",

          paypalEmailNotProvided:
            "O pagamento foi confirmado. Não indicou um email para receber a confirmação.",

          browseMorePhones:
            "Ver mais equipamentos",

          checkout:
            "FINALIZAR COMPRA",

          completeRequest:
            "Conclua a sua encomenda.",

          heroDescription:
            "Confirme o equipamento, os seus dados e escolha como pretende efetuar o pagamento.",

          selectedPhone:
            "Equipamento selecionado",

          color:
            "Cor",

          storage:
            "Armazenamento",

          purchaseOption:
            "Modalidade",

          buyNow:
            "Comprar",

          installments:
            "Prestações",

          lease:
            "Leasing",

          term:
            "Prazo",

          months:
            "meses",

          addProtectionInsurance:
            "Adicionar seguro de proteção",

          insuranceDescription:
            "Roubo, danos e assistência técnica",

          checkingOutOne:
            "Está a finalizar a compra de 1 artigo do carrinho.",

          checkingOutMultiple: (
            count: number
          ) =>
            `Está a finalizar a compra de ${count} artigos do carrinho.`,

          cartLocked:
            "As opções dos produtos estão definidas pelo seu carrinho. Volte ao carrinho para remover ou alterar artigos.",

          yourDetails:
            "Dados de contacto",

          deliveryAddress:
            "Morada de entrega",

          deliveryAddressDescription:
            "Enviamos apenas para Cabo Verde e Europa. Selecione o país e indique a ilha / estado / região.",

          fullName:
            "Nome completo *",

          whatsappNumber:
            "Número de WhatsApp *",

          country:
            "Selecionar país *",

          stateRegion:
            "Ilha / Estado / Região *",

          city:
            "Cidade / Localidade (opcional)",

          street:
            "Rua / Avenida (opcional)",

          houseNumber:
            "Número da porta (opcional)",

          addressLine2:
            "Apartamento, andar, zona ou referência (opcional)",

          postalCode:
            "Código postal (opcional)",

          emailOptional:
            "Email (opcional)",

          emailRequired:
            "Introduza um endereço de email válido ou deixe o campo vazio.",

          notesOptional:
            "Observações da encomenda (opcional)",

          requestSummary:
            "Resumo da encomenda",

          shipping:
            "Envio",

          shippingPending:
            "Selecione o país para calcular o envio.",

          subtotal:
            "Subtotal",

          totalWithShipping:
            "Total com envio",

          perMonth:
            "/mês",

          oneTimeTotal:
            "Total a pagar",

          monthlyTotal:
            "Total mensal",

          oneTimeBuyRequest:
            "Compra",

          leaseRequest:
            "Leasing",

          monthlyPayments: (
            count: number
          ) =>
            `${count} prestações mensais`,

          paymentTitle:
            "Como gostaria de pagar?",

          paymentTitleWithAmount: (
            amount: string
          ) =>
            `Como gostaria de pagar ${amount}?`,

          paymentDescription:
            "Selecione o seu método de pagamento preferido.",

          card:
            "Visa / Mastercard",

          cardDescription:
            "Pagamento com cartão de débito ou crédito",

          paypal:
            "PayPal",

          paypalDescription:
            "Pague através da sua conta PayPal",

          bankTransfer:
            "Transferência bancária",

          bankTransferDescription:
            "Receba os dados bancários e a referência da encomenda",

          upay:
            "UPAY",

          comingSoon:
            "Em breve",

          upayDescription:
            "Novo método de pagamento POKAPOK",

          selected:
            "Selecionado",

          chooseProductFirst:
            "Selecione primeiro um produto.",

          fillRequiredFields:
            "Preencha o nome completo, número de WhatsApp, país e ilha / estado / região.",

          choosePaymentMethod:
            "Selecione um método de pagamento.",

          submitOrder:
            "Confirmar encomenda",

          securePayment:
            "A sua encomenda só será processada depois da confirmação do método de pagamento.",

          quantity:
            "Quantidade",

          creatingOrder:
            "A criar encomenda...",

          orderFailed:
            "Não foi possível criar a encomenda. Tente novamente.",

          bankTransferOnly:
            "Este método de pagamento ainda não está disponível. Selecione transferência bancária.",

          singleItemOnly:
            "Por enquanto, a transferência bancária suporta uma encomenda de cada vez.",

          purchaseOnly:
            "A transferência bancária está atualmente disponível apenas para compras diretas.",

          missingDatabaseProduct:
            "Não foi possível identificar este produto na base de dados. Volte ao produto e adicione-o novamente ao carrinho.",

          missingRefurbishedConfiguration:
            "Não foi possível identificar a condição estética ou a opção de bateria deste equipamento recondicionado. Volte ao produto e adicione-o novamente ao carrinho.",

          orderNumber:
            "Número da encomenda",

          amountToTransfer:
            "Montante a transferir",

          paymentReference:
            "Referência de pagamento",

          paymentReferenceHelp:
            "Utilize exatamente esta referência na descrição da transferência.",

          bankInstructions:
            "Dados para transferência",

          bankInstructionsDescription:
            "Efetue a transferência com os dados abaixo. A encomenda fica a aguardar pagamento até confirmarmos a entrada do valor.",

          accountHolder:
            "Titular da conta",

          bank:
            "Banco",

          bankCountry:
            "País do banco",

          awaitingPayment:
            "A aguardar pagamento",

          emailSent:
            "Enviámos também estas instruções para o seu email.",

          emailNotSent:
            "A encomenda foi criada, mas não foi possível enviar o email. Guarde os dados de pagamento apresentados abaixo.",

          emailNotProvided:
            "Não indicou um email. Guarde os dados de pagamento apresentados abaixo.",

          displayEquivalent:
            "Equivalente apresentado",

          exchangeRate:
            "Taxa de conversão",

          transferCurrency:
            "Moeda da transferência",

          paymentCurrencyNotice:
            "Pode visualizar os preços em CVE ou EUR. As transferências bancárias desta versão do checkout são liquidadas em EUR; o servidor calcula o valor final com segurança.",
        }
      : {
          backCatalog:
            "Back to catalog",

          backHome:
            "Back home",

          backCart:
            "Back to cart",

          noProductSelected:
            "NO PRODUCT SELECTED",

          checkoutEmpty:
            "Your checkout is empty.",

          checkoutEmptyDescription:
            "Add a phone to your cart first, then return to checkout.",

          browsePhones:
            "Browse phones",

          requestReceived:
            "REQUEST RECEIVED",

          requestReceivedTitle:
            "We received your order.",

          requestReceivedDescription:
            "Your order has been created. Complete the bank transfer using the details below and the exact order reference.",

          paypalPaymentConfirmed:
            "PAYMENT CONFIRMED",

          paypalPaymentConfirmedTitle:
            "Payment received successfully.",

          paypalPaymentConfirmedDescription:
            "Your PayPal payment has been confirmed. Your order will now move to processing.",

          paid:
            "Paid",

          processing:
            "Processing",

          paymentMethod:
            "Payment method",

          paypalReference:
            "PayPal reference",

          totalPaid:
            "Total paid",

          paypalEmailSent:
            "We also sent your order confirmation to your email address.",

          paypalEmailNotSent:
            "Your payment was confirmed, but we could not send the confirmation email.",

          paypalEmailNotProvided:
            "Your payment was confirmed. No email address was provided for the confirmation.",

          browseMorePhones:
            "Browse more phones",

          checkout:
            "CHECKOUT",

          completeRequest:
            "Complete your order.",

          heroDescription:
            "Confirm your device, your details and choose how you would like to pay.",

          selectedPhone:
            "Selected phone",

          color:
            "Color",

          storage:
            "Storage",

          purchaseOption:
            "Purchase option",

          buyNow:
            "Buy now",

          installments:
            "Installments",

          lease:
            "Lease",

          term:
            "Term",

          months:
            "months",

          addProtectionInsurance:
            "Add protection insurance",

          insuranceDescription:
            "Theft, damage and technical support",

          checkingOutOne:
            "Checking out 1 cart item.",

          checkingOutMultiple: (
            count: number
          ) =>
            `Checking out ${count} cart items.`,

          cartLocked:
            "Product choices are locked from your cart. Go back to cart to remove or change items.",

          yourDetails:
            "Contact details",

          deliveryAddress:
            "Delivery address",

          deliveryAddressDescription:
            "We currently ship only to Cape Verde and Europe. Select your country and island / state / region.",

          fullName:
            "Full name *",

          whatsappNumber:
            "WhatsApp number *",

          country:
            "Select country *",

          stateRegion:
            "Island / State / Region *",

          city:
            "City / Locality (optional)",

          street:
            "Street / Avenue (optional)",

          houseNumber:
            "House / door number (optional)",

          addressLine2:
            "Apartment, floor, area or landmark (optional)",

          postalCode:
            "Postal code (optional)",

          emailOptional:
            "Email (optional)",

          emailRequired:
            "Enter a valid email address or leave the field empty.",

          notesOptional:
            "Order notes (optional)",

          requestSummary:
            "Order summary",

          shipping:
            "Shipping",

          shippingPending:
            "Select your country to calculate shipping.",

          subtotal:
            "Subtotal",

          totalWithShipping:
            "Total including shipping",

          perMonth:
            "/month",

          oneTimeTotal:
            "Total to pay",

          monthlyTotal:
            "Monthly total",

          oneTimeBuyRequest:
            "Purchase",

          leaseRequest:
            "Lease",

          monthlyPayments: (
            count: number
          ) =>
            `${count} monthly payments`,

          paymentTitle:
            "How would you like to pay?",

          paymentTitleWithAmount: (
            amount: string
          ) =>
            `How would you like to pay ${amount}?`,

          paymentDescription:
            "Select your preferred payment method.",

          card:
            "Visa / Mastercard",

          cardDescription:
            "Pay using a debit or credit card",

          paypal:
            "PayPal",

          paypalDescription:
            "Pay through your PayPal account",

          bankTransfer:
            "Bank transfer",

          bankTransferDescription:
            "Receive the bank details and your order reference",

          upay:
            "UPAY",

          comingSoon:
            "Coming soon",

          upayDescription:
            "New POKAPOK payment method",

          selected:
            "Selected",

          chooseProductFirst:
            "Please choose a product first.",

          fillRequiredFields:
            "Please enter your full name, WhatsApp number, country and island / state / region.",

          choosePaymentMethod:
            "Please select a payment method.",

          submitOrder:
            "Confirm order",

          securePayment:
            "Your order will only be processed after the payment method has been confirmed.",

          quantity:
            "Quantity",

          creatingOrder:
            "Creating order...",

          orderFailed:
            "We could not create your order. Please try again.",

          bankTransferOnly:
            "This payment method is not available yet. Select bank transfer.",

          singleItemOnly:
            "Bank transfer currently supports one order item at a time.",

          purchaseOnly:
            "Bank transfer is currently available for direct purchases only.",

          missingDatabaseProduct:
            "We could not identify this product in the database. Return to the product and add it to your cart again.",

          missingRefurbishedConfiguration:
            "We could not identify the cosmetic condition or battery option for this refurbished device. Return to the product and add it to your cart again.",

          orderNumber:
            "Order number",

          amountToTransfer:
            "Amount to transfer",

          paymentReference:
            "Payment reference",

          paymentReferenceHelp:
            "Use this exact reference in the description of your bank transfer.",

          bankInstructions:
            "Bank transfer details",

          bankInstructionsDescription:
            "Make the transfer using the details below. Your order remains awaiting payment until we confirm receipt.",

          accountHolder:
            "Account holder",

          bank:
            "Bank",

          bankCountry:
            "Bank country",

          awaitingPayment:
            "Awaiting payment",

          emailSent:
            "We also sent these instructions to your email address.",

          emailNotSent:
            "Your order was created, but the email could not be sent. Save the payment details shown below.",

          emailNotProvided:
            "No email address was provided. Save the payment details shown below.",

          displayEquivalent:
            "Displayed equivalent",

          exchangeRate:
            "Exchange rate",

          transferCurrency:
            "Transfer currency",

          paymentCurrencyNotice:
            "You can view prices in CVE or EUR. Bank transfers in this checkout are settled in EUR; the server calculates the final amount securely.",
        };

  /* =======================================================
     PARAMETERS
  ======================================================= */

  const phoneSlug =
    getParamValue(params.phone);

  const productIdParam =
    getParamValue(params.productId);

  const variantIdParam =
    getParamValue(params.variant);

  const conditionParam =
    getParamValue(params.condition);

  const colorParam =
    getParamValue(params.color);

  const storageParam =
    getParamValue(params.storage);

  const initialPaymentMode =
    getValidPaymentMode(
      params.payment
    );

  const insuranceParam =
    getParamValue(
      params.insurance
    );

  const initialInsurance =
    insuranceParam === "1" ||
    insuranceParam === "true";

  /* =======================================================
     SELECTED CART ITEM
  ======================================================= */

  const selectedCartItem =
    useMemo(() => {
      if (items.length === 0) {
        return undefined;
      }

      if (!phoneSlug) {
        return items[0];
      }

      return (
        items.find(
          (item) =>
            item.phone.slug ===
            phoneSlug
        ) ?? items[0]
      );
    }, [
      items,
      phoneSlug,
    ]);

  /* =======================================================
     SELECTED PHONE
  ======================================================= */

  const selectedPhone:
    | Phone
    | undefined =
    useMemo(() => {
      if (
        selectedCartItem?.phone
      ) {
        return selectedCartItem.phone;
      }

      if (!phoneSlug) {
        return undefined;
      }

      return phones.find(
        (phone) =>
          phone.slug ===
          phoneSlug
      );
    }, [
      selectedCartItem,
      phoneSlug,
    ]);

  /* =======================================================
     STATE
  ======================================================= */

  const [
    colorIndex,
    setColorIndex,
  ] = useState(0);

  const [
    storageIndex,
    setStorageIndex,
  ] = useState(0);

  const [
    paymentMode,
    setPaymentMode,
  ] =
    useState<PaymentMode>(
      initialPaymentMode
    );

  const [
    months,
    setMonths,
  ] = useState(36);

  const [
    insurance,
    setInsurance,
  ] = useState(false);

  const [
    selectedPaymentMethod,
    setSelectedPaymentMethod,
  ] =
    useState<CheckoutPaymentMethod>(
      "bank_transfer"
    );

  const [
    countryDropdownOpen,
    setCountryDropdownOpen,
  ] = useState(false);

  const [
    islandDropdownOpen,
    setIslandDropdownOpen,
  ] = useState(false);

  const [
    customer,
    setCustomer,
  ] = useState({
    name: "",
    whatsapp: "",
    email: "",

    country: "",
    stateRegion: "",
    city: "",
    street: "",
    houseNumber: "",
    addressLine2: "",
    postalCode: "",

    notes: "",
  });

  const [
    submitted,
    setSubmitted,
  ] = useState(false);

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [
    submitError,
    setSubmitError,
  ] =
    useState<string | null>(
      null
    );

  const [
    createdOrder,
    setCreatedOrder,
  ] =
    useState<CreateOrderResult | null>(
      null
    );

  const [
    completedPayPalOrder,
    setCompletedPayPalOrder,
  ] =
    useState<PayPalCheckoutSuccessResult | null>(
      null
    );

  const [
    checkoutImageUrl,
    setCheckoutImageUrl,
  ] =
    useState<string | null>(
      null
    );

  /* =======================================================
     INITIAL SELECTION
  ======================================================= */

  useEffect(() => {
    if (!selectedPhone) {
      return;
    }

    const selectedColor =
      colorParam ??
      selectedCartItem?.colorName ??
      selectedPhone.colors[0]?.name;

    const selectedStorage =
      storageParam ??
      selectedCartItem?.storageLabel?.split(
        " · "
      )[0] ??
      selectedPhone.storage[0]?.label;

    setColorIndex(
      findIndexByName(
        selectedPhone.colors,
        (item) => item.name,
        selectedColor
      )
    );

    setStorageIndex(
      findIndexByName(
        selectedPhone.storage,
        (item) => item.label,
        selectedStorage
      )
    );

    setPaymentMode(
      selectedCartItem
        ?.paymentMode ??
        initialPaymentMode
    );

    setInsurance(
      selectedCartItem
        ?.insurance ??
        initialInsurance
    );
  }, [
    selectedPhone,
    selectedCartItem,
    colorParam,
    storageParam,
    initialPaymentMode,
    initialInsurance,
  ]);

  /* =======================================================
     CURRENT CONFIGURATION
  ======================================================= */

  const selectedColor =
    selectedPhone?.colors[
      colorIndex
    ] ??
    selectedPhone?.colors[0];

  const selectedStorage =
    selectedPhone?.storage[
      storageIndex
    ] ??
    selectedPhone?.storage[0];

  const selectedColorDisplayName =
    selectedColor
      ? localizePhoneColor(
          selectedColor.name,
          language
        )
      : "";

  /* =======================================================
     LIVE PRODUCT IMAGE
  ======================================================= */

  const checkoutProductId =
    selectedCartItem
      ?.productId ??
    productIdParam ??
    null;

  const checkoutProductSlug =
    phoneSlug ??
    selectedCartItem
      ?.phone.slug ??
    selectedPhone?.slug ??
    null;

  useEffect(() => {
    let active = true;

    async function loadCheckoutImage() {
      try {
        let liveProduct =
          checkoutProductId
            ? await getPublicProductById(
                checkoutProductId
              )
            : null;

        if (
          !liveProduct &&
          checkoutProductSlug
        ) {
          liveProduct =
            await getPublicProductBySlug(
              checkoutProductSlug
            );
        }

        if (
          !active ||
          !liveProduct
        ) {
          if (active) {
            setCheckoutImageUrl(
              null
            );
          }

          return;
        }

        const liveVariants =
          await getPublicProductVariants(
            liveProduct.id
          );

        if (!active) {
          return;
        }

        const wantedVariantId =
          selectedCartItem
            ?.variantId ??
          variantIdParam ??
          null;

        const wantedStorage =
          selectedStorage?.label
            .split(" · ")[0]
            .trim()
            .toLowerCase() ??
          "";

        const wantedColor =
          selectedCartItem
            ?.colorName ??
          selectedColor?.name ??
          "";

        const cleanWantedColor =
          wantedColor
            .trim()
            .toLowerCase();

        const exactVariant =
          wantedVariantId
            ? liveVariants.find(
                (variant) =>
                  variant.id ===
                  wantedVariantId
              )
            : null;

        const matchedVariant =
          exactVariant ??
          liveVariants.find(
            (variant) =>
              variant.storage
                .trim()
                .toLowerCase() ===
                wantedStorage &&
              variant.color
                .trim()
                .toLowerCase() ===
                cleanWantedColor
          ) ??
          null;

        const colorImage =
          wantedColor
            ? getColorImage(
                liveProduct,
                liveVariants,
                wantedColor
              )
            : null;

        const imageUrl =
          matchedVariant
            ?.image_url ??
          colorImage ??
          liveProduct.image_url ??
          null;

        setCheckoutImageUrl(
          imageUrl
        );
      } catch (error) {
        console.warn(
          "Could not load checkout image:",
          error
        );

        if (active) {
          setCheckoutImageUrl(
            null
          );
        }
      }
    }

    void loadCheckoutImage();

    return () => {
      active = false;
    };
  }, [
    checkoutProductId,
    checkoutProductSlug,
    selectedCartItem,
    variantIdParam,
    selectedStorage,
    selectedColor,
  ]);

  /* =======================================================
     CHECKOUT IMAGE
  ======================================================= */

  const checkoutImageSource =
    useMemo(() => {
      const localPhone =
        phones.find(
          (phone) =>
            phone.slug ===
            selectedPhone?.slug
        );

      const wantedColor =
        selectedCartItem
          ?.colorName ??
        selectedColor?.name ??
        "";

      const localColor =
        localPhone?.colors.find(
          (color) =>
            color.name
              .trim()
              .toLowerCase() ===
            wantedColor
              .trim()
              .toLowerCase()
        );

      if (checkoutImageUrl) {
        return {
          uri:
            checkoutImageUrl,
        };
      }

      return (
        selectedColor?.image ??
        localColor?.image ??
        localPhone?.colors[0]
          ?.image ??
        null
      );
    }, [
      checkoutImageUrl,
      selectedPhone,
      selectedCartItem,
      selectedColor,
    ]);

  /* =======================================================
     UNIT PRICE
  ======================================================= */

  const unitPrice =
    useMemo(() => {
      if (selectedCartItem) {
        return selectedCartItem.unitPrice;
      }

      if (
        !selectedPhone ||
        !selectedStorage
      ) {
        return 0;
      }

      return calculateUnitPrice(
        selectedPhone.price,
        selectedStorage.priceIncrease
      );
    }, [
      selectedCartItem,
      selectedPhone,
      selectedStorage,
    ]);

  /* =======================================================
     MONTHLY PRICE
  ======================================================= */

  const monthlyPrice =
    useMemo(() => {
      if (
        selectedCartItem &&
        selectedCartItem.paymentMode !==
          "buy"
      ) {
        return selectedCartItem.monthlyPrice;
      }

      if (!selectedPhone) {
        return 0;
      }

      return calculateMonthlyPrice({
        unitPrice,
        paymentMode,
        months,
        insurance,
        leaseFrom:
          selectedPhone.leaseFrom,
      });
    }, [
      selectedCartItem,
      selectedPhone,
      unitPrice,
      paymentMode,
      months,
      insurance,
    ]);

  const cartHasItems =
    items.length > 0;

  /* =======================================================
     DISPLAY TOTAL
  ======================================================= */

  const oneTimeDisplayTotal =
    cartHasItems
      ? totalBuyNow
      : paymentMode === "buy"
        ? unitPrice
        : 0;

  const monthlyDisplayTotal =
    cartHasItems
      ? totalMonthly
      : paymentMode !== "buy"
        ? monthlyPrice
        : 0;

  /* =======================================================
     SHIPPING
  ======================================================= */

  const shippingPrice =
    getShippingPrice(
      customer.country
    );

  const hasShippingDestination =
    Boolean(
      customer.country
    );

  const finalOneTimeDisplayTotal =
    oneTimeDisplayTotal +
    (
      oneTimeDisplayTotal > 0 &&
      hasShippingDestination
        ? shippingPrice
        : 0
    );

  const paymentQuestion =
    finalOneTimeDisplayTotal > 0
      ? text.paymentTitleWithAmount(
          formatPrice(
            finalOneTimeDisplayTotal
          )
        )
      : text.paymentTitle;

  /* =======================================================
     PAYPAL CONFIGURATION
  ======================================================= */

  const paypalProductId =
    selectedCartItem
      ?.productId ??
    productIdParam ??
    null;

  const paypalVariantId =
    selectedCartItem
      ?.variantId ??
    variantIdParam ??
    null;

  const paypalCondition:
    | "new"
    | "refurbished" =
    (
      selectedCartItem
        ?.phone.condition ??
      (
        conditionParam ===
          "refurbished"
          ? "refurbished"
          : conditionParam ===
              "new"
            ? "new"
            : selectedPhone
                ?.condition
      )
    ) ===
    "refurbished"
      ? "refurbished"
      : "new";

  const paypalQuantity =
    selectedCartItem
      ?.quantity ??
    1;

  /*
   * Refurbished selections are stored on the CartItem.
   *
   * They describe which option the customer selected.
   * The browser does NOT decide their authoritative price.
   */
  const paypalRefurbishedGrade =
    paypalCondition ===
      "refurbished"
      ? selectedCartItem
          ?.refurbishedGrade ??
        null
      : null;

  const paypalBatteryGrade =
    paypalCondition ===
      "refurbished"
      ? selectedCartItem
          ?.batteryGrade ??
        null
      : null;

  /* =======================================================
     COUNTRY DISPLAY
  ======================================================= */

  const selectedCountry =
    customer.country
      ? SHIPPING_COUNTRIES.find(
          (country) =>
            country.value ===
            customer.country
        )
      : null;

  const selectedCountryDisplay =
    selectedCountry
      ? language === "pt"
        ? selectedCountry.pt
        : selectedCountry.en
      : "";

  /* =======================================================
     CUSTOMER
  ======================================================= */

  function updateCustomer(
    key: keyof typeof customer,
    value: string
  ) {
    setCustomer(
      (current) => ({
        ...current,
        [key]: value,
      })
    );
  }

  /* =======================================================
     PAYMENT SELECTION
  ======================================================= */

  function selectPaymentMethod(
    method: CheckoutPaymentMethod
  ) {
    if (method === "upay") {
      return;
    }

    setSelectedPaymentMethod(
      method
    );

    setSubmitError(
      null
    );
  }

  /* =======================================================
     PAYPAL VALIDATION
  ======================================================= */

  function validateCustomerDetails() {
    if (
      !selectedPhone ||
      !selectedColor ||
      !selectedStorage
    ) {
      alert(
        text.chooseProductFirst
      );

      return false;
    }

    if (
      !customer.name.trim() ||
      !customer.whatsapp.trim() ||
      !customer.country.trim() ||
      !customer.stateRegion.trim()
    ) {
      alert(
        text.fillRequiredFields
      );

      return false;
    }

    const cleanEmail =
      customer.email
        .trim()
        .toLowerCase();

    if (
      cleanEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        cleanEmail
      )
    ) {
      alert(
        text.emailRequired
      );

      return false;
    }

    if (
      cartHasItems &&
      items.length !== 1
    ) {
      alert(
        text.singleItemOnly
      );

      return false;
    }

    const orderItem =
      cartHasItems
        ? items[0]
        : null;

    const currentPaymentMode =
      orderItem
        ?.paymentMode ??
      paymentMode;

    if (
      currentPaymentMode !==
      "buy"
    ) {
      alert(
        text.purchaseOnly
      );

      return false;
    }

    if (
      !paypalProductId
    ) {
      alert(
        text.missingDatabaseProduct
      );

      return false;
    }

    /*
     * Old cart items created before the refurbished-option
     * update do not contain these values.
     *
     * They must be re-added from the product page instead
     * of guessing a grade or battery choice.
     */
    if (
      paypalCondition ===
        "refurbished" &&
      (
        !paypalRefurbishedGrade ||
        !paypalBatteryGrade
      )
    ) {
      alert(
        text.missingRefurbishedConfiguration
      );

      return false;
    }

    return true;
  }

  /* =======================================================
     SUBMIT REQUEST
  ======================================================= */

  async function submitRequest() {
    if (
      !selectedPhone ||
      !selectedColor ||
      !selectedStorage
    ) {
      alert(
        text.chooseProductFirst
      );

      return;
    }

    if (
      !customer.name.trim() ||
      !customer.whatsapp.trim() ||
      !customer.country.trim() ||
      !customer.stateRegion.trim()
    ) {
      alert(
        text.fillRequiredFields
      );

      return;
    }

    const cleanEmail =
      customer.email
        .trim()
        .toLowerCase();

    if (
      cleanEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        cleanEmail
      )
    ) {
      alert(
        text.emailRequired
      );

      return;
    }

    if (
      selectedPaymentMethod !==
      "bank_transfer"
    ) {
      alert(
        text.bankTransferOnly
      );

      return;
    }

    if (
      cartHasItems &&
      items.length !== 1
    ) {
      alert(
        text.singleItemOnly
      );

      return;
    }

    const orderItem =
      cartHasItems
        ? items[0]
        : null;

    const currentPaymentMode =
      orderItem
        ?.paymentMode ??
      paymentMode;

    if (
      currentPaymentMode !==
      "buy"
    ) {
      alert(
        text.purchaseOnly
      );

      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      let productId =
        orderItem
          ?.productId ??
        productIdParam ??
        null;

      let variantId =
        orderItem
          ?.variantId ??
        variantIdParam ??
        null;

      if (
        phoneSlug &&
        (
          !productId ||
          !variantId
        )
      ) {
        const liveProduct =
          await getPublicProductBySlug(
            phoneSlug
          );

        if (liveProduct) {
          if (!productId) {
            productId =
              liveProduct.id;
          }

          if (!variantId) {
            const liveVariants =
              await getPublicProductVariants(
                liveProduct.id
              );

            const wantedStorage =
              selectedStorage.label
                .trim()
                .toLowerCase();

            const wantedColor =
              selectedColor.name
                .trim()
                .toLowerCase();

            const matchedVariant =
              liveVariants.find(
                (variant) =>
                  variant.storage
                    .trim()
                    .toLowerCase() ===
                    wantedStorage &&
                  variant.color
                    .trim()
                    .toLowerCase() ===
                    wantedColor
              );

            variantId =
              matchedVariant
                ?.id ??
              null;
          }
        }
      }

      if (!productId) {
        throw new Error(
          "PRODUCT_REQUIRED"
        );
      }

      const requestedCondition =
        orderItem
          ?.phone.condition ??
        (conditionParam ===
          "refurbished"
          ? "refurbished"
          : conditionParam ===
              "new"
            ? "new"
            : selectedPhone.condition);

      /* ===================================================
         BANK REFURBISHED CONFIGURATION

         The browser sends only which options were selected.

         It does NOT send:
         - cosmetic grade price
         - battery surcharge
         - shipping price
         - authoritative total

         create-order will calculate all prices again on the
         server.
      =================================================== */

      const requestedRefurbishedGrade =
        requestedCondition ===
          "refurbished"
          ? orderItem
              ?.refurbishedGrade ??
            null
          : null;

      const requestedBatteryGrade =
        requestedCondition ===
          "refurbished"
          ? orderItem
              ?.batteryGrade ??
            null
          : null;

      /*
       * Never guess the configuration of an old persisted
       * refurbished cart item.
       */
      if (
        requestedCondition ===
          "refurbished" &&
        (
          !requestedRefurbishedGrade ||
          !requestedBatteryGrade
        )
      ) {
        throw new Error(
          "REFURBISHED_CONFIGURATION_REQUIRED"
        );
      }

      /*
       * Exact grade prices live on product_variants, so a
       * refurbished checkout must resolve a real variant.
       */
      if (
        requestedCondition ===
          "refurbished" &&
        !variantId
      ) {
        throw new Error(
          "REFURBISHED_VARIANT_REQUIRED"
        );
      }

      const result =
        await createOrder({
          customerName:
            customer.name.trim(),

          customerEmail:
            cleanEmail,

          customerWhatsapp:
            customer.whatsapp.trim(),

          customerCountry:
            customer.country.trim(),

          customerStateRegion:
            customer.stateRegion.trim(),

          customerCity:
            customer.city.trim(),

          customerStreet:
            customer.street.trim(),

          customerHouseNumber:
            customer.houseNumber.trim(),

          customerAddressLine2:
            customer.addressLine2.trim(),

          customerPostalCode:
            customer.postalCode.trim(),

          customerNotes:
            customer.notes.trim(),

          productId,

          variantId,

          condition:
            requestedCondition,

          /*
           * Selection identifiers only.
           *
           * The Edge Function will independently:
           *
           * 1. Read the exact cosmetic-grade price from
           *    Supabase.
           *
           * 2. Add exactly €89 when batteryGrade === "new".
           *
           * 3. Calculate authoritative destination shipping.
           *
           * 4. Calculate the final bank-transfer amount.
           */
          refurbishedGrade:
            requestedCondition ===
              "refurbished"
              ? requestedRefurbishedGrade
              : null,

          batteryGrade:
            requestedCondition ===
              "refurbished"
              ? requestedBatteryGrade
              : null,

          quantity:
            orderItem
              ?.quantity ??
            1,

          paymentMethod:
            "bank_transfer",

          language,

          displayCurrency:
            currency,
        });

      console.log(
        "POKAPOK ORDER CREATED:",
        result
      );

      setCreatedOrder(
        result
      );

      if (cartHasItems) {
        clearCart();
      }

      setSubmitted(true);
    } catch (error) {
      console.error(
        "Checkout error:",
        error
      );

      const errorCode =
        error instanceof Error
          ? error.message
          : "ORDER_CREATE_FAILED";

      const baseMessage =
        errorCode ===
        "PRODUCT_REQUIRED"
          ? text.missingDatabaseProduct
          : errorCode ===
                "REFURBISHED_CONFIGURATION_REQUIRED" ||
              errorCode ===
                "REFURBISHED_GRADE_REQUIRED" ||
              errorCode ===
                "BATTERY_GRADE_REQUIRED" ||
              errorCode ===
                "REFURBISHED_VARIANT_REQUIRED"
            ? text.missingRefurbishedConfiguration
            : text.orderFailed;

      const message =
        `${baseMessage} (${errorCode})`;

      setSubmitError(
        message
      );

      alert(message);
    } finally {
      setSubmitting(false);
    }
  }

  /* =======================================================
     PAYPAL SUCCESS
  ======================================================= */

  if (
    completedPayPalOrder
  ) {
    const paypalCurrency =
      completedPayPalOrder
        .currency ??
      "EUR";

    const paypalTotal =
      completedPayPalOrder
        .total ??
      completedPayPalOrder
        .amount ??
      0;

    const paypalSubtotal =
      completedPayPalOrder
        .subtotal;

    const paypalShipping =
      completedPayPalOrder
        .shipping;

    const formattedPayPalTotal =
      formatOrderPrice(
        paypalTotal,
        paypalCurrency,
        language
      );

    const formattedPayPalSubtotal =
      paypalSubtotal !==
        null
        ? formatOrderPrice(
            paypalSubtotal,
            paypalCurrency,
            language
          )
        : null;

    const formattedPayPalShipping =
      paypalShipping !==
        null
        ? formatOrderPrice(
            paypalShipping,
            paypalCurrency,
            language
          )
        : null;

    const hasDisplayEquivalent =
      completedPayPalOrder
        .displayCurrency &&
      completedPayPalOrder
        .displayCurrency !==
        paypalCurrency &&
      completedPayPalOrder
        .displayTotal !==
        null;

    const formattedDisplayTotal =
      hasDisplayEquivalent &&
      completedPayPalOrder
        .displayCurrency &&
      completedPayPalOrder
        .displayTotal !==
        null
        ? formatOrderPrice(
            completedPayPalOrder
              .displayTotal,
            completedPayPalOrder
              .displayCurrency,
            language
          )
        : null;

    const paypalExchangeRateText =
      completedPayPalOrder
        .displayCurrency ===
        "CVE" &&
      completedPayPalOrder
        .exchangeRate !==
        null
        ? `1 EUR = ${completedPayPalOrder.exchangeRate} CVE`
        : null;

    const customerProvidedEmail =
      Boolean(
        customer.email.trim()
      );

    return (
      <ScrollView
        style={
          styles.screen
        }
        contentContainerStyle={[
          styles.content,

          isMobile &&
            styles.contentMobile,
        ]}
      >
        <View
          style={[
            styles.header,

            isMobile &&
              styles.headerMobile,
          ]}
        >
          <Link
            href={
              "/" as any
            }
            asChild
          >
            <Pressable>
              <Text
                style={[
                  styles.back,

                  isMobile &&
                    styles.backMobile,
                ]}
              >
                ← {text.backHome}
              </Text>
            </Pressable>
          </Link>

          <Text
            style={[
              styles.logo,

              isMobile &&
                styles.logoMobile,
            ]}
          >
            POKAPOK
          </Text>
        </View>

        <View
          style={[
            styles.successBox,

            isMobile &&
              styles.successBoxMobile,
          ]}
        >
          <Text
            style={
              styles.successKicker
            }
          >
            {
              text.paypalPaymentConfirmed
            }
          </Text>

          <Text
            style={[
              styles.successTitle,

              isMobile &&
                styles.successTitleMobile,
            ]}
          >
            {
              text.paypalPaymentConfirmedTitle
            }
          </Text>

          <Text
            style={[
              styles.successText,

              isMobile &&
                styles.successTextMobile,
            ]}
          >
            {
              text.paypalPaymentConfirmedDescription
            }
          </Text>

          <View
            style={
              styles.paypalPaidBadge
            }
          >
            <Text
              style={
                styles.paypalPaidBadgeText
              }
            >
              {text.paid}
            </Text>
          </View>

          <View
            style={[
              styles.successGrid,

              isMobile &&
                styles.successGridMobile,
            ]}
          >
            {completedPayPalOrder
              .orderNumber ? (
              <View
                style={[
                  styles.successInfoCard,

                  isMobile &&
                    styles.successInfoCardMobile,
                ]}
              >
                <Text
                  style={
                    styles.successInfoLabel
                  }
                >
                  {text.orderNumber}
                </Text>

                <Text
                  selectable
                  style={
                    styles.successInfoValue
                  }
                >
                  {
                    completedPayPalOrder
                      .orderNumber
                  }
                </Text>
              </View>
            ) : null}

            <View
              style={[
                styles.successInfoCard,

                isMobile &&
                  styles.successInfoCardMobile,
              ]}
            >
              <Text
                style={
                  styles.successInfoLabel
                }
              >
                {text.totalPaid}
              </Text>

              <Text
                style={
                  styles.successAmount
                }
              >
                {
                  formattedPayPalTotal
                }
              </Text>
            </View>

            <View
              style={[
                styles.successInfoCard,

                isMobile &&
                  styles.successInfoCardMobile,
              ]}
            >
              <Text
                style={
                  styles.successInfoLabel
                }
              >
                {
                  text.paymentMethod
                }
              </Text>

              <Text
                style={
                  styles.successInfoValue
                }
              >
                PayPal
              </Text>
            </View>

            {formattedDisplayTotal ? (
              <View
                style={[
                  styles.successInfoCard,

                  isMobile &&
                    styles.successInfoCardMobile,
                ]}
              >
                <Text
                  style={
                    styles.successInfoLabel
                  }
                >
                  {
                    text.displayEquivalent
                  }
                </Text>

                <Text
                  style={
                    styles.successAmount
                  }
                >
                  {
                    formattedDisplayTotal
                  }
                </Text>

                {paypalExchangeRateText ? (
                  <Text
                    style={
                      styles.successInfoHelper
                    }
                  >
                    {
                      text.exchangeRate
                    }
                    :{" "}
                    {
                      paypalExchangeRateText
                    }
                  </Text>
                ) : null}
              </View>
            ) : null}
          </View>

          {formattedPayPalSubtotal !==
            null ||
          formattedPayPalShipping !==
            null ? (
            <View
              style={
                styles.paypalPaymentSummary
              }
            >
              {formattedPayPalSubtotal !==
              null ? (
                <View
                  style={
                    styles.paypalPaymentSummaryRow
                  }
                >
                  <Text
                    style={
                      styles.paypalPaymentSummaryLabel
                    }
                  >
                    {text.subtotal}
                  </Text>

                  <Text
                    style={
                      styles.paypalPaymentSummaryValue
                    }
                  >
                    {
                      formattedPayPalSubtotal
                    }
                  </Text>
                </View>
              ) : null}

              {formattedPayPalShipping !==
              null ? (
                <View
                  style={
                    styles.paypalPaymentSummaryRow
                  }
                >
                  <Text
                    style={
                      styles.paypalPaymentSummaryLabel
                    }
                  >
                    {text.shipping}
                  </Text>

                  <Text
                    style={
                      styles.paypalPaymentSummaryValue
                    }
                  >
                    {
                      formattedPayPalShipping
                    }
                  </Text>
                </View>
              ) : null}

              <View
                style={
                  styles.paypalPaymentSummaryDivider
                }
              />

              <View
                style={
                  styles.paypalPaymentSummaryRow
                }
              >
                <Text
                  style={
                    styles.paypalPaymentSummaryTotalLabel
                  }
                >
                  {text.totalPaid}
                </Text>

                <Text
                  style={
                    styles.paypalPaymentSummaryTotalValue
                  }
                >
                  {
                    formattedPayPalTotal
                  }
                </Text>
              </View>
            </View>
          ) : null}

          <View
            style={
              styles.referenceBox
            }
          >
            <Text
              style={
                styles.referenceLabel
              }
            >
              {
                text.paypalReference
              }
            </Text>

            <Text
              selectable
              style={
                styles.referenceValue
              }
            >
              {
                completedPayPalOrder
                  .captureId
              }
            </Text>

            <Text
              style={
                styles.referenceHelp
              }
            >
              PayPal Order ID:{" "}
              {
                completedPayPalOrder
                  .paypalOrderId
              }
            </Text>
          </View>

          <View
            style={
              styles.paypalProcessingBox
            }
          >
            <Text
              style={
                styles.paypalProcessingTitle
              }
            >
              {text.processing}
            </Text>

            <Text
              style={
                styles.paypalProcessingText
              }
            >
              {
                language ===
                  "pt"
                  ? "A sua encomenda está paga e seguirá agora para preparação e envio."
                  : "Your order is paid and will now move to preparation and shipping."
              }
            </Text>
          </View>

          <View
            style={[
              styles.emailNotice,

              customerProvidedEmail &&
                !completedPayPalOrder
                  .emailSent &&
                styles.emailNoticeWarning,
            ]}
          >
            <Text
              style={
                styles.emailNoticeText
              }
            >
              {!customerProvidedEmail
                ? text.paypalEmailNotProvided
                : completedPayPalOrder
                      .emailSent
                  ? text.paypalEmailSent
                  : text.paypalEmailNotSent}
            </Text>

            {completedPayPalOrder
              .warning ? (
              <Text
                style={
                  styles.paypalWarningText
                }
              >
                {
                  completedPayPalOrder
                    .warning
                }
              </Text>
            ) : null}
          </View>

          <Link
            href={
              "/catalog" as any
            }
            asChild
          >
            <Pressable
              style={[
                styles.primaryButton,

                isMobile &&
                  styles.primaryButtonMobile,
              ]}
            >
              <Text
                style={
                  styles.primaryButtonText
                }
              >
                {
                  text.browseMorePhones
                }
              </Text>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    );
  }

  /* =======================================================
     SUCCESS
  ======================================================= */

  if (
    submitted &&
    createdOrder
  ) {
    const bank =
      createdOrder.payment.bank;

    const orderTotal =
      formatOrderPrice(
        createdOrder.pricing.total_amount,
        createdOrder.pricing.currency,
        language
      );

    const displayOrderTotal =
      formatOrderPrice(
        createdOrder.pricing.display_total_amount,
        createdOrder.pricing.display_currency,
        language
      );

    const showDisplayEquivalent =
      createdOrder.pricing.display_currency !==
      createdOrder.pricing.currency;

    const exchangeRateText =
      createdOrder.pricing.display_currency ===
      "CVE"
        ? `1 EUR = ${createdOrder.pricing.exchange_rate} CVE`
        : "1 EUR = 1 EUR";

    const customerProvidedEmail =
      Boolean(
        customer.email.trim()
      );

    return (
      <ScrollView
        style={styles.screen}
        contentContainerStyle={[
          styles.content,
          isMobile &&
            styles.contentMobile,
        ]}
      >
        <View
          style={[
            styles.header,
            isMobile &&
              styles.headerMobile,
          ]}
        >
          <Link
            href={"/" as any}
            asChild
          >
            <Pressable>
              <Text
                style={[
                  styles.back,
                  isMobile &&
                    styles.backMobile,
                ]}
              >
                ← {text.backHome}
              </Text>
            </Pressable>
          </Link>

          <Text
            style={[
              styles.logo,
              isMobile &&
                styles.logoMobile,
            ]}
          >
            POKAPOK
          </Text>
        </View>

        <View
          style={[
            styles.successBox,
            isMobile &&
              styles.successBoxMobile,
          ]}
        >
          <Text
            style={
              styles.successKicker
            }
          >
            {text.requestReceived}
          </Text>

          <Text
            style={
              styles.successTitle
            }
          >
            {text.requestReceivedTitle}
          </Text>

          <Text
            style={
              styles.successText
            }
          >
            {text.requestReceivedDescription}
          </Text>

          <View
            style={
              styles.successStatusBadge
            }
          >
            <Text
              style={
                styles.successStatusText
              }
            >
              {text.awaitingPayment}
            </Text>
          </View>

          <View
            style={
              styles.successGrid
            }
          >
            <View
              style={
                styles.successInfoCard
              }
            >
              <Text
                style={
                  styles.successInfoLabel
                }
              >
                {text.orderNumber}
              </Text>

              <Text
                selectable
                style={
                  styles.successInfoValue
                }
              >
                {createdOrder.order_number}
              </Text>
            </View>

            <View
              style={
                styles.successInfoCard
              }
            >
              <Text
                style={
                  styles.successInfoLabel
                }
              >
                {text.amountToTransfer}
              </Text>

              <Text
                style={
                  styles.successAmount
                }
              >
                {orderTotal}
              </Text>
            </View>

            {showDisplayEquivalent ? (
              <View
                style={
                  styles.successInfoCard
                }
              >
                <Text
                  style={
                    styles.successInfoLabel
                  }
                >
                  {text.displayEquivalent}
                </Text>

                <Text
                  style={
                    styles.successAmount
                  }
                >
                  {displayOrderTotal}
                </Text>

                <Text
                  style={
                    styles.successInfoHelper
                  }
                >
                  {text.exchangeRate}:{" "}
                  {exchangeRateText}
                </Text>
              </View>
            ) : null}
          </View>

          <View
            style={
              styles.referenceBox
            }
          >
            <Text
              style={
                styles.referenceLabel
              }
            >
              {text.paymentReference}
            </Text>

            <Text
              selectable
              style={
                styles.referenceValue
              }
            >
              {createdOrder.payment_reference}
            </Text>

            <Text
              style={
                styles.referenceHelp
              }
            >
              {text.paymentReferenceHelp}
            </Text>
          </View>

          <View
            style={
              styles.bankDetailsBox
            }
          >
            <Text
              style={
                styles.bankDetailsTitle
              }
            >
              {text.bankInstructions}
            </Text>

            <Text
              style={
                styles.bankDetailsText
              }
            >
              {text.bankInstructionsDescription}
            </Text>

            <View
              style={
                styles.bankDetailRow
              }
            >
              <Text
                style={
                  styles.bankDetailLabel
                }
              >
                {text.accountHolder}
              </Text>

              <Text
                selectable
                style={
                  styles.bankDetailValue
                }
              >
                {bank.account_name}
              </Text>
            </View>

            <View
              style={
                styles.bankDetailRow
              }
            >
              <Text
                style={
                  styles.bankDetailLabel
                }
              >
                IBAN
              </Text>

              <Text
                selectable
                style={
                  styles.bankDetailValueStrong
                }
              >
                {bank.iban}
              </Text>
            </View>

            <View
              style={
                styles.bankDetailRow
              }
            >
              <Text
                style={
                  styles.bankDetailLabel
                }
              >
                BIC / SWIFT
              </Text>

              <Text
                selectable
                style={
                  styles.bankDetailValue
                }
              >
                {bank.bic}
              </Text>
            </View>

            <View
              style={
                styles.bankDetailRow
              }
            >
              <Text
                style={
                  styles.bankDetailLabel
                }
              >
                {text.bank}
              </Text>

              <Text
                style={
                  styles.bankDetailValue
                }
              >
                {bank.bank_name}
              </Text>
            </View>

            <View
              style={
                styles.bankDetailRow
              }
            >
              <Text
                style={
                  styles.bankDetailLabel
                }
              >
                {text.bankCountry}
              </Text>

              <Text
                style={
                  styles.bankDetailValue
                }
              >
                {bank.country}
              </Text>
            </View>

            <View
              style={
                styles.bankDetailRow
              }
            >
              <Text
                style={
                  styles.bankDetailLabel
                }
              >
                {text.transferCurrency}
              </Text>

              <Text
                style={
                  styles.bankDetailValueStrong
                }
              >
                {bank.currency}
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.emailNotice,

              customerProvidedEmail &&
                !createdOrder.email_sent &&
                styles.emailNoticeWarning,
            ]}
          >
            <Text
              style={
                styles.emailNoticeText
              }
            >
              {!customerProvidedEmail
                ? text.emailNotProvided
                : createdOrder.email_sent
                  ? text.emailSent
                  : text.emailNotSent}
            </Text>
          </View>

          <Link
            href={"/catalog" as any}
            asChild
          >
            <Pressable
              style={
                styles.primaryButton
              }
            >
              <Text
                style={
                  styles.primaryButtonText
                }
              >
                {text.browseMorePhones}
              </Text>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    );
  }

  /* =======================================================
     NO PRODUCT
  ======================================================= */

  if (
    !selectedPhone ||
    !selectedColor ||
    !selectedStorage
  ) {
    return (
      <ScrollView
        style={styles.screen}
        contentContainerStyle={[
          styles.content,
          isMobile &&
            styles.contentMobile,
        ]}
      >
        <View
          style={[
            styles.header,
            isMobile &&
              styles.headerMobile,
          ]}
        >
          <Link
            href={"/catalog" as any}
            asChild
          >
            <Pressable>
              <Text
                style={[
                  styles.back,
                  isMobile &&
                    styles.backMobile,
                ]}
              >
                ← {text.backCatalog}
              </Text>
            </Pressable>
          </Link>

          <Text
            style={[
              styles.logo,
              isMobile &&
                styles.logoMobile,
            ]}
          >
            POKAPOK
          </Text>
        </View>

        <View
          style={[
            styles.emptyBox,
            isMobile &&
              styles.emptyBoxMobile,
          ]}
        >
          <Text
            style={
              styles.emptyKicker
            }
          >
            {text.noProductSelected}
          </Text>

          <Text
            style={
              styles.emptyTitle
            }
          >
            {text.checkoutEmpty}
          </Text>

          <Text
            style={
              styles.emptyText
            }
          >
            {text.checkoutEmptyDescription}
          </Text>

          <Link
            href={"/catalog" as any}
            asChild
          >
            <Pressable
              style={
                styles.primaryButton
              }
            >
              <Text
                style={
                  styles.primaryButtonText
                }
              >
                {text.browsePhones}
              </Text>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    );
  }

  /* =======================================================
     CHECKOUT
  ======================================================= */

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        isMobile &&
          styles.contentMobile,
      ]}
    >
      <View
        style={[
          styles.header,
          isMobile &&
            styles.headerMobile,
        ]}
      >
        <Link
          href={"/cart" as any}
          asChild
        >
          <Pressable>
            <Text
              style={[
                styles.back,
                isMobile &&
                  styles.backMobile,
              ]}
            >
              ← {text.backCart}
            </Text>
          </Pressable>
        </Link>

        <Text
          style={[
            styles.logo,
            isMobile &&
              styles.logoMobile,
          ]}
        >
          POKAPOK
        </Text>
      </View>

      <View
        style={[
          styles.hero,
          isMobile &&
            styles.heroMobile,
        ]}
      >
        <Text
          style={[
            styles.kicker,
            isMobile &&
              styles.kickerMobile,
          ]}
        >
          {text.checkout}
        </Text>

        <Text
          style={[
            styles.title,
            isMobile &&
              styles.titleMobile,
          ]}
        >
          {text.completeRequest}
        </Text>

        <Text
          style={[
            styles.text,
            isMobile &&
              styles.textMobile,
          ]}
        >
          {text.heroDescription}
        </Text>
      </View>

      <View
        style={[
          styles.page,
          isMobile &&
            styles.pageMobile,
        ]}
      >
        <View
          style={[
            styles.formBox,
            isMobile &&
              styles.formBoxMobile,
          ]}
        >
          <Text
            style={[
              styles.sectionTitle,
              isMobile &&
                styles.sectionTitleMobile,
            ]}
          >
            {text.selectedPhone}
          </Text>

          <View
            style={
              styles.selectedCard
            }
          >
            <View
              style={
                styles.phonePreview
              }
            >
              {checkoutImageSource ? (
                <Image
                  source={
                    checkoutImageSource
                  }
                  style={
                    styles.phoneImage
                  }
                  resizeMode="contain"
                />
              ) : (
                <View
                  style={
                    styles.phoneScreen
                  }
                />
              )}
            </View>

            <View
              style={
                styles.selectedInfo
              }
            >
              <Text
                style={styles.brand}
              >
                {selectedPhone.brand.toUpperCase()}
              </Text>

              <Text
                numberOfLines={
                  isMobile
                    ? 2
                    : undefined
                }
                style={[
                  styles.phoneName,
                  isMobile &&
                    styles.phoneNameMobile,
                ]}
              >
                {selectedPhone.name}
              </Text>

              <Text
                numberOfLines={
                  isMobile
                    ? 2
                    : undefined
                }
                style={[
                  styles.phoneMeta,
                  isMobile &&
                    styles.phoneMetaMobile,
                ]}
              >
                {localizePhoneCondition(
                  selectedPhone.condition,
                  language
                )}{" "}
                ·{" "}
                {
                  selectedPhone
                    .specs.screen
                }
              </Text>
            </View>
          </View>

          {!cartHasItems ? (
            <>
              <Text
                style={styles.label}
              >
                {text.color}
              </Text>

              <View style={styles.row}>
                {selectedPhone.colors.map(
                  (
                    item,
                    index
                  ) => (
                    <Pressable
                      key={item.name}
                      onPress={() =>
                        setColorIndex(
                          index
                        )
                      }
                      style={[
                        styles.colorChoice,

                        colorIndex ===
                          index &&
                          styles.choiceActive,
                      ]}
                    >
                      <View
                        style={[
                          styles.colorDot,
                          {
                            backgroundColor:
                              item.hex,
                          },
                        ]}
                      />

                      <Text
                        style={
                          styles.choiceText
                        }
                      >
                        {localizePhoneColor(
                          item.name,
                          language
                        )}
                      </Text>
                    </Pressable>
                  )
                )}
              </View>

              <Text
                style={styles.label}
              >
                {text.storage}
              </Text>

              <View style={styles.row}>
                {selectedPhone.storage.map(
                  (
                    item,
                    index
                  ) => (
                    <Pressable
                      key={item.label}
                      onPress={() =>
                        setStorageIndex(
                          index
                        )
                      }
                      style={[
                        styles.choice,

                        storageIndex ===
                          index &&
                          styles.choiceActive,
                      ]}
                    >
                      <Text
                        style={
                          styles.choiceText
                        }
                      >
                        {item.label}

                        {item.priceIncrease >
                        0
                          ? ` +${formatPrice(
                              item.priceIncrease
                            )}`
                          : ""}
                      </Text>
                    </Pressable>
                  )
                )}
              </View>

              <Text
                style={styles.label}
              >
                {
                  text.purchaseOption
                }
              </Text>

              <View style={styles.row}>
                {(
                  [
                    "buy",
                    "installments",
                    "lease",
                  ] as PaymentMode[]
                ).map(
                  (mode) => (
                    <Pressable
                      key={mode}
                      onPress={() =>
                        setPaymentMode(
                          mode
                        )
                      }
                      style={[
                        styles.choice,

                        paymentMode ===
                          mode &&
                          styles.choiceActive,
                      ]}
                    >
                      <Text
                        style={
                          styles.choiceText
                        }
                      >
                        {mode ===
                        "lease"
                          ? text.lease
                          : mode ===
                              "installments"
                            ? text.installments
                            : text.buyNow}
                      </Text>
                    </Pressable>
                  )
                )}
              </View>

              {paymentMode ===
              "installments" ? (
                <>
                  <Text
                    style={
                      styles.label
                    }
                  >
                    {text.term}
                  </Text>

                  <View
                    style={
                      styles.row
                    }
                  >
                    {[
                      12,
                      24,
                      36,
                    ].map(
                      (item) => (
                        <Pressable
                          key={item}
                          onPress={() =>
                            setMonths(
                              item
                            )
                          }
                          style={[
                            styles.choice,

                            months ===
                              item &&
                              styles.choiceActive,
                          ]}
                        >
                          <Text
                            style={
                              styles.choiceText
                            }
                          >
                            {item}{" "}
                            {
                              text.months
                            }
                          </Text>
                        </Pressable>
                      )
                    )}
                  </View>
                </>
              ) : null}

              {paymentMode !==
              "buy" ? (
                <Pressable
                  onPress={() =>
                    setInsurance(
                      (
                        current
                      ) =>
                        !current
                    )
                  }
                  style={[
                    styles.insurance,

                    insurance &&
                      styles.insuranceActive,
                  ]}
                >
                  <Text
                    style={
                      styles.insuranceTitle
                    }
                  >
                    {
                      text.addProtectionInsurance
                    }
                  </Text>

                  <Text
                    style={
                      styles.insuranceText
                    }
                  >
                    {
                      text.insuranceDescription
                    }
                  </Text>
                </Pressable>
              ) : null}
            </>
          ) : (
            <View
              style={[
                styles.cartNotice,
                isMobile &&
                  styles.cartNoticeMobile,
              ]}
            >
              <Text
                style={[
                  styles.cartNoticeTitle,
                  isMobile &&
                    styles.cartNoticeTitleMobile,
                ]}
              >
                {items.length === 1
                  ? text.checkingOutOne
                  : text.checkingOutMultiple(
                      items.length
                    )}
              </Text>

              <Text
                style={[
                  styles.cartNoticeText,
                  isMobile &&
                    styles.cartNoticeTextMobile,
                ]}
              >
                {text.cartLocked}
              </Text>
            </View>
          )}

          <Text
            style={[
              styles.sectionTitle,
              styles.sectionSpacing,
              isMobile &&
                styles.sectionTitleMobile,
              isMobile &&
                styles.sectionSpacingMobile,
            ]}
          >
            {text.yourDetails}
          </Text>

          <TextInput
            value={customer.name}
            onChangeText={(value) =>
              updateCustomer(
                "name",
                value
              )
            }
            placeholder={
              text.fullName
            }
            placeholderTextColor={
              colors.ink40
            }
            style={[
              styles.input,
              isMobile &&
                styles.inputMobile,
            ]}
          />

          <View
            style={[
              styles.inputRow,
              isMobile &&
                styles.inputRowMobile,
            ]}
          >
            <TextInput
              value={customer.whatsapp}
              onChangeText={(value) =>
                updateCustomer(
                  "whatsapp",
                  value
                )
              }
              placeholder={
                text.whatsappNumber
              }
              placeholderTextColor={
                colors.ink40
              }
              keyboardType="phone-pad"
              style={[
                styles.input,
                styles.inputHalf,
                isMobile &&
                  styles.inputMobile,
                isMobile &&
                  styles.inputHalfMobile,
              ]}
            />

            <TextInput
              value={customer.email}
              onChangeText={(value) =>
                updateCustomer(
                  "email",
                  value
                )
              }
              placeholder={
                text.emailOptional
              }
              placeholderTextColor={
                colors.ink40
              }
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              style={[
                styles.input,
                styles.inputHalf,
                isMobile &&
                  styles.inputMobile,
                isMobile &&
                  styles.inputHalfMobile,
              ]}
            />
          </View>

          <Text
            style={[
              styles.sectionTitle,
              styles.sectionSpacing,
              isMobile &&
                styles.sectionTitleMobile,
              isMobile &&
                styles.sectionSpacingMobile,
            ]}
          >
            {text.deliveryAddress}
          </Text>

          <Text
            style={[
              styles.sectionDescription,
              isMobile &&
                styles.sectionDescriptionMobile,
            ]}
          >
            {text.deliveryAddressDescription}
          </Text>

          <View
            style={[
              styles.inputRow,
              styles.dropdownRow,
              isMobile &&
                styles.inputRowMobile,
            ]}
          >
            <View
              style={[
                styles.dropdownWrapper,
                styles.inputHalf,

                countryDropdownOpen &&
                  styles.dropdownWrapperOpen,

                isMobile &&
                  styles.inputHalfMobile,
              ]}
            >
              <Pressable
                onPress={() => {
                  setCountryDropdownOpen(
                    (current) =>
                      !current
                  );

                  setIslandDropdownOpen(
                    false
                  );
                }}
                style={[
                  styles.input,
                  styles.dropdownButton,

                  isMobile &&
                    styles.inputMobile,
                ]}
              >
                <Text
                  numberOfLines={1}
                  style={
                    selectedCountryDisplay
                      ? styles.dropdownButtonText
                      : styles.dropdownPlaceholder
                  }
                >
                  {selectedCountryDisplay ||
                    text.country}
                </Text>

                <Text
                  style={[
                    styles.dropdownArrow,

                    countryDropdownOpen &&
                      styles.dropdownArrowOpen,
                  ]}
                >
                  ▾
                </Text>
              </Pressable>

              {countryDropdownOpen ? (
                <ScrollView
                  style={[
                    styles.dropdownMenu,

                    isMobile &&
                      styles.dropdownMenuMobile,
                  ]}
                  nestedScrollEnabled
                  showsVerticalScrollIndicator
                >
                  {SHIPPING_COUNTRIES.map(
                    (country) => {
                      const label =
                        language ===
                        "pt"
                          ? country.pt
                          : country.en;

                      const active =
                        customer.country ===
                        country.value;

                      return (
                        <Pressable
                          key={
                            country.value
                          }
                          onPress={() => {
                            updateCustomer(
                              "country",
                              country.value
                            );

                            updateCustomer(
                              "stateRegion",
                              ""
                            );

                            setCountryDropdownOpen(
                              false
                            );

                            setIslandDropdownOpen(
                              false
                            );
                          }}
                          style={[
                            styles.dropdownItem,

                            active &&
                              styles.dropdownItemActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.dropdownItemText,

                              active &&
                                styles.dropdownItemTextActive,
                            ]}
                          >
                            {label}
                          </Text>

                          {active ? (
                            <Text
                              style={
                                styles.dropdownCheck
                              }
                            >
                              ✓
                            </Text>
                          ) : null}
                        </Pressable>
                      );
                    }
                  )}
                </ScrollView>
              ) : null}
            </View>

            {customer.country ===
            "Cabo Verde" ? (
              <View
                style={[
                  styles.dropdownWrapper,
                  styles.inputHalf,

                  islandDropdownOpen &&
                    styles.dropdownWrapperOpen,

                  isMobile &&
                    styles.inputHalfMobile,
                ]}
              >
                <Pressable
                  onPress={() => {
                    setIslandDropdownOpen(
                      (current) =>
                        !current
                    );

                    setCountryDropdownOpen(
                      false
                    );
                  }}
                  style={[
                    styles.input,
                    styles.dropdownButton,

                    isMobile &&
                      styles.inputMobile,
                  ]}
                >
                  <Text
                    numberOfLines={1}
                    style={
                      customer.stateRegion
                        ? styles.dropdownButtonText
                        : styles.dropdownPlaceholder
                    }
                  >
                    {customer.stateRegion ||
                      text.stateRegion}
                  </Text>

                  <Text
                    style={[
                      styles.dropdownArrow,

                      islandDropdownOpen &&
                        styles.dropdownArrowOpen,
                    ]}
                  >
                    ▾
                  </Text>
                </Pressable>

                {islandDropdownOpen ? (
                  <ScrollView
                    style={[
                      styles.dropdownMenu,

                      isMobile &&
                        styles.dropdownMenuMobile,
                    ]}
                    nestedScrollEnabled
                    showsVerticalScrollIndicator
                  >
                    {CABO_VERDE_ISLANDS.map(
                      (island) => {
                        const active =
                          customer.stateRegion ===
                          island;

                        return (
                          <Pressable
                            key={
                              island
                            }
                            onPress={() => {
                              updateCustomer(
                                "stateRegion",
                                island
                              );

                              setIslandDropdownOpen(
                                false
                              );
                            }}
                            style={[
                              styles.dropdownItem,

                              active &&
                                styles.dropdownItemActive,
                            ]}
                          >
                            <Text
                              style={[
                                styles.dropdownItemText,

                                active &&
                                  styles.dropdownItemTextActive,
                              ]}
                            >
                              {island}
                            </Text>

                            {active ? (
                              <Text
                                style={
                                  styles.dropdownCheck
                                }
                              >
                                ✓
                              </Text>
                            ) : null}
                          </Pressable>
                        );
                      }
                    )}
                  </ScrollView>
                ) : null}
              </View>
            ) : (
              <TextInput
                value={
                  customer.stateRegion
                }
                onChangeText={(value) =>
                  updateCustomer(
                    "stateRegion",
                    value
                  )
                }
                placeholder={
                  text.stateRegion
                }
                placeholderTextColor={
                  colors.ink40
                }
                autoCapitalize="words"
                editable={
                  Boolean(
                    customer.country
                  )
                }
                style={[
                  styles.input,
                  styles.inputHalf,

                  !customer.country &&
                    styles.inputDisabled,

                  isMobile &&
                    styles.inputMobile,

                  isMobile &&
                    styles.inputHalfMobile,
                ]}
              />
            )}
          </View>

          <View
            style={[
              styles.inputRow,
              isMobile &&
                styles.inputRowMobile,
            ]}
          >
            <TextInput
              value={customer.city}
              onChangeText={(value) =>
                updateCustomer(
                  "city",
                  value
                )
              }
              placeholder={
                text.city
              }
              placeholderTextColor={
                colors.ink40
              }
              autoCapitalize="words"
              style={[
                styles.input,
                styles.inputHalf,
                isMobile &&
                  styles.inputMobile,
                isMobile &&
                  styles.inputHalfMobile,
              ]}
            />

            <TextInput
              value={customer.postalCode}
              onChangeText={(value) =>
                updateCustomer(
                  "postalCode",
                  value
                )
              }
              placeholder={
                text.postalCode
              }
              placeholderTextColor={
                colors.ink40
              }
              autoCapitalize="characters"
              style={[
                styles.input,
                styles.inputHalf,
                isMobile &&
                  styles.inputMobile,
                isMobile &&
                  styles.inputHalfMobile,
              ]}
            />
          </View>

          <View
            style={[
              styles.inputRow,
              isMobile &&
                styles.inputRowMobile,
            ]}
          >
            <TextInput
              value={customer.street}
              onChangeText={(value) =>
                updateCustomer(
                  "street",
                  value
                )
              }
              placeholder={
                text.street
              }
              placeholderTextColor={
                colors.ink40
              }
              autoCapitalize="words"
              style={[
                styles.input,
                styles.inputWide,
                isMobile &&
                  styles.inputMobile,
                isMobile &&
                  styles.inputHalfMobile,
              ]}
            />

            <TextInput
              value={customer.houseNumber}
              onChangeText={(value) =>
                updateCustomer(
                  "houseNumber",
                  value
                )
              }
              placeholder={
                text.houseNumber
              }
              placeholderTextColor={
                colors.ink40
              }
              style={[
                styles.input,
                styles.inputNarrow,
                isMobile &&
                  styles.inputMobile,
                isMobile &&
                  styles.inputHalfMobile,
              ]}
            />
          </View>

          <TextInput
            value={
              customer.addressLine2
            }
            onChangeText={(value) =>
              updateCustomer(
                "addressLine2",
                value
              )
            }
            placeholder={
              text.addressLine2
            }
            placeholderTextColor={
              colors.ink40
            }
            style={[
              styles.input,
              isMobile &&
                styles.inputMobile,
            ]}
          />

          <TextInput
            value={customer.notes}
            onChangeText={(value) =>
              updateCustomer(
                "notes",
                value
              )
            }
            placeholder={
              text.notesOptional
            }
            placeholderTextColor={
              colors.ink40
            }
            style={[
              styles.input,
              styles.notes,
              isMobile &&
                styles.inputMobile,
              isMobile &&
                styles.notesMobile,
            ]}
            multiline
          />
        </View>

        <View
          style={[
            styles.summaryBox,
            isMobile &&
              styles.summaryBoxMobile,
          ]}
        >
          <Text
            style={[
              styles.summaryTitle,
              isMobile &&
                styles.summaryTitleMobile,
            ]}
          >
            {text.requestSummary}
          </Text>

          {cartHasItems ? (
            <>
              {items.map(
                (item) => (
                  <View
                    key={item.id}
                    style={
                      styles.summaryItem
                    }
                  >
                    <Text
                      style={
                        styles.summaryName
                      }
                    >
                      {item.phone.name}
                    </Text>

                    <Text
                      style={
                        styles.summaryMeta
                      }
                    >
                      {
                        item.storageLabel
                      }{" "}
                      ·{" "}
                      {localizePhoneColor(
                        item.colorName,
                        language
                      )}
                    </Text>

                    {item.quantity > 1 ? (
                      <Text
                        style={
                          styles.summaryMeta
                        }
                      >
                        {text.quantity}:{" "}
                        {item.quantity}
                      </Text>
                    ) : null}

                    <Text
                      style={
                        styles.summaryMeta
                      }
                    >
                      {item.paymentMode ===
                      "buy"
                        ? formatPrice(
                            item.unitPrice
                          )
                        : `${formatPrice(
                            item.monthlyPrice
                          )}${text.perMonth}`}
                    </Text>
                  </View>
                )
              )}

              <View
                style={
                  styles.divider
                }
              />

              {totalBuyNow > 0 ? (
                <>
                  <View
                    style={
                      styles.summaryPriceRow
                    }
                  >
                    <Text
                      style={
                        styles.summaryPriceLabel
                      }
                    >
                      {text.subtotal}
                    </Text>

                    <Text
                      style={
                        styles.summaryPriceValue
                      }
                    >
                      {formatPrice(
                        totalBuyNow
                      )}
                    </Text>
                  </View>

                  {hasShippingDestination ? (
                    <View
                      style={
                        styles.summaryPriceRow
                      }
                    >
                      <View
                        style={
                          styles.summaryPriceLabelColumn
                        }
                      >
                        <Text
                          style={
                            styles.summaryPriceLabel
                          }
                        >
                          {
                            text.shipping
                          }
                        </Text>

                        <Text
                          style={
                            styles.shippingDestination
                          }
                        >
                          {
                            selectedCountryDisplay
                          }
                        </Text>
                      </View>

                      <Text
                        style={
                          styles.summaryPriceValue
                        }
                      >
                        {formatPrice(
                          shippingPrice
                        )}
                      </Text>
                    </View>
                  ) : (
                    <Text
                      style={
                        styles.shippingPending
                      }
                    >
                      {
                        text.shippingPending
                      }
                    </Text>
                  )}

                  <View
                    style={
                      styles.totalDivider
                    }
                  />

                  <View
                    style={
                      styles.summaryPriceRow
                    }
                  >
                    <Text
                      style={
                        styles.totalLabel
                      }
                    >
                      {
                        text.totalWithShipping
                      }
                    </Text>

                    <Text
                      style={
                        styles.price
                      }
                    >
                      {formatPrice(
                        finalOneTimeDisplayTotal
                      )}
                    </Text>
                  </View>
                </>
              ) : null}

              {monthlyDisplayTotal >
              0 ? (
                <>
                  <Text
                    style={
                      styles.monthlyTotal
                    }
                  >
                    {formatPrice(
                      monthlyDisplayTotal
                    )}
                    {text.perMonth}
                  </Text>

                  <Text
                    style={
                      styles.priceSub
                    }
                  >
                    {
                      text.monthlyTotal
                    }
                  </Text>
                </>
              ) : null}
            </>
          ) : (
            <>
              <Text
                style={
                  styles.summaryName
                }
              >
                {selectedPhone.name}
              </Text>

              <Text
                style={
                  styles.summaryMeta
                }
              >
                {
                  selectedStorage.label
                }{" "}
                ·{" "}
                {
                  selectedColorDisplayName
                }
              </Text>

              <View
                style={
                  styles.divider
                }
              />

              {paymentMode ===
              "buy" ? (
                <>
                  <View
                    style={
                      styles.summaryPriceRow
                    }
                  >
                    <Text
                      style={
                        styles.summaryPriceLabel
                      }
                    >
                      {text.subtotal}
                    </Text>

                    <Text
                      style={
                        styles.summaryPriceValue
                      }
                    >
                      {formatPrice(
                        unitPrice
                      )}
                    </Text>
                  </View>

                  {hasShippingDestination ? (
                    <View
                      style={
                        styles.summaryPriceRow
                      }
                    >
                      <View
                        style={
                          styles.summaryPriceLabelColumn
                        }
                      >
                        <Text
                          style={
                            styles.summaryPriceLabel
                          }
                        >
                          {
                            text.shipping
                          }
                        </Text>

                        <Text
                          style={
                            styles.shippingDestination
                          }
                        >
                          {
                            selectedCountryDisplay
                          }
                        </Text>
                      </View>

                      <Text
                        style={
                          styles.summaryPriceValue
                        }
                      >
                        {formatPrice(
                          shippingPrice
                        )}
                      </Text>
                    </View>
                  ) : (
                    <Text
                      style={
                        styles.shippingPending
                      }
                    >
                      {
                        text.shippingPending
                      }
                    </Text>
                  )}

                  <View
                    style={
                      styles.totalDivider
                    }
                  />

                  <View
                    style={
                      styles.summaryPriceRow
                    }
                  >
                    <Text
                      style={
                        styles.totalLabel
                      }
                    >
                      {
                        text.totalWithShipping
                      }
                    </Text>

                    <Text
                      style={
                        styles.price
                      }
                    >
                      {formatPrice(
                        finalOneTimeDisplayTotal
                      )}
                    </Text>
                  </View>
                </>
              ) : (
                <>
                  <Text
                    style={
                      styles.price
                    }
                  >
                    {formatPrice(
                      monthlyPrice
                    )}
                    {text.perMonth}
                  </Text>

                  <Text
                    style={
                      styles.priceSub
                    }
                  >
                    {paymentMode ===
                    "lease"
                      ? text.leaseRequest
                      : text.monthlyPayments(
                          months
                        )}
                  </Text>
                </>
              )}
            </>
          )}
        </View>
      </View>

      <View
        style={[
          styles.paymentSection,
          isMobile &&
            styles.paymentSectionMobile,
        ]}
      >
        <View
          style={[
            styles.paymentHeading,
            isMobile &&
              styles.paymentHeadingMobile,
          ]}
        >
          <Text
            style={[
              styles.paymentTitle,
              isMobile &&
                styles.paymentTitleMobile,
            ]}
          >
            {paymentQuestion}
          </Text>

          <Text
            style={[
              styles.paymentDescription,
              isMobile &&
                styles.paymentDescriptionMobile,
            ]}
          >
            {
              text.paymentDescription
            }
          </Text>

          <Text
            style={[
              styles.paymentCurrencyNotice,
              isMobile &&
                styles.paymentCurrencyNoticeMobile,
            ]}
          >
            {text.paymentCurrencyNotice}
          </Text>
        </View>

        <Pressable
          onPress={() =>
            selectPaymentMethod(
              "card"
            )
          }
          style={[
            styles.paymentOption,
            isMobile &&
              styles.paymentOptionMobile,

            selectedPaymentMethod ===
              "card" &&
              styles.paymentOptionActive,
          ]}
        >
          <View
            style={[
              styles.paymentLogoBox,
              isMobile &&
                styles.paymentLogoBoxMobile,
            ]}
          >
            <Text
              style={
                styles.cardBrandVisa
              }
            >
              VISA
            </Text>

            <Text
              style={
                styles.cardBrandMastercard
              }
            >
              MC
            </Text>
          </View>

          <View
            style={
              styles.paymentOptionInfo
            }
          >
            <Text
              style={[
                styles.paymentOptionTitle,
                isMobile &&
                  styles.paymentOptionTitleMobile,
              ]}
            >
              {text.card}
            </Text>

            <Text
              style={[
                styles.paymentOptionDescription,
                isMobile &&
                  styles.paymentOptionDescriptionMobile,
              ]}
            >
              {
                text.cardDescription
              }
            </Text>
          </View>

          <View
            style={[
              styles.radio,

              selectedPaymentMethod ===
                "card" &&
                styles.radioActive,
            ]}
          >
            {selectedPaymentMethod ===
            "card" ? (
              <View
                style={
                  styles.radioDot
                }
              />
            ) : null}
          </View>
        </Pressable>

        <Pressable
          onPress={() =>
            selectPaymentMethod(
              "paypal"
            )
          }
          style={[
            styles.paymentOption,
            isMobile &&
              styles.paymentOptionMobile,

            selectedPaymentMethod ===
              "paypal" &&
              styles.paymentOptionActive,
          ]}
        >
          <View
            style={[
              styles.paymentLogoBox,
              isMobile &&
                styles.paymentLogoBoxMobile,
            ]}
          >
            <Text
              style={
                styles.paypalLogo
              }
            >
              PayPal
            </Text>
          </View>

          <View
            style={
              styles.paymentOptionInfo
            }
          >
            <Text
              style={[
                styles.paymentOptionTitle,
                isMobile &&
                  styles.paymentOptionTitleMobile,
              ]}
            >
              {text.paypal}
            </Text>

            <Text
              style={[
                styles.paymentOptionDescription,
                isMobile &&
                  styles.paymentOptionDescriptionMobile,
              ]}
            >
              {
                text.paypalDescription
              }
            </Text>
          </View>

          <View
            style={[
              styles.radio,

              selectedPaymentMethod ===
                "paypal" &&
                styles.radioActive,
            ]}
          >
            {selectedPaymentMethod ===
            "paypal" ? (
              <View
                style={
                  styles.radioDot
                }
              />
            ) : null}
          </View>
        </Pressable>

        {selectedPaymentMethod ===
        "paypal" ? (
          <View
            style={
              styles.paypalCheckoutBox
            }
          >
            {paypalProductId ? (
              <PayPalCheckout
                productId={
                  paypalProductId
                }
                variantId={
                  paypalVariantId
                }
                condition={
                  paypalCondition
                }
                quantity={
                  paypalQuantity
                }

                refurbishedGrade={
                  paypalRefurbishedGrade
                }

                batteryGrade={
                  paypalBatteryGrade
                }

                customerName={
                  customer.name
                }
                customerEmail={
                  customer.email
                }
                customerWhatsapp={
                  customer.whatsapp
                }

                country={
                  customer.country
                }
                stateRegion={
                  customer.stateRegion
                }
                city={
                  customer.city
                }
                street={
                  customer.street
                }
                houseNumber={
                  customer.houseNumber
                }
                addressLine2={
                  customer.addressLine2
                }
                postalCode={
                  customer.postalCode
                }

                notes={
                  customer.notes
                }

                language={
                  language
                }

                displayCurrency={
                  currency
                }

                onBeforeStart={() =>
                  validateCustomerDetails()
                }
                onSuccess={(
                  result:
                    PayPalCheckoutSuccessResult
                ) => {
                  console.log(
                    "POKAPOK PAYPAL PAYMENT COMPLETED:",
                    result
                  );

                  setSubmitError(
                    null
                  );

                  setCompletedPayPalOrder(
                    result
                  );

                  if (
                    cartHasItems
                  ) {
                    clearCart();
                  }
                }}
                onCancel={() => {
                  console.log(
                    "PayPal payment cancelled"
                  );
                }}
                onError={(
                  error: Error
                ) => {
                  console.error(
                    "PayPal checkout error:",
                    error
                  );

                  const message =
                    language ===
                      "pt"
                      ? "Não foi possível concluir o pagamento PayPal."
                      : "We could not complete the PayPal payment.";

                  setSubmitError(
                    message
                  );
                }}
              />
            ) : (
              <Text
                style={
                  styles.paypalErrorText
                }
              >
                {
                  text.missingDatabaseProduct
                }
              </Text>
            )}
          </View>
        ) : null}

        <Pressable
          onPress={() =>
            selectPaymentMethod(
              "bank_transfer"
            )
          }
          style={[
            styles.paymentOption,
            isMobile &&
              styles.paymentOptionMobile,

            selectedPaymentMethod ===
              "bank_transfer" &&
              styles.paymentOptionActive,
          ]}
        >
          <View
            style={[
              styles.paymentLogoBox,
              isMobile &&
                styles.paymentLogoBoxMobile,
            ]}
          >
            <Text
              style={
                styles.bankLogo
              }
            >
              BANK
            </Text>
          </View>

          <View
            style={
              styles.paymentOptionInfo
            }
          >
            <Text
              style={[
                styles.paymentOptionTitle,
                isMobile &&
                  styles.paymentOptionTitleMobile,
              ]}
            >
              {
                text.bankTransfer
              }
            </Text>

            <Text
              style={[
                styles.paymentOptionDescription,
                isMobile &&
                  styles.paymentOptionDescriptionMobile,
              ]}
            >
              {
                text.bankTransferDescription
              }
            </Text>
          </View>

          <View
            style={[
              styles.radio,

              selectedPaymentMethod ===
                "bank_transfer" &&
                styles.radioActive,
            ]}
          >
            {selectedPaymentMethod ===
            "bank_transfer" ? (
              <View
                style={
                  styles.radioDot
                }
              />
            ) : null}
          </View>
        </Pressable>

        <View
          style={[
            styles.paymentOption,
            isMobile &&
              styles.paymentOptionMobile,
            styles.paymentOptionDisabled,
          ]}
        >
          <View
            style={[
              styles.paymentLogoBox,
              isMobile &&
                styles.paymentLogoBoxMobile,
              styles.upayLogoBox,
            ]}
          >
            <Text
              style={
                styles.upayLogo
              }
            >
              UPAY
            </Text>
          </View>

          <View
            style={
              styles.paymentOptionInfo
            }
          >
            <View
              style={
                styles.upayTitleRow
              }
            >
              <Text
                style={
                  styles.paymentOptionTitle
                }
              >
                {text.upay}
              </Text>

              <View
                style={
                  styles.comingSoonBadge
                }
              >
                <Text
                  style={
                    styles.comingSoonText
                  }
                >
                  {
                    text.comingSoon
                  }
                </Text>
              </View>
            </View>

            <Text
              style={[
                styles.paymentOptionDescription,
                isMobile &&
                  styles.paymentOptionDescriptionMobile,
              ]}
            >
              {
                text.upayDescription
              }
            </Text>
          </View>

          <View
            style={
              styles.radioDisabled
            }
          />
        </View>

        <Text
          style={
            styles.paymentMicrocopy
          }
        >
          {text.securePayment}
        </Text>

        {submitError ? (
          <View
            style={
              styles.submitErrorBox
            }
          >
            <Text
              style={
                styles.submitErrorText
              }
            >
              {submitError}
            </Text>
          </View>
        ) : null}

        {selectedPaymentMethod !==
        "paypal" ? (
          <Pressable
            style={[
              styles.submitButton,

              isMobile &&
                styles.submitButtonMobile,

              submitting &&
                styles.submitButtonDisabled,
            ]}
            onPress={
              submitRequest
            }
            disabled={
              submitting
            }
          >
            <Text
              style={
                styles.submitButtonText
              }
            >
              {submitting
                ? text.creatingOrder
                : text.submitOrder}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </ScrollView>
  );
}

/* =========================================================
   STYLES
========================================================= */

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F5F5F3",
  },

  content: {
    width: "100%",
    maxWidth: 1180,
    alignSelf: "center",
    paddingHorizontal: 22,
    paddingBottom: 72,
  },

  contentMobile: {
    paddingHorizontal: 12,
    paddingBottom: 34,
  },

  header: {
    paddingTop: 22,
    paddingBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  headerMobile: {
    paddingTop: 54,
    paddingBottom: 10,
    paddingHorizontal: 4,
  },

  back: {
    color: colors.ink70,
    fontWeight: "900",
  },

  backMobile: {
    fontSize: 13,
  },

  logo: {
    color: colors.blue,
    fontWeight: "900",
    letterSpacing: 2,
  },

  logoMobile: {
    fontSize: 14,
    letterSpacing: 2.4,
  },

  hero: {
    backgroundColor: colors.white,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: colors.ink12,
    padding: 30,
    marginBottom: 22,
  },

  heroMobile: {
    borderRadius: 22,
    padding: 16,
    marginBottom: 12,
  },

  kicker: {
    color: colors.blue,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 2,
    marginBottom: 12,
  },

  kickerMobile: {
    fontSize: 9,
    letterSpacing: 1.6,
    marginBottom: 5,
  },

  title: {
    color: colors.ink,
    fontSize: 46,
    lineHeight: 50,
    fontWeight: "900",
    letterSpacing: -1.6,
  },

  titleMobile: {
    fontSize: 28,
    lineHeight: 31,
    letterSpacing: -0.9,
  },

  text: {
    marginTop: 12,
    color: colors.ink70,
    fontSize: 18,
    lineHeight: 28,
    maxWidth: 720,
  },

  textMobile: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
  },

  page: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 22,
    marginBottom: 22,
  },

  pageMobile: {
    flexDirection: "column",
    flexWrap: "nowrap",
    gap: 12,
    marginBottom: 12,
  },

  formBox: {
    flexGrow: 1,
    flexBasis: 620,
    backgroundColor: colors.white,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: colors.ink12,
    padding: 24,
    gap: 10,
  },

  formBoxMobile: {
    flexGrow: 0,
    flexBasis: "auto",
    borderRadius: 22,
    padding: 14,
    gap: 7,
  },

  sectionTitle: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: "900",
    marginTop: 8,
    marginBottom: 8,
  },

  sectionTitleMobile: {
    fontSize: 18,
    marginTop: 4,
    marginBottom: 5,
  },

  sectionSpacing: {
    marginTop: 24,
  },

  sectionSpacingMobile: {
    marginTop: 14,
  },

  sectionDescription: {
    marginTop: -4,
    marginBottom: 8,
    color: colors.ink70,
    fontSize: 14,
    lineHeight: 21,
  },

  sectionDescriptionMobile: {
    marginTop: -2,
    marginBottom: 5,
    fontSize: 12,
    lineHeight: 17,
  },

  selectedCard: {
    backgroundColor: colors.bg,
    borderRadius: 24,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },

  selectedCardMobile: {
    borderRadius: 18,
    padding: 10,
    gap: 10,
    minHeight: 100,
  },

  phonePreview: {
    width: 72,
    height: 132,
    borderRadius: 22,
    backgroundColor: "#DFE4EE",
    padding: 6,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  phonePreviewMobile: {
    width: 74,
    height: 92,
    borderRadius: 16,
    padding: 4,
  },

  phoneImage: {
    width: "100%",
    height: "100%",
  },

  phoneScreen: {
    flex: 1,
    width: "100%",
    borderRadius: 17,
    backgroundColor: colors.blue,
  },

  selectedInfo: {
    flex: 1,
    minWidth: 0,
  },

  brand: {
    color: colors.blue,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.5,
  },

  phoneName: {
    color: colors.ink,
    fontSize: 23,
    fontWeight: "900",
    marginTop: 4,
    flexShrink: 1,
  },

  phoneNameMobile: {
    fontSize: 17,
    lineHeight: 20,
  },

  phoneMeta: {
    color: colors.ink70,
    marginTop: 4,
  },

  phoneMetaMobile: {
    fontSize: 11,
    lineHeight: 15,
  },

  label: {
    color: colors.ink40,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.2,
    marginTop: 12,
    textTransform: "uppercase",
  },

  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  choice: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.ink12,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },

  colorChoice: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.ink12,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  choiceActive: {
    backgroundColor: colors.blueLt,
    borderColor: colors.blue,
  },

  choiceText: {
    color: colors.ink,
    fontWeight: "900",
  },

  colorDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: colors.ink12,
  },

  insurance: {
    marginTop: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.ink12,
  },

  insuranceActive: {
    backgroundColor: colors.blueLt,
    borderColor: colors.blue,
  },

  insuranceTitle: {
    color: colors.ink,
    fontWeight: "900",
  },

  insuranceText: {
    color: colors.ink70,
    marginTop: 4,
  },

  cartNotice: {
    marginTop: 12,
    padding: 16,
    borderRadius: 18,
    backgroundColor: colors.blueLt,
    borderWidth: 1,
    borderColor: colors.blue,
  },

  cartNoticeMobile: {
    marginTop: 7,
    padding: 10,
    borderRadius: 14,
  },

  cartNoticeTitle: {
    color: colors.ink,
    fontWeight: "900",
    fontSize: 16,
  },

  cartNoticeTitleMobile: {
    fontSize: 12,
    lineHeight: 16,
  },

  cartNoticeText: {
    color: colors.ink70,
    marginTop: 5,
    lineHeight: 20,
  },

  cartNoticeTextMobile: {
    fontSize: 10,
    lineHeight: 14,
    marginTop: 3,
  },

  input: {
    minHeight: 54,
    borderRadius: 16,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.ink12,
    paddingHorizontal: 15,
    color: colors.ink,
    fontSize: 16,
    outlineStyle: "none" as any,
  },

  inputMobile: {
    minHeight: 46,
    borderRadius: 13,
    fontSize: 14,
    paddingHorizontal: 13,
  },

  inputRow: {
    width: "100%",
    flexDirection: "row",
    gap: 10,
  },

  inputRowMobile: {
    flexDirection: "column",
    gap: 7,
  },

  inputHalf: {
    flex: 1,
    minWidth: 0,
  },

  inputHalfMobile: {
    width: "100%",
    flex: 0,
  },

  inputWide: {
    flex: 2,
    minWidth: 0,
  },

  inputNarrow: {
    flex: 1,
    minWidth: 150,
  },

  inputDisabled: {
    opacity: 0.5,
  },

  dropdownRow: {
    position: "relative",
    zIndex: 40,
  },

  dropdownWrapper: {
    position: "relative",
    zIndex: 40,
  },

  dropdownWrapperOpen: {
    zIndex: 999,
  },

  dropdownButton: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  dropdownButtonText: {
    flex: 1,
    color: colors.ink,
    fontSize: 16,
  },

  dropdownPlaceholder: {
    flex: 1,
    color: colors.ink40,
    fontSize: 16,
  },

  dropdownArrow: {
    marginLeft: 10,
    color: colors.ink40,
    fontSize: 16,
    lineHeight: 18,
  },

  dropdownArrowOpen: {
    transform: [
      {
        rotate: "180deg",
      },
    ],
  },

  dropdownMenu: {
    position: "absolute",
    top: 60,
    left: 0,
    right: 0,
    maxHeight: 280,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.ink12,
    borderRadius: 16,
    zIndex: 9999,

    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 6,
    },
  },

  dropdownMenuMobile: {
    top: 51,
    maxHeight: 240,
    borderRadius: 14,
  },

  dropdownItem: {
    minHeight: 48,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.ink12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  dropdownItemActive: {
    backgroundColor: colors.blueLt,
  },

  dropdownItemText: {
    flex: 1,
    color: colors.ink,
    fontSize: 14,
    fontWeight: "700",
  },

  dropdownItemTextActive: {
    color: colors.blue,
    fontWeight: "900",
  },

  dropdownCheck: {
    marginLeft: 12,
    color: colors.blue,
    fontSize: 15,
    fontWeight: "900",
  },

  notes: {
    minHeight: 90,
    paddingTop: 14,
  },

  notesMobile: {
    minHeight: 70,
    paddingTop: 12,
  },

  summaryBox: {
    flexGrow: 1,
    flexBasis: 300,
    backgroundColor: colors.ink,
    borderRadius: 30,
    padding: 24,
    alignSelf: "flex-start",
  },

  summaryBoxMobile: {
    flexGrow: 0,
    flexBasis: "auto",
    width: "100%",
    alignSelf: "stretch",
    borderRadius: 22,
    padding: 16,
  },

  summaryTitle: {
    color: colors.white,
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 18,
  },

  summaryTitleMobile: {
    fontSize: 19,
    marginBottom: 10,
  },

  summaryItem: {
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },

  summaryName: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "900",
  },

  summaryMeta: {
    color: "rgba(255,255,255,0.62)",
    marginTop: 3,
    fontSize: 12,
  },

  summaryPriceRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    paddingVertical: 6,
  },

  summaryPriceLabelColumn: {
    flex: 1,
  },

  summaryPriceLabel: {
    color: "rgba(255,255,255,0.68)",
    fontSize: 12,
    fontWeight: "700",
  },

  summaryPriceValue: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "900",
  },

  shippingDestination: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 10,
    marginTop: 2,
  },

  shippingPending: {
    color: "rgba(255,255,255,0.52)",
    fontSize: 11,
    lineHeight: 16,
    paddingVertical: 7,
  },

  totalDivider: {
    width: "100%",
    height: 1,
    backgroundColor:
      "rgba(255,255,255,0.14)",
    marginVertical: 8,
  },

  totalLabel: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "900",
  },

  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.12)",
    marginVertical: 12,
  },

  price: {
    color: colors.white,
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: -1,
  },

  monthlyTotal: {
    color: colors.white,
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: -0.8,
    marginTop: 12,
  },

  priceSub: {
    color: "rgba(255,255,255,0.6)",
    marginTop: 3,
    fontSize: 11,
  },

  paymentSection: {
    backgroundColor: colors.white,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: colors.ink12,
    padding: 28,
  },

  paymentSectionMobile: {
    borderRadius: 22,
    padding: 14,
  },

  paymentHeading: {
    marginBottom: 22,
  },

  paymentHeadingMobile: {
    marginBottom: 12,
  },

  paymentTitle: {
    color: colors.ink,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "900",
    letterSpacing: -0.7,
  },

  paymentTitleMobile: {
    fontSize: 21,
    lineHeight: 25,
    letterSpacing: -0.4,
  },

  paymentDescription: {
    color: colors.ink70,
    fontSize: 16,
    lineHeight: 24,
    marginTop: 7,
  },

  paymentDescriptionMobile: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },

  paymentCurrencyNotice: {
    color: colors.ink40,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8,
    maxWidth: 720,
  },

  paymentCurrencyNoticeMobile: {
    fontSize: 10,
    lineHeight: 14,
    marginTop: 6,
  },

  paymentOption: {
    minHeight: 94,
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    paddingHorizontal: 20,
    paddingVertical: 15,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 18,

    shadowColor: "#000",
    shadowOpacity: 0.035,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 3,
    },
  },

  paymentOptionMobile: {
    minHeight: 68,
    borderRadius: 17,
    paddingHorizontal: 10,
    paddingVertical: 9,
    marginBottom: 8,
    gap: 10,
  },

  paymentOptionActive: {
    borderWidth: 2,
    borderColor: colors.blue,
    backgroundColor: "#FAFCFF",
  },

  paymentOptionDisabled: {
    opacity: 0.5,
    backgroundColor: "#F7F7F7",
  },

  paymentLogoBox: {
    width: 92,
    minHeight: 58,
    borderRadius: 16,
    backgroundColor: "#F6F6F6",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },

  paymentLogoBoxMobile: {
    width: 62,
    minHeight: 46,
    borderRadius: 13,
    paddingHorizontal: 5,
  },

  paymentOptionInfo: {
    flex: 1,
    minWidth: 0,
  },

  paymentOptionTitle: {
    color: colors.ink,
    fontSize: 19,
    fontWeight: "900",
  },

  paymentOptionTitleMobile: {
    fontSize: 14,
    lineHeight: 18,
  },

  paymentOptionDescription: {
    color: colors.ink70,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },

  paymentOptionDescriptionMobile: {
    fontSize: 10,
    lineHeight: 14,
    marginTop: 2,
  },

  cardBrandVisa: {
    color: "#163D9B",
    fontSize: 17,
    fontWeight: "900",
    fontStyle: "italic",
  },

  cardBrandMastercard: {
    color: "#D94B26",
    fontSize: 11,
    fontWeight: "900",
    marginTop: 2,
  },

  paypalLogo: {
    color: "#173B76",
    fontSize: 17,
    fontWeight: "900",
  },

  paypalCheckoutBox: {
    width: "100%",
    marginTop: 4,
    marginBottom: 12,
    padding: 14,
    borderRadius: 18,
    backgroundColor: "#FAFCFF",
    borderWidth: 1,
    borderColor: colors.ink12,
  },

  paypalErrorText: {
    color: "#9B1C1C",
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "700",
  },

  bankLogo: {
    color: colors.blue,
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 1,
  },

  upayLogoBox: {
    backgroundColor: colors.ink,
  },

  upayLogo: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 1.5,
  },

  upayTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 9,
  },

  comingSoonBadge: {
    backgroundColor: colors.ink,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },

  comingSoonText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#C8C8C8",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  radioActive: {
    borderColor: colors.blue,
  },

  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.blue,
  },

  radioDisabled: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#D8D8D8",
    flexShrink: 0,
  },

  paymentMicrocopy: {
    color: colors.ink40,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 8,
    maxWidth: 700,
  },

  submitButton: {
    backgroundColor: colors.blue,
    minHeight: 56,
    borderRadius: 18,
    paddingHorizontal: 22,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 22,
  },

  submitButtonMobile: {
    minHeight: 52,
    borderRadius: 15,
    marginTop: 14,
    paddingVertical: 13,
  },

  submitButtonDisabled: {
    opacity: 0.55,
  },

  submitErrorBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "#FFF2F2",
    borderWidth: 1,
    borderColor: "#F2CACA",
  },

  submitErrorText: {
    color: "#9B1C1C",
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "700",
  },

  submitButtonText: {
    color: colors.white,
    fontWeight: "900",
    fontSize: 15,
  },

  successBox: {
    backgroundColor: colors.white,
    borderRadius: 34,
    borderWidth: 1,
    borderColor: colors.ink12,
    padding: 34,
  },

  successBoxMobile: {
    borderRadius: 22,
    padding: 16,
  },

  successKicker: {
    color: colors.good,
    fontWeight: "900",
    letterSpacing: 2,
    fontSize: 12,
    marginBottom: 12,
  },

  successTitle: {
    color: colors.ink,
    fontSize: 46,
    lineHeight: 50,
    fontWeight: "900",
    letterSpacing: -1.5,
  },

  successTitleMobile: {
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: -0.8,
  },

  successText: {
    color: colors.ink70,
    fontSize: 18,
    lineHeight: 28,
    marginTop: 12,
    maxWidth: 700,
  },

  successTextMobile: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 7,
  },

  successStatusBadge: {
    alignSelf: "flex-start",
    marginTop: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#FFF7E8",
    borderWidth: 1,
    borderColor: "#F3D8A4",
  },

  successStatusText: {
    color: "#8A5A00",
    fontWeight: "900",
    fontSize: 10,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },

  successGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 20,
  },

  successGridMobile: {
    flexDirection: "column",
    gap: 8,
    marginTop: 14,
  },

  successInfoCard: {
    flexGrow: 1,
    flexBasis: 240,
    padding: 18,
    borderRadius: 18,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.ink12,
  },

  successInfoCardMobile: {
    flexGrow: 0,
    flexBasis: "auto",
    padding: 12,
    borderRadius: 14,
  },

  successInfoLabel: {
    color: colors.ink40,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
    textTransform: "uppercase",
  },

  successInfoValue: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "900",
    marginTop: 5,
  },

  successAmount: {
    color: colors.ink,
    fontSize: 24,
    fontWeight: "900",
    marginTop: 4,
    letterSpacing: -0.7,
  },

  successInfoHelper: {
    color: colors.ink40,
    fontSize: 11,
    fontWeight: "700",
    marginTop: 7,
  },

  referenceBox: {
    marginTop: 16,
    padding: 20,
    borderRadius: 20,
    backgroundColor: colors.ink,
  },

  referenceBoxMobile: {
    marginTop: 10,
    padding: 14,
    borderRadius: 16,
  },

  referenceLabel: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
    textTransform: "uppercase",
  },

  referenceValue: {
    color: colors.white,
    fontSize: 21,
    lineHeight: 27,
    fontWeight: "900",
    letterSpacing: 1,
    marginTop: 6,
  },

  referenceHelp: {
    color: "rgba(255,255,255,0.68)",
    fontSize: 11,
    lineHeight: 16,
    marginTop: 6,
  },

  bankDetailsBox: {
    marginTop: 16,
    padding: 22,
    borderRadius: 22,
    backgroundColor: "#FAFAF8",
    borderWidth: 1,
    borderColor: colors.ink12,
  },

  bankDetailsBoxMobile: {
    marginTop: 10,
    padding: 14,
    borderRadius: 16,
  },

  bankDetailsTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "900",
  },

  bankDetailsText: {
    color: colors.ink70,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 5,
    marginBottom: 5,
  },

  bankDetailRow: {
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.ink12,
  },

  bankDetailLabel: {
    color: colors.ink40,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },

  bankDetailValue: {
    color: colors.ink,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "700",
    marginTop: 4,
  },

  bankDetailValueStrong: {
    color: colors.ink,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "900",
    marginTop: 4,
  },

  emailNotice: {
    marginTop: 10,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "#EFFAF2",
    borderWidth: 1,
    borderColor: "#CBE8D1",
  },

  emailNoticeWarning: {
    backgroundColor: "#FFF7E8",
    borderColor: "#F3D8A4",
  },

  emailNoticeText: {
    color: colors.ink70,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "700",
  },

  primaryButton: {
    backgroundColor: colors.ink,
    paddingHorizontal: 22,
    paddingVertical: 15,
    borderRadius: 18,
    alignSelf: "flex-start",
    marginTop: 20,
  },

  primaryButtonMobile: {
    width: "100%",
    alignSelf: "stretch",
    alignItems: "center",
    borderRadius: 15,
    marginTop: 14,
    paddingVertical: 13,
  },

  primaryButtonText: {
    color: colors.white,
    fontWeight: "900",
  },

  emptyBox: {
    backgroundColor: colors.white,
    borderRadius: 34,
    borderWidth: 1,
    borderColor: colors.ink12,
    padding: 34,
  },

  emptyBoxMobile: {
    borderRadius: 22,
    padding: 18,
  },

  emptyKicker: {
    color: colors.blue,
    fontWeight: "900",
    letterSpacing: 2,
    fontSize: 12,
    marginBottom: 12,
  },

  emptyTitle: {
    color: colors.ink,
    fontSize: 46,
    lineHeight: 50,
    fontWeight: "900",
    letterSpacing: -1.5,
  },

  emptyTitleMobile: {
    fontSize: 27,
    lineHeight: 31,
    letterSpacing: -0.8,
  },

  emptyText: {
    color: colors.ink70,
    fontSize: 18,
    lineHeight: 28,
    marginTop: 12,
    maxWidth: 700,
  },

  emptyTextMobile: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 7,
  },

  paypalPaidBadge: {
    alignSelf:
      "flex-start",

    marginTop:
      14,

    paddingHorizontal:
      11,

    paddingVertical:
      6,

    borderRadius:
      999,

    backgroundColor:
      "#EFFAF2",

    borderWidth:
      1,

    borderColor:
      "#CBE8D1",
  },

  paypalPaidBadgeText: {
    color:
      "#147A36",

    fontWeight:
      "900",

    fontSize:
      10,

    letterSpacing:
      0.6,

    textTransform:
      "uppercase",
  },

  paypalPaymentSummary: {
    marginTop:
      16,

    padding:
      20,

    borderRadius:
      20,

    backgroundColor:
      "#FAFAF8",

    borderWidth:
      1,

    borderColor:
      colors.ink12,
  },

  paypalPaymentSummaryRow: {
    width:
      "100%",

    flexDirection:
      "row",

    alignItems:
      "center",

    justifyContent:
      "space-between",

    gap:
      16,

    paddingVertical:
      7,
  },

  paypalPaymentSummaryLabel: {
    color:
      colors.ink70,

    fontSize:
      13,

    fontWeight:
      "700",
  },

  paypalPaymentSummaryValue: {
    color:
      colors.ink,

    fontSize:
      14,

    fontWeight:
      "900",
  },

  paypalPaymentSummaryDivider: {
    width:
      "100%",

    height:
      1,

    backgroundColor:
      colors.ink12,

    marginVertical:
      8,
  },

  paypalPaymentSummaryTotalLabel: {
    color:
      colors.ink,

    fontSize:
      15,

    fontWeight:
      "900",
  },

  paypalPaymentSummaryTotalValue: {
    color:
      colors.ink,

    fontSize:
      21,

    fontWeight:
      "900",

    letterSpacing:
      -0.5,
  },

  paypalProcessingBox: {
    marginTop:
      16,

    padding:
      18,

    borderRadius:
      18,

    backgroundColor:
      colors.blueLt,

    borderWidth:
      1,

    borderColor:
      colors.blue,
  },

  paypalProcessingTitle: {
    color:
      colors.blue,

    fontSize:
      13,

    fontWeight:
      "900",

    textTransform:
      "uppercase",

    letterSpacing:
      0.7,
  },

  paypalProcessingText: {
    color:
      colors.ink70,

    fontSize:
      12,

    lineHeight:
      18,

    marginTop:
      5,
  },

  paypalWarningText: {
    color:
      "#8A5A00",

    fontSize:
      10,

    lineHeight:
      15,

    marginTop:
      5,
  },
});