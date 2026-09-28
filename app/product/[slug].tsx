import { Link, router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";

import CurrencySwitcher from "../../src/components/ui/CurrencySwitcher";
import { useCart } from "../../src/context/CartContext";
import { useCurrency } from "../../src/context/CurrencyStore";
import { useLanguage } from "../../src/context/LanguageContext";

import {
  findProductVariant,
  getColorImage,
  getDefaultSellCondition,
  getProductColors,
  getProductSellConditions,
  getPublicProductBySlug,
  getPublicProductSpecifications,
  getPublicProductVariants,
  getPublicVariantRefurbishedGradeNormalPrice,
  getPublicVariantRefurbishedGradePrice,
  getStorageOptionsForColor,
  tryGetPublicVariantNormalPriceByCondition,
  tryGetPublicVariantPriceByCondition,
  type PublicProduct,
  type PublicProductColor,
  type PublicProductSpecification,
  type PublicProductStorage,
  type PublicProductVariant,
  type PublicRefurbishedGrade,
  type PublicSellCondition,
} from "../../src/services/productService";

import { colors } from "../../src/theme/colors";

import type {
  PaymentMode,
  Phone,
  PhoneBrand,
  PhoneCondition,
} from "../../src/types/phone";


/* =========================================================
   TYPES
========================================================= */

type RefurbishedGrade =
  PublicRefurbishedGrade;

type BatteryGrade =
  | "optimal"
  | "new";

type PracticalInfoKey =
  | "shipping"
  | "insurance"
  | "guarantee";

/* =========================================================
   REFURBISHED OPTIONS

   Cosmetic-grade pricing is loaded directly from Supabase
   product_variants through productService.

   No refurbished grade price is calculated locally.
========================================================= */

const refurbishedGrades: Array<{
  id: RefurbishedGrade;
  popular?: boolean;
}> = [
  {
    id: "correct",
  },
  {
    id: "good",
  },
  {
    id: "excellent",
    popular: true,
  },
  {
    id: "premium",
  },
];

const batteryGrades: Array<{
  id: BatteryGrade;
  priceIncrease: number;
  popular?: boolean;
}> = [
  {
    id: "optimal",
    priceIncrease: 0,
    popular: true,
  },
  {
    id: "new",
    priceIncrease: 89,
  },
];

/* =========================================================
   HELPERS
========================================================= */

function normalize(
  value: string | null | undefined
) {
  return (value ?? "")
    .trim()
    .toLowerCase();
}

function safeMoney(
  value: number
) {
  return (
    Math.round(
      (value + Number.EPSILON) *
        100
    ) / 100
  );
}

function resolvePhoneBrand(
  brand: string
): PhoneBrand {
  const normalizedBrand =
    normalize(brand);

  if (
    normalizedBrand ===
    "apple"
  ) {
    return "apple";
  }

  if (
    normalizedBrand ===
    "samsung"
  ) {
    return "samsung";
  }

  if (
    normalizedBrand ===
    "xiaomi"
  ) {
    return "xiaomi";
  }

  if (
    normalizedBrand ===
    "nothing"
  ) {
    return "nothing";
  }

  /*
   * Legacy Phone type does not currently support
   * arbitrary brands.
   */
  return "xiaomi";
}

function getSpecificationValue(
  specifications:
    PublicProductSpecification[],
  name: string
) {
  return (
    specifications.find(
      (specification) =>
        normalize(
          specification.name
        ) ===
        normalize(name)
    )?.value ?? null
  );
}

function mapPublicConditionToPhoneCondition(
  condition: PublicSellCondition
): PhoneCondition {
  return condition as PhoneCondition;
}

/* =========================================================
   SCREEN
========================================================= */

export default function ProductScreen() {
  const {
    language,
  } = useLanguage();

  const {
    formatPrice,
  } = useCurrency(
    language
  );

  const {
    width,
  } = useWindowDimensions();

  const isMobile =
    width < 720;

  const params =
    useLocalSearchParams<{
      slug?: string | string[];
    }>();

  const slug =
    Array.isArray(params.slug)
      ? params.slug[0]
      : params.slug;

  const {
    addItem,
  } = useCart();

  /* =======================================================
     SUPABASE STATE
  ======================================================= */

  const [
    product,
    setProduct,
  ] =
    useState<
      PublicProduct | null
    >(null);

  const [
    variants,
    setVariants,
  ] =
    useState<
      PublicProductVariant[]
    >([]);

  const [
    specifications,
    setSpecifications,
  ] =
    useState<
      PublicProductSpecification[]
    >([]);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    loadError,
    setLoadError,
  ] =
    useState<
      string | null
    >(null);

  const [
    imageError,
    setImageError,
  ] =
    useState(false);

  /* =======================================================
     CONFIGURATION
  ======================================================= */

  const [
    selectedColorName,
    setSelectedColorName,
  ] =
    useState("");

  const [
    selectedStorageLabel,
    setSelectedStorageLabel,
  ] =
    useState("");

  const [
    selectedCondition,
    setSelectedCondition,
  ] =
    useState<PublicSellCondition>(
      "new"
    );

  const [
    refurbishedGrade,
    setRefurbishedGrade,
  ] =
    useState<RefurbishedGrade>(
      "excellent"
    );

  const [
    batteryGrade,
    setBatteryGrade,
  ] =
    useState<BatteryGrade>(
      "optimal"
    );

  const [
    paymentMode,
    setPaymentMode,
  ] =
    useState<PaymentMode>(
      "buy"
    );

  const [
    months,
  ] =
    useState(36);

  const [
    insurance,
    setInsurance,
  ] =
    useState(false);

  const [
    addedToCart,
    setAddedToCart,
  ] =
    useState(false);

  const [
    leaseEmail,
    setLeaseEmail,
  ] =
    useState("");

  const [
    leaseSubmitted,
    setLeaseSubmitted,
  ] =
    useState(false);

  const [
    showSpecifications,
    setShowSpecifications,
  ] =
    useState(false);

  const [
    openPracticalInfo,
    setOpenPracticalInfo,
  ] =
    useState<
      PracticalInfoKey | null
    >(null);

  /* =======================================================
     LOCALIZED TEXT
  ======================================================= */

  const text =
    language === "pt"
      ? {
          loading:
            "A carregar produto...",

          productUnavailable:
            "Produto indisponível.",

          productNotFound:
            "Produto não encontrado.",

          loadError:
            "Não foi possível carregar este produto.",

          backToCatalog:
            "Voltar ao catálogo",

          promotion:
            "PROMOÇÃO",

          inStock:
            "Em stock",

          outOfStock:
            "Indisponível",

          condition:
            "Condição",

          new:
            "Novo",

          used:
            "Usado",

          refurbished:
            "Recondicionado",

          brandNewDevice:
            "Equipamento novo",

          refurbishedDevice:
            "Equipamento verificado · preço mais baixo",

          professionallyChecked:
            "Verificado profissionalmente",

          professionallyCheckedDescription:
            "Todos os equipamentos são testados antes do envio. Escolha a condição estética e a opção de bateria.",

          cosmeticCondition:
            "Condição estética",

          battery:
            "Bateria",

          popular:
            "Popular",

          included:
            "Incluído",

          color:
            "Cor",

          storage:
            "Armazenamento",

          unavailable:
            "Indisponível",

          payment:
            "Pagamento",

          buyNow:
            "Comprar",

          lease:
            "Leasing",

          financing:
            "Financiamento",

          protectionInsurance:
            "Seguro de proteção",

          perMonth:
            "/mês",

          perYear:
            "/ano",

          oneTime:
            "pagamento único",

          insuranceAvailable:
            "Seguro disponível",

          deductible:
            "Franquia",

          specifications:
            "Especificações",

          warranty:
            "Garantia",

          practicalInformation:
            "Informação prática",

          shippingInformation:
            "Envio e entrega",

          shippingSummary:
            "Acompanhamento da encomenda e custos apresentados no checkout.",

          shippingPointOne:
            "A encomenda é preparada após a confirmação do pagamento.",

          shippingPointTwo:
            "Recebe os dados de acompanhamento assim que a encomenda for expedida.",

          shippingPointThree:
            "O prazo estimado e o custo final de envio são apresentados no checkout.",

          insuranceInfo:
            "Seguro de proteção",

          insuranceCancelAnytime:
            "Cancelável a qualquer momento",

          insuranceOptional:
            "Proteção opcional contra danos acidentais.",

          insuranceCovers:
            "O que cobre",

          insuranceNotCovered:
            "Não inclui",

          insuranceCoverDrop:
            "Ecrã ou vidro traseiro partido após queda ou impacto acidental.",

          insuranceCoverLiquid:
            "Danos acidentais por líquidos, incluindo água, café ou outras bebidas.",

          insuranceCoverComponents:
            "Danos acidentais na câmara, botões ou porta de carregamento causados por impacto ou líquido.",

          insuranceCoverPressure:
            "Danos acidentais por pressão ou esmagamento do equipamento.",

          insuranceExcludeTheft:
            "Roubo ou perda do equipamento.",

          insuranceExcludeCosmetic:
            "Riscos, amolgadelas ou danos apenas estéticos que não afetem o funcionamento.",

          insuranceExcludeWear:
            "Desgaste normal, degradação da bateria ou avarias causadas pelo uso normal.",

          insuranceExcludeIntentional:
            "Danos intencionais, pré-existentes ou causados por reparações não autorizadas.",

          deductiblePerClaim:
            "Franquia por sinistro aprovado",

          guaranteeInfo:
            "Garantia do equipamento",

          guaranteeNew:
            "2 anos para equipamentos novos",

          guaranteeRefurbished:
            "1 ano para equipamentos recondicionados",

          guaranteeCovers:
            "A garantia cobre defeitos funcionais e avarias em utilização normal. Danos acidentais, quedas e líquidos são tratados pelo seguro de proteção, quando contratado.",

          months:
            "meses",

          model:
            "Modelo",

          notSpecified:
            "Não especificado",

          leaseAvailable:
            "Leasing disponível",

          financingAvailable:
            "Financiamento disponível",

          deposit:
            "Entrada",

          leaseTerm:
            "meses de leasing",

          financingTerm:
            "meses",

          interestedInLeasing:
            "Interessado em leasing para",

          enterEmail:
            "Introduza o seu e-mail",

          emailSaved:
            "E-mail guardado",

          notifyMe:
            "Avisar-me",

          priceUnavailable:
            "Preço indisponível",

          device:
            "Equipamento",

          newBattery:
            "bateria nova",

          addedToCart:
            "Adicionado ao carrinho",

          addToCart:
            "Adicionar ao carrinho",

          goToCheckout:
            "Finalizar compra",

          default:
            "Padrão",

          smartphone:
            "Smartphone",

          batteryPrefix:
            "Bateria",
        }
      : {
          loading:
            "Loading product...",

          productUnavailable:
            "Product unavailable.",

          productNotFound:
            "Product not found.",

          loadError:
            "This product could not be loaded.",

          backToCatalog:
            "Back to catalog",

          promotion:
            "PROMOTION",

          inStock:
            "In stock",

          outOfStock:
            "Unavailable",

          condition:
            "Condition",

          new:
            "New",

          used:
            "Used",

          refurbished:
            "Refurbished",

          brandNewDevice:
            "Brand-new device",

          refurbishedDevice:
            "Checked device · lower price",

          professionallyChecked:
            "Professionally checked",

          professionallyCheckedDescription:
            "Every device is tested before dispatch. Choose your preferred cosmetic condition and battery option.",

          cosmeticCondition:
            "Cosmetic condition",

          battery:
            "Battery",

          popular:
            "Popular",

          included:
            "Included",

          color:
            "Color",

          storage:
            "Storage",

          unavailable:
            "Unavailable",

          payment:
            "Payment",

          buyNow:
            "Buy now",

          lease:
            "Lease",

          financing:
            "Financing",

          protectionInsurance:
            "Protection insurance",

          perMonth:
            "/month",

          perYear:
            "/year",

          oneTime:
            "one-time",

          insuranceAvailable:
            "Insurance available",

          deductible:
            "Deductible",

          specifications:
            "Specifications",

          warranty:
            "Warranty",

          practicalInformation:
            "Practical information",

          shippingInformation:
            "Shipping & delivery",

          shippingSummary:
            "Order tracking and final shipping costs are shown at checkout.",

          shippingPointOne:
            "Your order is prepared after payment confirmation.",

          shippingPointTwo:
            "Tracking details are sent as soon as your order is dispatched.",

          shippingPointThree:
            "Estimated delivery time and final shipping cost are shown at checkout.",

          insuranceInfo:
            "Protection insurance",

          insuranceCancelAnytime:
            "Cancel anytime",

          insuranceOptional:
            "Optional protection against accidental damage.",

          insuranceCovers:
            "What is covered",

          insuranceNotCovered:
            "Not covered",

          insuranceCoverDrop:
            "Cracked screen or back glass after an accidental drop or impact.",

          insuranceCoverLiquid:
            "Accidental liquid damage, including water, coffee or other drink spills.",

          insuranceCoverComponents:
            "Accidental damage to the camera, buttons or charging port caused by impact or liquid.",

          insuranceCoverPressure:
            "Accidental pressure or crushing damage to the device.",

          insuranceExcludeTheft:
            "Theft or loss of the device.",

          insuranceExcludeCosmetic:
            "Scratches, dents or cosmetic-only damage that does not affect function.",

          insuranceExcludeWear:
            "Normal wear, battery degradation or faults caused by ordinary use.",

          insuranceExcludeIntentional:
            "Intentional damage, pre-existing damage or damage caused by unauthorized repair.",

          deductiblePerClaim:
            "Deductible per approved claim",

          guaranteeInfo:
            "Device guarantee",

          guaranteeNew:
            "2 years for new devices",

          guaranteeRefurbished:
            "1 year for refurbished devices",

          guaranteeCovers:
            "The guarantee covers functional defects and faults during normal use. Accidental damage, drops and liquids are handled by protection insurance when purchased.",

          months:
            "months",

          model:
            "Model",

          notSpecified:
            "Not specified",

          leaseAvailable:
            "Lease available",

          financingAvailable:
            "Financing available",

          deposit:
            "Deposit",

          leaseTerm:
            "month lease",

          financingTerm:
            "month term",

          interestedInLeasing:
            "Interested in leasing",

          enterEmail:
            "Enter your email",

          emailSaved:
            "Email saved",

          notifyMe:
            "Notify me",

          priceUnavailable:
            "Price unavailable",

          device:
            "Device",

          newBattery:
            "new battery",

          addedToCart:
            "Added to cart",

          addToCart:
            "Add to cart",

          goToCheckout:
            "Go to checkout",

          default:
            "Default",

          smartphone:
            "Smartphone",

          batteryPrefix:
            "Battery",
        };

  /* =======================================================
     LOCALIZED REFURBISHED LABELS
  ======================================================= */

  function getRefurbishedGradeLabel(
    grade: RefurbishedGrade
  ) {
    if (
      language === "en"
    ) {
      switch (grade) {
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

    switch (grade) {
      case "correct":
        return "Razoável";

      case "good":
        return "Bom";

      case "excellent":
        return "Excelente";

      case "premium":
        return "Premium";
    }
  }

  function getRefurbishedGradeDescription(
    grade: RefurbishedGrade
  ) {
    if (
      language === "en"
    ) {
      switch (grade) {
        case "correct":
          return "Visible signs of use · fully tested";

        case "good":
          return "Light signs of use · fully tested";

        case "excellent":
          return "Very light signs of use";

        case "premium":
          return "Top condition · near-new look";
      }
    }

    switch (grade) {
      case "correct":
        return "Sinais visíveis de uso · totalmente testado";

      case "good":
        return "Ligeiros sinais de uso · totalmente testado";

      case "excellent":
        return "Sinais de uso muito ligeiros";

      case "premium":
        return "Excelente estado · aspeto quase novo";
    }
  }

  function getBatteryLabel(
    grade: BatteryGrade
  ) {
    if (
      language === "en"
    ) {
      return grade === "new"
        ? "New battery"
        : "Optimal";
    }

    return grade === "new"
      ? "Bateria nova"
      : "Ótima";
  }

  function getBatteryDescription(
    grade: BatteryGrade
  ) {
    if (
      language === "en"
    ) {
      return grade === "new"
        ? "Fresh replacement battery for maximum battery capacity"
        : "Optimal battery life with the existing battery · No additional environmental impact";
    }

    return grade === "new"
      ? "Bateria de substituição nova para a máxima capacidade"
      : "Boa autonomia com a bateria existente · sem impacto ambiental adicional";
  }

  /* =======================================================
     LOAD PRODUCT
  ======================================================= */

  useEffect(
    () => {
      let active =
        true;

      async function loadProduct() {
        if (!slug) {
          if (active) {
            setProduct(null);
            setVariants([]);
            setSpecifications(
              []
            );

            setLoadError(
              text.productNotFound
            );

            setLoading(false);
          }

          return;
        }

        try {
          setLoading(true);
          setLoadError(null);
          setImageError(false);

          const productData =
            await getPublicProductBySlug(
              slug
            );

          if (!active) {
            return;
          }

          if (!productData) {
            setProduct(null);
            setVariants([]);
            setSpecifications(
              []
            );

            return;
          }

          const [
            variantData,
            specificationData,
          ] =
            await Promise.all([
              getPublicProductVariants(
                productData.id
              ),

              getPublicProductSpecifications(
                productData.id
              ),
            ]);

          if (!active) {
            return;
          }

          setProduct(
            productData
          );

          setVariants(
            variantData
          );

          setSpecifications(
            specificationData
          );

          const defaultCondition =
            getDefaultSellCondition(
              productData
            );

          setSelectedCondition(
            defaultCondition
          );

          /*
           * Availability-only model:
           *
           * product.available
           * variant.available
           *
           * Numeric stock is intentionally ignored here.
           */
          const preferredVariant =
            variantData.find(
              (variant) =>
                productData.available &&
                variant.available
            ) ??
            variantData[0] ??
            null;

          if (
            preferredVariant
          ) {
            setSelectedColorName(
              preferredVariant.color
            );

            setSelectedStorageLabel(
              preferredVariant.storage
            );
          } else {
            setSelectedColorName(
              productData.color ??
                ""
            );

            setSelectedStorageLabel(
              productData.storage ??
                ""
            );
          }
        } catch (error) {
          console.error(
            "Failed to load POKAPOK product:",
            error
          );

          if (!active) {
            return;
          }

          setProduct(null);
          setVariants([]);
          setSpecifications(
            []
          );

          setLoadError(
            text.loadError
          );
        } finally {
          if (active) {
            setLoading(false);
          }
        }
      }

      void loadProduct();

      return () => {
        active =
          false;
      };
    },
    [
      slug,
      language,
    ]
  );

  /* =======================================================
     CONDITION OPTIONS
  ======================================================= */

  const conditionOptions =
    useMemo<
      PublicSellCondition[]
    >(
      () => {
        if (!product) {
          return [];
        }

        return getProductSellConditions(
          product
        );
      },
      [
        product,
      ]
    );

  useEffect(
    () => {
      if (
        conditionOptions.length ===
        0
      ) {
        return;
      }

      if (
        conditionOptions.includes(
          selectedCondition
        )
      ) {
        return;
      }

      setSelectedCondition(
        conditionOptions[0]
      );
    },
    [
      conditionOptions,
      selectedCondition,
    ]
  );

  /* =======================================================
     REFURBISHED CONFIG
  ======================================================= */

  const selectedRefurbishedGrade =
    refurbishedGrades.find(
      (grade) =>
        grade.id ===
        refurbishedGrade
    ) ??
    refurbishedGrades[2];

  const selectedBatteryGrade =
    batteryGrades.find(
      (grade) =>
        grade.id ===
        batteryGrade
    ) ??
    batteryGrades[0];

  /* =======================================================
     CONDITION-AWARE AVAILABILITY

     IMPORTANT:
     No numeric stock is used here.

     We still verify that the selected condition has a
     configured price so a variant cannot be bought with
     an undefined price.
  ======================================================= */

  function variantCanBePurchased(
    candidate:
      | PublicProductVariant
      | null
      | undefined,
    condition:
      PublicSellCondition =
      selectedCondition
  ) {
    if (
      !product ||
      !candidate
    ) {
      return false;
    }

    if (
      !product.published ||
      !product.available ||
      !candidate.available
    ) {
      return false;
    }

    const allowedConditions =
      getProductSellConditions(
        product
      );

    if (
      !allowedConditions.includes(
        condition
      )
    ) {
      return false;
    }

    const price =
      condition ===
      "refurbished"
        ? getPublicVariantRefurbishedGradePrice(
            candidate,
            refurbishedGrade
          )
        : tryGetPublicVariantPriceByCondition(
            product,
            candidate,
            condition
          );

    return (
      price !== null &&
      price > 0
    );
  }

  /* =======================================================
     ALL COLORS
  ======================================================= */

  const colorOptions =
    useMemo<
      PublicProductColor[]
    >(
      () =>
        getProductColors(
          variants
        ),
      [
        variants,
      ]
    );

  /* =======================================================
     AVAILABLE COLOR NAMES

     Calculated directly from variant.available rather than
     the legacy stock-aware service helper.
  ======================================================= */

  const availableColorNames =
    useMemo(
      () => {
        const names =
          new Set<string>();

        if (
          !product ||
          !product.available
        ) {
          return names;
        }

        for (
          const variant of
          variants
        ) {
          if (
            variantCanBePurchased(
              variant,
              selectedCondition
            )
          ) {
            names.add(
              normalize(
                variant.color
              )
            );
          }
        }

        return names;
      },
      [
        product,
        variants,
        selectedCondition,
        refurbishedGrade,
      ]
    );

  /* =======================================================
     STORAGE OPTIONS

     getStorageOptionsForColor is retained for labels/prices.
     Availability itself is calculated independently below.
  ======================================================= */

  const storageOptions =
    useMemo<
      PublicProductStorage[]
    >(
      () => {
        if (
          !product ||
          !selectedColorName
        ) {
          return [];
        }

        return getStorageOptionsForColor(
          variants,
          selectedColorName,
          product,
          selectedCondition
        );
      },
      [
        product,
        variants,
        selectedColorName,
        selectedCondition,
      ]
    );

  /* =======================================================
     SELECTED VARIANT
  ======================================================= */

  const selectedVariant =
    useMemo(
      () => {
        if (
          !selectedStorageLabel ||
          !selectedColorName
        ) {
          return null;
        }

        return findProductVariant(
          variants,
          selectedStorageLabel,
          selectedColorName
        );
      },
      [
        variants,
        selectedStorageLabel,
        selectedColorName,
      ]
    );

  /* =======================================================
     KEEP SELECTION VALID
  ======================================================= */

  useEffect(
    () => {
      if (
        !product ||
        variants.length ===
          0
      ) {
        return;
      }

      if (
        selectedVariant &&
        variantCanBePurchased(
          selectedVariant,
          selectedCondition
        )
      ) {
        return;
      }

      const sameColorVariant =
        variants.find(
          (variant) =>
            normalize(
              variant.color
            ) ===
              normalize(
                selectedColorName
              ) &&
            variantCanBePurchased(
              variant,
              selectedCondition
            )
        );

      const firstAvailableVariant =
        variants.find(
          (variant) =>
            variantCanBePurchased(
              variant,
              selectedCondition
            )
        );

      const preferred =
        sameColorVariant ??
        firstAvailableVariant;

      /*
       * If no purchasable variant exists we intentionally
       * leave the current selection visible so the customer
       * can see that the configuration is unavailable.
       */
      if (!preferred) {
        return;
      }

      if (
        normalize(
          preferred.color
        ) !==
        normalize(
          selectedColorName
        )
      ) {
        setSelectedColorName(
          preferred.color
        );
      }

      if (
        normalize(
          preferred.storage
        ) !==
        normalize(
          selectedStorageLabel
        )
      ) {
        setSelectedStorageLabel(
          preferred.storage
        );
      }
    },
    [
      product,
      variants,
      selectedVariant,
      selectedCondition,
      selectedColorName,
      selectedStorageLabel,
      refurbishedGrade,
    ]
  );

  /* =======================================================
     KEEP STORAGE VALID
  ======================================================= */

  useEffect(
    () => {
      if (
        !product ||
        !selectedColorName ||
        storageOptions.length ===
          0
      ) {
        return;
      }

      const currentStorageExists =
        storageOptions.some(
          (option) =>
            normalize(
              option.label
            ) ===
            normalize(
              selectedStorageLabel
            )
        );

      if (
        currentStorageExists
      ) {
        return;
      }

      const firstPurchasableStorage =
        storageOptions.find(
          (option) => {
            const variant =
              findProductVariant(
                variants,
                option.label,
                selectedColorName
              );

            return variantCanBePurchased(
              variant,
              selectedCondition
            );
          }
        );

      const preferred =
        firstPurchasableStorage ??
        storageOptions[0];

      setSelectedStorageLabel(
        preferred.label
      );
    },
    [
      product,
      variants,
      selectedColorName,
      selectedStorageLabel,
      selectedCondition,
      storageOptions,
      refurbishedGrade,
    ]
  );

  /* =======================================================
     AVAILABILITY
  ======================================================= */

  function colorIsAvailable(
    colorName: string
  ) {
    return availableColorNames.has(
      normalize(
        colorName
      )
    );
  }

  function storageIsAvailable(
    storage: string
  ) {
    if (
      !product ||
      !selectedColorName
    ) {
      return false;
    }

    const variant =
      findProductVariant(
        variants,
        storage,
        selectedColorName
      );

    return variantCanBePurchased(
      variant,
      selectedCondition
    );
  }

  /* =======================================================
     DATABASE PRICING
  ======================================================= */

  const databaseNormalPrice =
    useMemo(
      () => {
        if (
          !product ||
          !selectedVariant
        ) {
          return null;
        }

        if (
          selectedCondition ===
          "refurbished"
        ) {
          return getPublicVariantRefurbishedGradeNormalPrice(
            selectedVariant,
            refurbishedGrade
          );
        }

        return tryGetPublicVariantNormalPriceByCondition(
          product,
          selectedVariant,
          selectedCondition
        );
      },
      [
        product,
        selectedVariant,
        selectedCondition,
        refurbishedGrade,
      ]
    );

  const databaseActivePrice =
    useMemo(
      () => {
        if (
          !product ||
          !selectedVariant
        ) {
          return null;
        }

        if (
          selectedCondition ===
          "refurbished"
        ) {
          return getPublicVariantRefurbishedGradePrice(
            selectedVariant,
            refurbishedGrade
          );
        }

        return tryGetPublicVariantPriceByCondition(
          product,
          selectedVariant,
          selectedCondition
        );
      },
      [
        product,
        selectedVariant,
        selectedCondition,
        refurbishedGrade,
      ]
    );

  /* =======================================================
     FINAL PRICE

     Device / cosmetic-grade pricing comes directly from
     Supabase.

     The only fixed storefront surcharge is the optional
     NEW BATTERY upgrade: +€89.
  ======================================================= */

  const batteryPriceIncrease =
    selectedCondition ===
      "refurbished" &&
    selectedBatteryGrade.id ===
      "new"
      ? 89
      : 0;

  const unitPrice =
    databaseActivePrice ===
      null
      ? 0
      : safeMoney(
          databaseActivePrice +
            batteryPriceIncrease
        );

  /* =======================================================
     PROMOTION
  ======================================================= */

  const hasPromotion =
    databaseNormalPrice !==
      null &&
    databaseActivePrice !==
      null &&
    databaseActivePrice <
      databaseNormalPrice;

  /* =======================================================
     SELECTED AVAILABILITY

     Supabase availability flags are the source of truth.
     Price availability is handled separately when deciding
     whether the item can actually be added to cart.
  ======================================================= */

  const selectedAvailable =
    Boolean(
      product &&
        product.published &&
        product.available &&
        selectedVariant &&
        selectedVariant.available
    );

  /* =======================================================
     IMAGE
  ======================================================= */

  const selectedImageUrl =
    useMemo(
      () => {
        if (!product) {
          return null;
        }

        if (
          selectedVariant?.image_url
        ) {
          return selectedVariant.image_url;
        }

        if (
          selectedColorName
        ) {
          const colorImage =
            getColorImage(
              product,
              variants,
              selectedColorName
            );

          if (colorImage) {
            return colorImage;
          }
        }

        return (
          product.image_url ??
          null
        );
      },
      [
        product,
        variants,
        selectedVariant,
        selectedColorName,
      ]
    );

  useEffect(
    () => {
      setImageError(false);
    },
    [
      selectedImageUrl,
    ]
  );

  /* =======================================================
     PURCHASE OPTIONS
  ======================================================= */

  const leasePrice =
    product?.lease_enabled
      ? product.lease_monthly_price
      : null;

  const financingPrice =
    product?.financing_enabled
      ? product.financing_monthly_price
      : null;

  const insuranceMonthlyPrice =
    product?.insurance_enabled
      ? product.insurance_monthly_price
      : null;

  const guaranteeMonths =
    selectedCondition ===
      "refurbished"
      ? 12
      : 24;

  function togglePracticalInfo(
    key: PracticalInfoKey
  ) {
    setOpenPracticalInfo(
      (current) =>
        current === key
          ? null
          : key
    );
  }

  /* =======================================================
     PAYMENT MODE VALIDATION
  ======================================================= */

  useEffect(
    () => {
      if (!product) {
        return;
      }

      if (
        paymentMode ===
          "lease" &&
        !product.lease_enabled
      ) {
        setPaymentMode(
          "buy"
        );
      }

      if (
        paymentMode ===
          "installments" &&
        !product.financing_enabled
      ) {
        setPaymentMode(
          "buy"
        );
      }
    },
    [
      product,
      paymentMode,
    ]
  );

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <ScrollView
        style={
          styles.screen
        }
        contentContainerStyle={
          styles.centerContent
        }
      >
        <ActivityIndicator
          size="large"
        />

        <Text
          style={
            styles.loadingText
          }
        >
          {text.loading}
        </Text>
      </ScrollView>
    );
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (loadError) {
    return (
      <ScrollView
        style={
          styles.screen
        }
        contentContainerStyle={
          styles.centerContent
        }
      >
        <Text
          style={
            styles.title
          }
        >
          {
            text.productUnavailable
          }
        </Text>

        <Text
          style={
            styles.errorText
          }
        >
          {loadError}
        </Text>

        <Link
          href={
            "/catalog" as any
          }
          asChild
        >
          <Pressable
            style={
              styles.button
            }
          >
            <Text
              style={
                styles.buttonText
              }
            >
              {
                text.backToCatalog
              }
            </Text>
          </Pressable>
        </Link>
      </ScrollView>
    );
  }

  /* =======================================================
     NOT FOUND
  ======================================================= */

  if (!product) {
    return (
      <ScrollView
        style={
          styles.screen
        }
        contentContainerStyle={
          styles.centerContent
        }
      >
        <Text
          style={
            styles.title
          }
        >
          {
            text.productNotFound
          }
        </Text>

        <Link
          href={
            "/catalog" as any
          }
          asChild
        >
          <Pressable
            style={
              styles.button
            }
          >
            <Text
              style={
                styles.buttonText
              }
            >
              {
                text.backToCatalog
              }
            </Text>
          </Pressable>
        </Link>
      </ScrollView>
    );
  }

  const selectedProduct =
    product;

  /* =======================================================
     DESCRIPTION
  ======================================================= */

  const displayDescription =
    selectedProduct.description ??
    text.smartphone;

  /* =======================================================
     CART PHONE
  ======================================================= */

  const cartPhone: Phone = {
    id:
      selectedProduct.id,

    slug:
      selectedProduct.slug,

    name:
      selectedProduct.name,

    brand:
      resolvePhoneBrand(
        selectedProduct.brand
      ),

    condition:
      mapPublicConditionToPhoneCondition(
        selectedCondition
      ),

    featured:
      selectedProduct.featured
        ? 1
        : 0,

    price:
      unitPrice,

    leaseFrom:
      leasePrice ??
      0,

    tagline:
      displayDescription,

    colors:
      colorOptions.length >
      0
        ? colorOptions.map(
            (color) => ({
              name:
                color.name,

              hex:
                color.hex,
            })
          )
        : [
            {
              name:
                selectedColorName ||
                text.default,

              hex:
                "#D9D9D9",
            },
          ],

    storage:
      storageOptions.length >
      0
        ? storageOptions.map(
            (storage) => ({
              label:
                storage.label,

              priceIncrease:
                0,
            })
          )
        : [
            {
              label:
                selectedStorageLabel ||
                text.default,

              priceIncrease:
                0,
            },
          ],

    specs: {
      screen:
        getSpecificationValue(
          specifications,
          "screen"
        ) ??
        getSpecificationValue(
          specifications,
          "display"
        ) ??
        selectedProduct.model ??
        text.smartphone,

      chip:
        getSpecificationValue(
          specifications,
          "chip"
        ) ??
        getSpecificationValue(
          specifications,
          "processor"
        ) ??
        text.notSpecified,

      camera:
        getSpecificationValue(
          specifications,
          "camera"
        ) ??
        getSpecificationValue(
          specifications,
          "cameras"
        ) ??
        text.notSpecified,

      battery:
        getSpecificationValue(
          specifications,
          "battery"
        ) ??
        text.notSpecified,

      ram:
        getSpecificationValue(
          specifications,
          "ram"
        ) ??
        text.notSpecified,

      os:
        getSpecificationValue(
          specifications,
          "os"
        ) ??
        (
          normalize(
            selectedProduct.brand
          ) === "apple"
            ? "iOS"
            : "Android"
        ),
    },
  };

  /* =======================================================
     CART CONFIG LABEL
  ======================================================= */

  const cartStorageLabel =
    selectedCondition ===
    "refurbished"
      ? `${selectedStorageLabel} · ${getRefurbishedGradeLabel(
          selectedRefurbishedGrade.id
        )} · ${text.batteryPrefix} ${getBatteryLabel(
          selectedBatteryGrade.id
        )}`
      : selectedStorageLabel;

  /* =======================================================
     RESET FEEDBACK
  ======================================================= */

  function resetMessages() {
    setAddedToCart(
      false
    );

    setLeaseSubmitted(
      false
    );
  }

  /* =======================================================
     SELECT COLOR
  ======================================================= */

  function selectColor(
    colorName: string
  ) {
    setSelectedColorName(
      colorName
    );

    const colorVariants =
      variants.filter(
        (variant) =>
          normalize(
            variant.color
          ) ===
          normalize(
            colorName
          )
      );

    const preferred =
      colorVariants.find(
        (variant) =>
          variantCanBePurchased(
            variant,
            selectedCondition
          )
      ) ??
      colorVariants[0];

    if (preferred) {
      setSelectedStorageLabel(
        preferred.storage
      );
    }

    setImageError(
      false
    );

    resetMessages();
  }

  /* =======================================================
     SELECT STORAGE
  ======================================================= */

  function selectStorage(
    storage: string
  ) {
    setSelectedStorageLabel(
      storage
    );

    setImageError(
      false
    );

    resetMessages();
  }

  /* =======================================================
     SELECT CONDITION
  ======================================================= */

  function selectCondition(
    condition: PublicSellCondition
  ) {
    if (
      condition ===
      selectedCondition
    ) {
      return;
    }

    setSelectedCondition(
      condition
    );

    if (
      condition ===
      "new"
    ) {
      setBatteryGrade(
        "optimal"
      );
    }

    /*
     * Immediately move to a variant that can actually
     * be sold under the newly selected condition.
     */
    const sameVariantWorks =
      selectedVariant &&
      variantCanBePurchased(
        selectedVariant,
        condition
      );

    if (
      !sameVariantWorks
    ) {
      const sameColorVariant =
        variants.find(
          (variant) =>
            normalize(
              variant.color
            ) ===
              normalize(
                selectedColorName
              ) &&
            variantCanBePurchased(
              variant,
              condition
            )
        );

      const firstAvailableVariant =
        variants.find(
          (variant) =>
            variantCanBePurchased(
              variant,
              condition
            )
        );

      const preferred =
        sameColorVariant ??
        firstAvailableVariant;

      if (preferred) {
        setSelectedColorName(
          preferred.color
        );

        setSelectedStorageLabel(
          preferred.storage
        );
      }
    }

    resetMessages();
  }

  /* =======================================================
     BUILD CART ITEM
  ======================================================= */

  function buildCartItem() {
    if (
      !selectedAvailable ||
      !selectedVariant ||
      databaseActivePrice ===
        null
    ) {
      return null;
    }

    const baseMonthlyPrice =
      paymentMode ===
      "lease"
        ? leasePrice ?? 0
        : paymentMode ===
            "installments"
          ? financingPrice ?? 0
          : 0;

    const insuranceRecurringPrice =
      insurance &&
      insuranceMonthlyPrice !==
        null
        ? insuranceMonthlyPrice
        : 0;

    const finalMonthlyPrice =
      safeMoney(
        baseMonthlyPrice +
          insuranceRecurringPrice
      );

    return {
      id:
        `${selectedProduct.id}-${selectedVariant.id}-${selectedCondition}-${batteryGrade}-${refurbishedGrade}-${Date.now()}`,

      productId:
        selectedProduct.id,

      variantId:
        selectedVariant.id,

      phone:
        cartPhone,

      colorName:
        selectedColorName ||
        text.default,

      storageLabel:
        cartStorageLabel ||
        text.default,

      paymentMode,

      months,

      insurance,

      unitPrice,

      monthlyPrice:
        finalMonthlyPrice,

      quantity:
        1,
    };
  }

  /* =======================================================
     ADD TO CART
  ======================================================= */

  function handleAddToCart() {
    const cartItem =
      buildCartItem();

    if (!cartItem) {
      return;
    }

    addItem(
      cartItem
    );

    setAddedToCart(
      true
    );

    console.log(
      "ADDED TO CART:",
      {
        ...cartItem,

        condition:
          selectedCondition,

        databasePrice:
          databaseActivePrice,

        finalPrice:
          unitPrice,

        refurbishedGrade:
          selectedCondition ===
          "refurbished"
            ? refurbishedGrade
            : null,

        batteryGrade:
          selectedCondition ===
          "refurbished"
            ? batteryGrade
            : null,
      }
    );

    router.push(
      "/cart"
    );
  }

  /* =======================================================
     CHECKOUT NOW
  ======================================================= */

  function handleCheckoutNow() {
    const cartItem =
      buildCartItem();

    if (!cartItem) {
      return;
    }

    addItem(
      cartItem
    );

    router.push(
      "/checkout"
    );
  }

  /* =======================================================
     LEASE INTEREST
  ======================================================= */

  function handleLeaseNotify() {
    const cleanEmail =
      leaseEmail
        .trim()
        .toLowerCase();

    if (
      !cleanEmail ||
      !cleanEmail.includes(
        "@"
      )
    ) {
      return;
    }

    console.log(
      "LEASE INTEREST:",
      {
        productId:
          selectedProduct.id,

        variantId:
          selectedVariant?.id ??
          null,

        productName:
          selectedProduct.name,

        email:
          cleanEmail,

        color:
          selectedColorName,

        storage:
          selectedStorageLabel,

        condition:
          selectedCondition,

        createdAt:
          new Date().toISOString(),
      }
    );

    setLeaseSubmitted(
      true
    );
  }

  /* =======================================================
     UI
  ======================================================= */

  const showPaymentSelector =
    selectedProduct.lease_enabled ||
    selectedProduct.financing_enabled;

  const specificationsLabel =
    language === "pt"
      ? showSpecifications
        ? "Ocultar especificações"
        : "Ver especificações"
      : showSpecifications
        ? "Hide specifications"
        : "View specifications";

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
      showsVerticalScrollIndicator={
        false
      }
    >
      {/* HEADER */}

      <View
        style={[
          styles.header,
          isMobile &&
            styles.headerMobile,
        ]}
      >
        <Link
          href={
            "/catalog" as any
          }
          asChild
        >
          <Pressable
            style={
              styles.backButton
            }
          >
            <Text
              style={[
                styles.back,
                isMobile &&
                  styles.backMobile,
              ]}
            >
              ←{" "}
              {
                text.backToCatalog
              }
            </Text>
          </Pressable>
        </Link>

        <View
          style={
            styles.headerActions
          }
        >
          <Text
            style={[
              styles.logo,
              isMobile &&
                styles.logoMobile,
            ]}
          >
            POKAPOK
          </Text>

          <CurrencySwitcher
            compact
          />
        </View>
      </View>

      <View
        style={[
          styles.page,
          isMobile &&
            styles.pageMobile,
        ]}
      >
        {/* PRODUCT IMAGE — DESKTOP ONLY */}

        {!isMobile ? (
          <View
            style={
              styles.visual
            }
          >
            <View
              style={
                styles.visualGlow
              }
            />

            {selectedImageUrl &&
            !imageError ? (
              <Image
                key={
                  selectedImageUrl
                }
                source={{
                  uri:
                    selectedImageUrl,
                }}
                style={
                  styles.productImage
                }
                resizeMode="contain"
                accessibilityLabel={`${selectedProduct.name} ${selectedColorName}`}
                onError={(
                  event
                ) => {
                  console.error(
                    "Product image failed:",
                    selectedImageUrl,
                    event.nativeEvent
                      .error
                  );

                  setImageError(
                    true
                  );
                }}
              />
            ) : (
              <View
                style={
                  styles.imageFallback
                }
              >
                <Text
                  style={
                    styles.imageFallbackText
                  }
                >
                  POKAPOK
                </Text>

                <Text
                  style={
                    styles.imageFallbackSubText
                  }
                >
                  {
                    selectedProduct.name
                  }
                </Text>
              </View>
            )}

            {selectedColorName ? (
              <Text
                style={
                  styles.selectedColorName
                }
              >
                {
                  selectedColorName
                }
              </Text>
            ) : null}
          </View>
        ) : null}

        {/* INFORMATION */}

        <View
          style={[
            styles.info,
            isMobile &&
              styles.infoMobile,
          ]}
        >
          <View
            style={
              styles.metaRow
            }
          >
            <Text
              style={[
                styles.brand,
                isMobile &&
                  styles.brandMobile,
              ]}
            >
              {selectedProduct.brand.toUpperCase()}{" "}
              ·{" "}
              {selectedCondition ===
              "new"
                ? text.new.toUpperCase()
                : selectedProduct.condition ===
                    "used"
                  ? text.used.toUpperCase()
                  : text.refurbished.toUpperCase()}
            </Text>

            <View
              style={[
                styles.stockPill,
                selectedAvailable
                  ? styles.stockPillAvailable
                  : styles.stockPillUnavailable,
              ]}
            >
              <Text
                style={[
                  styles.stockPillText,
                  selectedAvailable
                    ? styles.stockText
                    : styles.outOfStockText,
                ]}
              >
                ●{" "}
                {selectedAvailable
                  ? text.inStock
                  : text.outOfStock}
              </Text>
            </View>
          </View>

          <Text
            style={[
              styles.title,
              isMobile &&
                styles.titleMobile,
            ]}
          >
            {
              selectedProduct.name
            }
          </Text>

          {/* COMPACT MOBILE PRODUCT PREVIEW */}

          {isMobile ? (
            <View
              style={
                styles.mobileProductPreview
              }
            >
              <View
                style={
                  styles.mobileProductPreviewGlow
                }
              />

              {selectedImageUrl &&
              !imageError ? (
                <Image
                  key={
                    selectedImageUrl
                  }
                  source={{
                    uri:
                      selectedImageUrl,
                  }}
                  style={
                    styles.mobileProductPreviewImage
                  }
                  resizeMode="contain"
                  accessibilityLabel={`${selectedProduct.name} ${selectedColorName}`}
                  onError={(
                    event
                  ) => {
                    console.error(
                      "Product image failed:",
                      selectedImageUrl,
                      event.nativeEvent
                        .error
                    );

                    setImageError(
                      true
                    );
                  }}
                />
              ) : (
                <View
                  style={
                    styles.mobileProductPreviewFallback
                  }
                >
                  <Text
                    style={
                      styles.imageFallbackText
                    }
                  >
                    POKAPOK
                  </Text>

                  <Text
                    numberOfLines={
                      1
                    }
                    style={
                      styles.imageFallbackSubText
                    }
                  >
                    {
                      selectedProduct.name
                    }
                  </Text>
                </View>
              )}
            </View>
          ) : null}

          <Text
            numberOfLines={
              isMobile
                ? 3
                : undefined
            }
            style={[
              styles.tagline,
              isMobile &&
                styles.taglineMobile,
            ]}
          >
            {
              displayDescription
            }
          </Text>

          {/* PROMOTION */}

          {hasPromotion &&
          databaseNormalPrice !==
            null &&
          databaseActivePrice !==
            null &&
          databaseNormalPrice >
            databaseActivePrice ? (
            <View
              style={[
                styles.promotionBox,
                isMobile &&
                  styles.promotionBoxMobile,
              ]}
            >
              <Text
                style={
                  styles.promotionLabel
                }
              >
                {
                  text.promotion
                }
              </Text>

              <View
                style={
                  styles.promotionPrices
                }
              >
                <Text
                  style={
                    styles.oldPrice
                  }
                >
                  {formatPrice(
                    databaseNormalPrice
                  )}
                </Text>

                <Text
                  style={
                    styles.promotionPrice
                  }
                >
                  {formatPrice(
                    databaseActivePrice
                  )}
                </Text>
              </View>
            </View>
          ) : null}

          {/* CONDITION */}

          {conditionOptions.length >
          1 ? (
            <>
              <Text
                style={[
                  styles.label,
                  isMobile &&
                    styles.labelMobile,
                ]}
              >
                {
                  text.condition
                }
              </Text>

              <View
                style={
                  styles.row
                }
              >
                {conditionOptions.map(
                  (condition) => (
                    <Pressable
                      key={
                        condition
                      }
                      onPress={() =>
                        selectCondition(
                          condition
                        )
                      }
                      style={[
                        styles.conditionChoice,

                        isMobile &&
                          styles.conditionChoiceMobile,

                        selectedCondition ===
                          condition &&
                          styles.choiceActive,
                      ]}
                    >
                      <Text
                        style={
                          styles.choiceText
                        }
                      >
                        {condition ===
                        "new"
                          ? text.new
                          : text.refurbished}
                      </Text>

                      <Text
                        numberOfLines={
                          1
                        }
                        style={
                          styles.conditionSubText
                        }
                      >
                        {condition ===
                        "new"
                          ? text.brandNewDevice
                          : text.refurbishedDevice}
                      </Text>
                    </Pressable>
                  )
                )}
              </View>
            </>
          ) : null}

          {/* REFURBISHED OPTIONS */}

          {selectedCondition ===
          "refurbished" ? (
            <>
              <View
                style={[
                  styles.refurbInfoBox,
                  isMobile &&
                    styles.refurbInfoBoxMobile,
                ]}
              >
                <Text
                  style={
                    styles.refurbInfoTitle
                  }
                >
                  {
                    text.professionallyChecked
                  }
                </Text>

                <Text
                  style={
                    styles.refurbInfoText
                  }
                >
                  {
                    text.professionallyCheckedDescription
                  }
                </Text>
              </View>

              <Text
                style={[
                  styles.label,
                  isMobile &&
                    styles.labelMobile,
                ]}
              >
                {
                  text.cosmeticCondition
                }
              </Text>

              <View
                style={
                  styles.gradeList
                }
              >
                {refurbishedGrades.map(
                  (grade) => {
                    const active =
                      refurbishedGrade ===
                      grade.id;

                    const normalGradePrice =
                      selectedVariant
                        ? getPublicVariantRefurbishedGradeNormalPrice(
                            selectedVariant,
                            grade.id
                          )
                        : null;

                    const activeGradePrice =
                      selectedVariant
                        ? getPublicVariantRefurbishedGradePrice(
                            selectedVariant,
                            grade.id
                          )
                        : null;

                    const gradeHasPromotion =
                      normalGradePrice !==
                        null &&
                      activeGradePrice !==
                        null &&
                      activeGradePrice <
                        normalGradePrice;

                    const gradeAvailable =
                      Boolean(
                        selectedVariant?.available &&
                        activeGradePrice !==
                          null &&
                        activeGradePrice >
                          0
                      );

                    return (
                      <Pressable
                        key={
                          grade.id
                        }
                        disabled={
                          !gradeAvailable
                        }
                        onPress={() => {
                          setRefurbishedGrade(
                            grade.id
                          );

                          resetMessages();
                        }}
                        style={[
                          styles.gradeChoice,

                          isMobile &&
                            styles.gradeChoiceMobile,

                          active &&
                            styles.gradeChoiceActive,

                          !gradeAvailable &&
                            styles.gradeChoiceUnavailable,
                        ]}
                      >
                        <View
                          style={
                            styles.gradeLeft
                          }
                        >
                          <View
                            style={[
                              styles.radio,

                              active &&
                                styles.radioActive,
                            ]}
                          />

                          <View
                            style={{
                              flex: 1,
                            }}
                          >
                            <View
                              style={
                                styles.gradeTitleRow
                              }
                            >
                              <Text
                                style={
                                  styles.gradeTitle
                                }
                              >
                                {getRefurbishedGradeLabel(
                                  grade.id
                                )}
                              </Text>

                              {grade.popular ? (
                                <Text
                                  style={
                                    styles.popularBadge
                                  }
                                >
                                  {
                                    text.popular
                                  }
                                </Text>
                              ) : null}
                            </View>

                            {!isMobile ? (
                              <Text
                                style={
                                  styles.gradeDescription
                                }
                              >
                                {getRefurbishedGradeDescription(
                                  grade.id
                                )}
                              </Text>
                            ) : null}
                          </View>
                        </View>

                        <View
                          style={
                            styles.gradePriceColumn
                          }
                        >
                          {gradeHasPromotion &&
                          normalGradePrice !==
                            null ? (
                            <Text
                              style={
                                styles.gradeOldPrice
                              }
                            >
                              {formatPrice(
                                normalGradePrice
                              )}
                            </Text>
                          ) : null}

                          <Text
                            style={[
                              styles.gradePrice,

                              !gradeAvailable &&
                                styles.gradePriceUnavailable,
                            ]}
                          >
                            {activeGradePrice !==
                            null
                              ? formatPrice(
                                  activeGradePrice
                                )
                              : text.unavailable}
                          </Text>
                        </View>
                      </Pressable>
                    );
                  }
                )}
              </View>

              <Text
                style={[
                  styles.label,
                  isMobile &&
                    styles.labelMobile,
                ]}
              >
                {
                  text.battery
                }
              </Text>

              <View
                style={
                  styles.gradeList
                }
              >
                {batteryGrades.map(
                  (grade) => {
                    const active =
                      batteryGrade ===
                      grade.id;

                    return (
                      <Pressable
                        key={
                          grade.id
                        }
                        onPress={() => {
                          setBatteryGrade(
                            grade.id
                          );

                          resetMessages();
                        }}
                        style={[
                          styles.gradeChoice,

                          isMobile &&
                            styles.gradeChoiceMobile,

                          active &&
                            styles.gradeChoiceActive,
                        ]}
                      >
                        <View
                          style={
                            styles.gradeLeft
                          }
                        >
                          <View
                            style={[
                              styles.radio,

                              active &&
                                styles.radioActive,
                            ]}
                          />

                          <View
                            style={{
                              flex: 1,
                            }}
                          >
                            <View
                              style={
                                styles.gradeTitleRow
                              }
                            >
                              <Text
                                style={
                                  styles.gradeTitle
                                }
                              >
                                {getBatteryLabel(
                                  grade.id
                                )}
                              </Text>

                              {grade.popular ? (
                                <Text
                                  style={
                                    styles.popularBadge
                                  }
                                >
                                  {
                                    text.popular
                                  }
                                </Text>
                              ) : null}
                            </View>

                            {!isMobile ? (
                              <Text
                                style={
                                  styles.gradeDescription
                                }
                              >
                                {getBatteryDescription(
                                  grade.id
                                )}
                              </Text>
                            ) : null}
                          </View>
                        </View>

                        <Text
                          style={
                            styles.gradePrice
                          }
                        >
                          {grade.priceIncrease >
                          0
                            ? `+${formatPrice(
                                grade.priceIncrease
                              )}`
                            : text.included}
                        </Text>
                      </Pressable>
                    );
                  }
                )}
              </View>
            </>
          ) : null}

          {/* COLOR */}

          {colorOptions.length >
          0 ? (
            <>
              <Text
                style={[
                  styles.label,
                  isMobile &&
                    styles.labelMobile,
                ]}
              >
                {text.color}
              </Text>

              <View
                style={
                  styles.colorSectionRow
                }
              >
                <View
                  style={
                    styles.colorSwatchRow
                  }
                >
                  {colorOptions.map(
                    (item) => {
                      const active =
                        normalize(
                          selectedColorName
                        ) ===
                        normalize(
                          item.name
                        );

                      const available =
                        colorIsAvailable(
                          item.name
                        );

                      return (
                        <Pressable
                          key={
                            normalize(
                              item.name
                            )
                          }
                          accessibilityRole="button"
                          accessibilityLabel={`${item.name}${
                            available
                              ? ""
                              : `, ${text.unavailable}`
                          }`}
                          onPress={() =>
                            selectColor(
                              item.name
                            )
                          }
                          style={[
                            styles.colorSwatchButton,

                            isMobile &&
                              styles.colorSwatchButtonMobile,

                            active &&
                              styles.colorSwatchButtonActive,
                          ]}
                        >
                          <View
                            style={[
                              styles.colorSwatch,

                              isMobile &&
                                styles.colorSwatchMobile,

                              {
                                backgroundColor:
                                  item.hex ||
                                  "#D9D9D9",
                              },

                              !available &&
                                styles.colorSwatchSoldOut,
                            ]}
                          />

                          {!available ? (
                            <View
                              style={
                                styles.swatchSoldOutLine
                              }
                            />
                          ) : null}
                        </Pressable>
                      );
                    }
                  )}
                </View>

                <Text
                  numberOfLines={
                    1
                  }
                  style={
                    styles.selectedColorLabel
                  }
                >
                  {
                    selectedColorName
                  }
                </Text>
              </View>
            </>
          ) : null}

          {/* STORAGE */}

          {storageOptions.length >
          0 ? (
            <>
              <Text
                style={[
                  styles.label,
                  isMobile &&
                    styles.labelMobile,
                ]}
              >
                {
                  text.storage
                }
              </Text>

              <View
                style={
                  styles.storageRow
                }
              >
                {storageOptions.map(
                  (item) => {
                    const active =
                      normalize(
                        selectedStorageLabel
                      ) ===
                      normalize(
                        item.label
                      );

                    const available =
                      storageIsAvailable(
                        item.label
                      );

                    const matchingVariant =
                      findProductVariant(
                        variants,
                        item.label,
                        selectedColorName
                      );

                    const optionPrice =
                      matchingVariant
                        ? selectedCondition ===
                          "refurbished"
                          ? getPublicVariantRefurbishedGradePrice(
                              matchingVariant,
                              refurbishedGrade
                            )
                          : tryGetPublicVariantPriceByCondition(
                              selectedProduct,
                              matchingVariant,
                              selectedCondition
                            )
                        : null;

                    return (
                      <Pressable
                        key={
                          item.label
                        }
                        onPress={() =>
                          selectStorage(
                            item.label
                          )
                        }
                        style={[
                          styles.storageChoice,

                          isMobile &&
                            styles.storageChoiceMobile,

                          active &&
                            styles.choiceActive,

                          !available &&
                            styles.choiceSoldOut,
                        ]}
                      >
                        <Text
                          style={[
                            styles.choiceText,

                            isMobile &&
                              styles.storageChoiceTextMobile,

                            !available &&
                              styles.choiceTextSoldOut,
                          ]}
                        >
                          {
                            item.label
                          }
                        </Text>

                        {optionPrice !==
                        null ? (
                          <Text
                            style={
                              styles.storagePrice
                            }
                          >
                            {formatPrice(
                              optionPrice
                            )}
                          </Text>
                        ) : null}

                        {!available ? (
                          <Text
                            style={
                              styles.soldOutSmall
                            }
                          >
                            {
                              text.unavailable
                            }
                          </Text>
                        ) : null}
                      </Pressable>
                    );
                  }
                )}
              </View>
            </>
          ) : null}

          {/* PAYMENT - HIDDEN WHEN BUY IS THE ONLY OPTION */}

          {showPaymentSelector ? (
            <>
              <Text
                style={[
                  styles.label,
                  isMobile &&
                    styles.labelMobile,
                ]}
              >
                {text.payment}
              </Text>

              <View
                style={
                  styles.row
                }
              >
                <Pressable
                  onPress={() => {
                    setPaymentMode(
                      "buy"
                    );

                    resetMessages();
                  }}
                  style={[
                    styles.choice,

                    isMobile &&
                      styles.choiceMobile,

                    paymentMode ===
                      "buy" &&
                      styles.choiceActive,
                  ]}
                >
                  <Text
                    style={
                      styles.choiceText
                    }
                  >
                    {text.buyNow}
                  </Text>
                </Pressable>

                {selectedProduct.lease_enabled ? (
                  <Pressable
                    onPress={() => {
                      setPaymentMode(
                        "lease"
                      );

                      resetMessages();
                    }}
                    style={[
                      styles.choice,

                      isMobile &&
                        styles.choiceMobile,

                      paymentMode ===
                        "lease" &&
                        styles.choiceActive,
                    ]}
                  >
                    <Text
                      style={
                        styles.choiceText
                      }
                    >
                      {text.lease}
                    </Text>
                  </Pressable>
                ) : null}

                {selectedProduct.financing_enabled ? (
                  <Pressable
                    onPress={() => {
                      setPaymentMode(
                        "installments"
                      );

                      resetMessages();
                    }}
                    style={[
                      styles.choice,

                      isMobile &&
                        styles.choiceMobile,

                      paymentMode ===
                        "installments" &&
                        styles.choiceActive,
                    ]}
                  >
                    <Text
                      style={
                        styles.choiceText
                      }
                    >
                      {
                        text.financing
                      }
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            </>
          ) : null}

          {/* INSURANCE */}

          {selectedProduct.insurance_enabled ? (
            <View
              style={[
                styles.insurance,

                isMobile &&
                  styles.insuranceMobile,

                insurance &&
                  styles.insuranceActive,
              ]}
            >
              <Pressable
                onPress={() => {
                  setInsurance(
                    (current) =>
                      !current
                  );

                  resetMessages();
                }}
                style={
                  styles.insuranceHeader
                }
              >
                <View
                  style={{
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  <Text
                    style={[
                      styles.insuranceTitle,
                      isMobile &&
                        styles.insuranceTitleMobile,
                    ]}
                  >
                    {
                      text.protectionInsurance
                    }
                  </Text>

                  <Text
                    style={[
                      styles.insuranceText,
                      isMobile &&
                        styles.insuranceTextMobile,
                    ]}
                  >
                    {insuranceMonthlyPrice !==
                    null
                      ? `${formatPrice(
                          insuranceMonthlyPrice
                        )}${text.perMonth}`
                      : selectedProduct.insurance_annual_price !==
                          null
                        ? `${formatPrice(
                            selectedProduct.insurance_annual_price
                          )}${text.perYear}`
                        : selectedProduct.insurance_single_price !==
                            null
                          ? `${formatPrice(
                              selectedProduct.insurance_single_price
                            )} ${text.oneTime}`
                          : text.insuranceAvailable}
                  </Text>

                  {selectedProduct.insurance_deductible !==
                  null ? (
                    <Text
                      style={
                        styles.insuranceDeductible
                      }
                    >
                      {text.deductible}:{" "}
                      {formatPrice(
                        selectedProduct.insurance_deductible
                      )}
                    </Text>
                  ) : null}
                </View>

                <Switch
                  value={
                    insurance
                  }
                  onValueChange={(
                    value
                  ) => {
                    setInsurance(
                      value
                    );

                    resetMessages();
                  }}
                />
              </Pressable>
            </View>
          ) : null}

          {/* PRICE + CTA BEFORE SPECS */}

          <View
            style={[
              styles.priceBox,
              isMobile &&
                styles.priceBoxMobile,
            ]}
          >
            {paymentMode ===
            "lease" ? (
              <>
                <Text
                  style={[
                    styles.price,
                    isMobile &&
                      styles.priceMobile,
                  ]}
                >
                  {leasePrice !==
                  null
                    ? `${formatPrice(
                        leasePrice
                      )}${text.perMonth}`
                    : text.leaseAvailable}
                </Text>

                {selectedProduct.lease_deposit !==
                null ? (
                  <Text
                    style={
                      styles.priceSub
                    }
                  >
                    {text.deposit}:{" "}
                    {formatPrice(
                      selectedProduct.lease_deposit
                    )}
                  </Text>
                ) : null}

                {selectedProduct.lease_term_months !==
                null ? (
                  <Text
                    style={
                      styles.priceSub
                    }
                  >
                    {
                      selectedProduct.lease_term_months
                    }{" "}
                    {
                      text.leaseTerm
                    }
                  </Text>
                ) : null}

                <View
                  style={
                    styles.leaseNotifyBox
                  }
                >
                  <Text
                    style={
                      styles.leaseNotifyTitle
                    }
                  >
                    {
                      text.interestedInLeasing
                    }{" "}
                    {
                      selectedProduct.name
                    }
                    ?
                  </Text>

                  <Text
                    style={
                      styles.leaseSelection
                    }
                  >
                    {
                      selectedColorName
                    }
                    {selectedColorName &&
                    selectedStorageLabel
                      ? " · "
                      : ""}
                    {
                      selectedStorageLabel
                    }
                  </Text>

                  <TextInput
                    value={
                      leaseEmail
                    }
                    onChangeText={(
                      value
                    ) => {
                      setLeaseEmail(
                        value
                      );

                      setLeaseSubmitted(
                        false
                      );
                    }}
                    placeholder={
                      text.enterEmail
                    }
                    placeholderTextColor={
                      colors.ink40
                    }
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={
                      styles.leaseInput
                    }
                  />

                  <Pressable
                    onPress={
                      handleLeaseNotify
                    }
                    style={[
                      styles.notifyButton,

                      leaseSubmitted &&
                        styles.notifyButtonSuccess,
                    ]}
                  >
                    <Text
                      style={
                        styles.notifyButtonText
                      }
                    >
                      {leaseSubmitted
                        ? text.emailSaved
                        : text.notifyMe}
                    </Text>
                  </Pressable>
                </View>
              </>
            ) : paymentMode ===
              "installments" ? (
              <>
                <Text
                  style={[
                    styles.price,
                    isMobile &&
                      styles.priceMobile,
                  ]}
                >
                  {financingPrice !==
                  null
                    ? `${formatPrice(
                        financingPrice
                      )}${text.perMonth}`
                    : text.financingAvailable}
                </Text>

                {selectedProduct.financing_deposit !==
                null ? (
                  <Text
                    style={
                      styles.priceSub
                    }
                  >
                    {text.deposit}:{" "}
                    {formatPrice(
                      selectedProduct.financing_deposit
                    )}
                  </Text>
                ) : null}

                {selectedProduct.financing_term_months !==
                null ? (
                  <Text
                    style={
                      styles.priceSub
                    }
                  >
                    {
                      selectedProduct.financing_term_months
                    }{" "}
                    {
                      text.financingTerm
                    }
                  </Text>
                ) : null}
              </>
            ) : (
              <>
                {hasPromotion &&
                databaseNormalPrice !==
                  null &&
                databaseActivePrice !==
                  null &&
                databaseNormalPrice >
                  databaseActivePrice ? (
                  <Text
                    style={
                      styles.checkoutOldPrice
                    }
                  >
                    {formatPrice(
                      databaseNormalPrice
                    )}
                  </Text>
                ) : null}

                <Text
                  style={[
                    styles.price,
                    isMobile &&
                      styles.priceMobile,
                  ]}
                >
                  {databaseActivePrice !==
                  null
                    ? formatPrice(
                        unitPrice
                      )
                    : text.priceUnavailable}
                </Text>

                <Text
                  numberOfLines={
                    isMobile
                      ? 2
                      : undefined
                  }
                  style={
                    styles.priceSub
                  }
                >
                  {
                    selectedColorName
                  }
                  {selectedColorName &&
                  selectedStorageLabel
                    ? " · "
                    : ""}
                  {
                    selectedStorageLabel
                  }
                  {selectedCondition ===
                  "refurbished"
                    ? ` · ${getRefurbishedGradeLabel(
                        selectedRefurbishedGrade.id
                      )}`
                    : ""}
                </Text>

                {selectedCondition ===
                  "refurbished" &&
                databaseActivePrice !==
                  null &&
                batteryPriceIncrease >
                  0 ? (
                  <Text
                    style={
                      styles.batteryPriceNote
                    }
                  >
                    {text.device}{" "}
                    {formatPrice(
                      databaseActivePrice
                    )}{" "}
                    + {text.newBattery}{" "}
                    {formatPrice(
                      batteryPriceIncrease
                    )}
                  </Text>
                ) : null}

                <View
                  style={[
                    styles.buttonRow,
                    isMobile &&
                      styles.buttonRowMobile,
                  ]}
                >
                  <Pressable
                    onPress={
                      handleAddToCart
                    }
                    disabled={
                      !selectedAvailable ||
                      !selectedVariant ||
                      databaseActivePrice ===
                        null
                    }
                    style={[
                      styles.addButton,

                      isMobile &&
                        styles.addButtonMobile,

                      (
                        !selectedAvailable ||
                        !selectedVariant ||
                        databaseActivePrice ===
                          null
                      ) &&
                        styles.disabledButton,
                    ]}
                  >
                    <Text
                      style={[
                        styles.addButtonText,
                        isMobile &&
                          styles.addButtonTextMobile,
                      ]}
                    >
                      {databaseActivePrice ===
                      null
                        ? text.priceUnavailable
                        : !selectedAvailable ||
                            !selectedVariant
                          ? text.outOfStock
                          : addedToCart
                            ? text.addedToCart
                            : text.addToCart}
                    </Text>
                  </Pressable>

                  {selectedAvailable &&
                  selectedVariant &&
                  databaseActivePrice !==
                    null ? (
                    <Pressable
                      onPress={
                        handleCheckoutNow
                      }
                      style={[
                        styles.checkoutButton,

                        isMobile &&
                          styles.checkoutButtonMobile,
                      ]}
                    >
                      <Text
                        style={
                          styles.checkoutButtonText
                        }
                      >
                        {
                          text.goToCheckout
                        }
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
              </>
            )}
          </View>

          {/* PRACTICAL INFORMATION */}

          <View
            style={[
              styles.practicalSection,
              isMobile &&
                styles.practicalSectionMobile,
            ]}
          >
            <Text
              style={[
                styles.practicalHeading,
                isMobile &&
                  styles.practicalHeadingMobile,
              ]}
            >
              {
                text.practicalInformation
              }
            </Text>

            {/* SHIPPING */}

            <View
              style={
                styles.practicalAccordion
              }
            >
              <Pressable
                onPress={() =>
                  togglePracticalInfo(
                    "shipping"
                  )
                }
                style={
                  styles.practicalAccordionHeader
                }
              >
                <View
                  style={
                    styles.practicalHeaderCopy
                  }
                >
                  <Text
                    style={
                      styles.practicalTitle
                    }
                  >
                    {
                      text.shippingInformation
                    }
                  </Text>

                  <Text
                    style={
                      styles.practicalSummary
                    }
                    numberOfLines={2}
                  >
                    {
                      text.shippingSummary
                    }
                  </Text>
                </View>

                <Text
                  style={
                    styles.practicalChevron
                  }
                >
                  {openPracticalInfo ===
                  "shipping"
                    ? "−"
                    : "+"}
                </Text>
              </Pressable>

              {openPracticalInfo ===
              "shipping" ? (
                <View
                  style={
                    styles.practicalBody
                  }
                >
                  {[
                    text.shippingPointOne,
                    text.shippingPointTwo,
                    text.shippingPointThree,
                  ].map(
                    (
                      item,
                      index
                    ) => (
                      <View
                        key={`shipping-${index}`}
                        style={
                          styles.practicalBulletRow
                        }
                      >
                        <Text
                          style={
                            styles.practicalBullet
                          }
                        >
                          ✓
                        </Text>

                        <Text
                          style={
                            styles.practicalBodyText
                          }
                        >
                          {item}
                        </Text>
                      </View>
                    )
                  )}
                </View>
              ) : null}
            </View>

            {/* INSURANCE */}

            <View
              style={
                styles.practicalAccordion
              }
            >
              <Pressable
                onPress={() =>
                  togglePracticalInfo(
                    "insurance"
                  )
                }
                style={
                  styles.practicalAccordionHeader
                }
              >
                <View
                  style={
                    styles.practicalHeaderCopy
                  }
                >
                  <View
                    style={
                      styles.practicalTitleRow
                    }
                  >
                    <Text
                      style={
                        styles.practicalTitle
                      }
                    >
                      {
                        text.insuranceInfo
                      }
                    </Text>

                    {selectedProduct.insurance_enabled &&
                    insuranceMonthlyPrice !==
                      null ? (
                      <View
                        style={
                          styles.cancelBadge
                        }
                      >
                        <Text
                          style={
                            styles.cancelBadgeText
                          }
                        >
                          {
                            text.insuranceCancelAnytime
                          }
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  <Text
                    style={
                      styles.practicalSummary
                    }
                    numberOfLines={2}
                  >
                    {selectedProduct.insurance_enabled
                      ? insuranceMonthlyPrice !==
                          null
                        ? `${formatPrice(
                            insuranceMonthlyPrice
                          )}${text.perMonth} · ${text.insuranceOptional}`
                        : text.insuranceOptional
                      : text.insuranceOptional}
                  </Text>
                </View>

                <Text
                  style={
                    styles.practicalChevron
                  }
                >
                  {openPracticalInfo ===
                  "insurance"
                    ? "−"
                    : "+"}
                </Text>
              </Pressable>

              {openPracticalInfo ===
              "insurance" ? (
                <View
                  style={
                    styles.practicalBody
                  }
                >
                  <Text
                    style={
                      styles.practicalSubheading
                    }
                  >
                    {
                      text.insuranceCovers
                    }
                  </Text>

                  {[
                    text.insuranceCoverDrop,
                    text.insuranceCoverLiquid,
                    text.insuranceCoverComponents,
                    text.insuranceCoverPressure,
                  ].map(
                    (
                      item,
                      index
                    ) => (
                      <View
                        key={`covered-${index}`}
                        style={
                          styles.practicalBulletRow
                        }
                      >
                        <Text
                          style={
                            styles.practicalBullet
                          }
                        >
                          ✓
                        </Text>

                        <Text
                          style={
                            styles.practicalBodyText
                          }
                        >
                          {item}
                        </Text>
                      </View>
                    )
                  )}

                  {selectedProduct.insurance_deductible !==
                  null ? (
                    <View
                      style={
                        styles.practicalDeductible
                      }
                    >
                      <Text
                        style={
                          styles.practicalDeductibleText
                        }
                      >
                        {
                          text.deductiblePerClaim
                        }
                        :{" "}
                        {formatPrice(
                          selectedProduct.insurance_deductible
                        )}
                      </Text>
                    </View>
                  ) : null}

                  <Text
                    style={[
                      styles.practicalSubheading,
                      styles.practicalSubheadingSpaced,
                    ]}
                  >
                    {
                      text.insuranceNotCovered
                    }
                  </Text>

                  {[
                    text.insuranceExcludeTheft,
                    text.insuranceExcludeCosmetic,
                    text.insuranceExcludeWear,
                    text.insuranceExcludeIntentional,
                  ].map(
                    (
                      item,
                      index
                    ) => (
                      <View
                        key={`excluded-${index}`}
                        style={
                          styles.practicalBulletRow
                        }
                      >
                        <Text
                          style={
                            styles.practicalBulletMuted
                          }
                        >
                          —
                        </Text>

                        <Text
                          style={
                            styles.practicalBodyText
                          }
                        >
                          {item}
                        </Text>
                      </View>
                    )
                  )}
                </View>
              ) : null}
            </View>

            {/* GUARANTEE */}

            <View
              style={[
                styles.practicalAccordion,
                styles.practicalAccordionLast,
              ]}
            >
              <Pressable
                onPress={() =>
                  togglePracticalInfo(
                    "guarantee"
                  )
                }
                style={
                  styles.practicalAccordionHeader
                }
              >
                <View
                  style={
                    styles.practicalHeaderCopy
                  }
                >
                  <Text
                    style={
                      styles.practicalTitle
                    }
                  >
                    {
                      text.guaranteeInfo
                    }
                  </Text>

                  <Text
                    style={
                      styles.practicalSummary
                    }
                  >
                    {selectedCondition ===
                    "refurbished"
                      ? text.guaranteeRefurbished
                      : text.guaranteeNew}
                  </Text>
                </View>

                <Text
                  style={
                    styles.practicalChevron
                  }
                >
                  {openPracticalInfo ===
                  "guarantee"
                    ? "−"
                    : "+"}
                </Text>
              </Pressable>

              {openPracticalInfo ===
              "guarantee" ? (
                <View
                  style={
                    styles.practicalBody
                  }
                >
                  <View
                    style={
                      styles.guaranteeHighlight
                    }
                  >
                    <Text
                      style={
                        styles.guaranteeNumber
                      }
                    >
                      {guaranteeMonths}
                    </Text>

                    <Text
                      style={
                        styles.guaranteeUnit
                      }
                    >
                      {
                        text.months
                      }
                    </Text>
                  </View>

                  <Text
                    style={
                      styles.practicalBodyText
                    }
                  >
                    {
                      text.guaranteeCovers
                    }
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* SPECS COLLAPSED BY DEFAULT ON MOBILE */}

          {isMobile ? (
            <Pressable
              onPress={() =>
                setShowSpecifications(
                  (current) =>
                    !current
                )
              }
              style={
                styles.specToggle
              }
            >
              <Text
                style={
                  styles.specToggleText
                }
              >
                {
                  specificationsLabel
                }
              </Text>

              <Text
                style={
                  styles.specToggleArrow
                }
              >
                {showSpecifications
                  ? "↑"
                  : "↓"}
              </Text>
            </Pressable>
          ) : null}

          {(!isMobile ||
            showSpecifications) ? (
            specifications.length >
            0 ? (
              <>
                <Text
                  style={[
                    styles.sectionHeading,
                    isMobile &&
                      styles.sectionHeadingMobile,
                  ]}
                >
                  {
                    text.specifications
                  }
                </Text>

                <View
                  style={
                    styles.specificationTable
                  }
                >
                  {specifications.map(
                    (
                      specification
                    ) => (
                      <View
                        key={
                          specification.id
                        }
                        style={[
                          styles.specificationRow,

                          isMobile &&
                            styles.specificationRowMobile,
                        ]}
                      >
                        <Text
                          style={[
                            styles.specificationName,

                            isMobile &&
                              styles.specificationNameMobile,
                          ]}
                        >
                          {
                            specification.name
                          }
                        </Text>

                        <Text
                          style={[
                            styles.specificationValue,

                            isMobile &&
                              styles.specificationValueMobile,
                          ]}
                        >
                          {
                            specification.value
                          }
                        </Text>
                      </View>
                    )
                  )}

                  <View
                    style={[
                      styles.specificationRow,
                      styles.specificationRowLast,

                      isMobile &&
                        styles.specificationRowMobile,
                    ]}
                  >
                    <Text
                      style={[
                        styles.specificationName,

                        isMobile &&
                          styles.specificationNameMobile,
                      ]}
                    >
                      {
                        text.warranty
                      }
                    </Text>

                    <Text
                      style={[
                        styles.specificationValue,

                        isMobile &&
                          styles.specificationValueMobile,
                      ]}
                    >
                      {
                        guaranteeMonths
                      }{" "}
                      {text.months}
                    </Text>
                  </View>
                </View>
              </>
            ) : (
              <View
                style={
                  styles.specs
                }
              >
                {selectedProduct.model ? (
                  <Text
                    style={
                      styles.spec
                    }
                  >
                    {text.model}:{" "}
                    {
                      selectedProduct.model
                    }
                  </Text>
                ) : null}

                <Text
                  style={
                    styles.spec
                  }
                >
                  {text.warranty}:{" "}
                  {
                    guaranteeMonths
                  }{" "}
                  {text.months}
                </Text>
              </View>
            )
          ) : null}
        </View>
      </View>
    </ScrollView>
  );
}

/* =========================================================
   STYLES
========================================================= */

const styles =
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor:
        colors.bg,
    },

    content: {
      width: "100%",
      maxWidth: 1180,
      alignSelf: "center",
      paddingHorizontal: 20,
      paddingBottom: 42,
    },

    contentMobile: {
      paddingHorizontal: 12,
      paddingBottom: 34,
    },

    centerContent: {
      width: "100%",
      maxWidth: 1180,
      alignSelf: "center",
      paddingHorizontal: 20,
      paddingVertical: 80,
      alignItems: "center",
      justifyContent: "center",
    },

    loadingText: {
      marginTop: 14,
      color: colors.ink70,
      fontWeight: "800",
    },

    errorText: {
      color: colors.ink70,
      marginTop: 10,
      textAlign: "center",
    },

    header: {
      paddingVertical: 18,
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
    },

    headerMobile: {
      paddingTop: 54,
      paddingBottom: 14,
      paddingHorizontal: 4,
    },

    headerActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },

    backButton: {
      paddingVertical: 6,
      paddingRight: 10,
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

    page: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 24,
    },

    pageMobile: {
      flexDirection: "column",
      flexWrap: "nowrap",
      gap: 12,
      width: "100%",
    },

    mobileProductPreview: {
      width: "100%",
      height: 190,
      marginTop: 14,
      marginBottom: 8,
      borderRadius: 20,
      backgroundColor:
        "#F5F7FF",
      borderWidth: 1,
      borderColor:
        colors.ink06,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      position: "relative",
    },

    mobileProductPreviewGlow: {
      position: "absolute",
      width: 170,
      height: 170,
      borderRadius: 85,
      backgroundColor:
        "rgba(0,87,255,0.055)",
    },

    mobileProductPreviewImage: {
      width: "72%",
      maxWidth: 235,
      height: 168,
      zIndex: 2,
    },

    mobileProductPreviewFallback: {
      width: "100%",
      height: "100%",
      paddingHorizontal: 20,
      alignItems: "center",
      justifyContent: "center",
      zIndex: 2,
    },

    visual: {
      flexGrow: 1,
      flexBasis: 320,
      backgroundColor:
        colors.white,
      borderRadius: 32,
      borderWidth: 1,
      borderColor:
        colors.ink12,
      padding: 40,
      alignItems: "center",
      justifyContent: "center",
      minHeight: 560,
      position: "relative",
      overflow: "hidden",
    },

    visualGlow: {
      position: "absolute",
      width: 380,
      height: 380,
      borderRadius: 190,
      backgroundColor:
        "rgba(0,87,255,0.06)",
    },

    productImage: {
      width: "100%",
      maxWidth: 430,
      height: 460,
      alignSelf: "center",
      zIndex: 2,
    },

    imageFallback: {
      minHeight: 320,
      width: "100%",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 2,
    },

    imageFallbackText: {
      color: colors.blue,
      fontWeight: "900",
      letterSpacing: 2,
      fontSize: 20,
    },

    imageFallbackSubText: {
      color: colors.ink70,
      fontWeight: "800",
      marginTop: 10,
      textAlign: "center",
    },

    selectedColorName: {
      color: colors.ink40,
      fontWeight: "900",
      marginTop: 18,
      zIndex: 2,
    },

    info: {
      flexGrow: 1,
      flexBasis: 420,
      backgroundColor:
        colors.white,
      borderRadius: 32,
      borderWidth: 1,
      borderColor:
        colors.ink12,
      padding: 26,
      minWidth: 0,
    },

    infoMobile: {
      flexGrow: 0,
      flexBasis: "auto",
      width: "100%",
      minWidth: 0,
      borderRadius: 24,
      padding: 18,
      overflow: "hidden",
    },

    metaRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
      gap: 10,
      flexWrap: "wrap",
    },

    brand: {
      color: colors.blue,
      fontWeight: "900",
      letterSpacing: 1.5,
      fontSize: 12,
    },

    brandMobile: {
      fontSize: 10,
      letterSpacing: 1.3,
    },

    stockPill: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
    },

    stockPillAvailable: {
      backgroundColor:
        "#ECFDF3",
    },

    stockPillUnavailable: {
      backgroundColor:
        "#FEF3F2",
    },

    stockPillText: {
      fontSize: 11,
      fontWeight: "900",
    },

    stockText: {
      color: colors.good,
      fontWeight: "900",
    },

    outOfStockText: {
      color: "#B42318",
      fontWeight: "900",
    },

    title: {
      fontSize: 42,
      lineHeight: 46,
      fontWeight: "900",
      color: colors.ink,
      letterSpacing: -1.5,
      marginTop: 10,
    },

    titleMobile: {
      fontSize: 31,
      lineHeight: 34,
      letterSpacing: -1.1,
      marginTop: 8,
    },

    tagline: {
      fontSize: 17,
      color: colors.ink70,
      lineHeight: 26,
      marginTop: 12,
      marginBottom: 22,
    },

    taglineMobile: {
      fontSize: 14,
      lineHeight: 21,
      marginTop: 9,
      marginBottom: 12,
    },

    promotionBox: {
      backgroundColor:
        "#FFF4ED",
      borderWidth: 1,
      borderColor:
        "#FFD6AE",
      borderRadius: 16,
      padding: 14,
      marginBottom: 14,
    },

    promotionBoxMobile: {
      padding: 12,
      marginBottom: 8,
    },

    promotionLabel: {
      color: "#B54708",
      fontSize: 10,
      fontWeight: "900",
      letterSpacing: 1,
    },

    promotionPrices: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginTop: 5,
    },

    oldPrice: {
      color: colors.ink40,
      textDecorationLine:
        "line-through",
      fontWeight: "700",
    },

    promotionPrice: {
      color: "#B42318",
      fontSize: 20,
      fontWeight: "900",
    },

    label: {
      color: colors.ink40,
      fontSize: 12,
      fontWeight: "900",
      letterSpacing: 1.2,
      marginTop: 18,
      marginBottom: 10,
      textTransform:
        "uppercase",
    },

    labelMobile: {
      fontSize: 10,
      letterSpacing: 1.4,
      marginTop: 15,
      marginBottom: 8,
    },

    row: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },

    choice: {
      backgroundColor:
        colors.bg,
      borderWidth: 1,
      borderColor:
        colors.ink12,
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 11,
    },

    choiceMobile: {
      paddingHorizontal: 13,
      paddingVertical: 10,
    },

    choiceActive: {
      borderColor:
        colors.blue,
      backgroundColor:
        colors.blueLt,
    },

    choiceSoldOut: {
      opacity: 0.48,
    },

    choiceText: {
      color: colors.ink,
      fontWeight: "900",
    },

    choiceTextSoldOut: {
      color: colors.ink40,
    },

    conditionChoice: {
      flexGrow: 1,
      flexBasis: 170,
      backgroundColor:
        colors.bg,
      borderWidth: 1,
      borderColor:
        colors.ink12,
      borderRadius: 16,
      paddingHorizontal: 14,
      paddingVertical: 13,
    },

    conditionChoiceMobile: {
      flexBasis: 145,
      paddingHorizontal: 12,
      paddingVertical: 11,
    },

    conditionSubText: {
      color: colors.ink40,
      fontSize: 11,
      fontWeight: "700",
      marginTop: 3,
    },

    refurbInfoBox: {
      marginTop: 14,
      padding: 14,
      borderRadius: 18,
      backgroundColor:
        colors.blueLt,
      borderWidth: 1,
      borderColor:
        "rgba(0,87,255,0.25)",
    },

    refurbInfoBoxMobile: {
      marginTop: 12,
      padding: 12,
    },

    refurbInfoTitle: {
      color: colors.ink,
      fontWeight: "900",
      marginBottom: 4,
    },

    refurbInfoText: {
      color: colors.ink70,
      lineHeight: 20,
      fontSize: 13,
    },

    gradeList: {
      gap: 8,
    },

    gradeChoice: {
      backgroundColor:
        colors.bg,
      borderWidth: 1,
      borderColor:
        colors.ink12,
      borderRadius: 16,
      paddingHorizontal: 14,
      paddingVertical: 13,
      flexDirection: "row",
      justifyContent:
        "space-between",
      alignItems: "center",
    },

    gradeChoiceMobile: {
      paddingHorizontal: 12,
      paddingVertical: 11,
    },

    gradeChoiceActive: {
      borderColor:
        colors.ink,
      backgroundColor:
        "#F3EEFF",
    },

    gradeChoiceUnavailable: {
      opacity: 0.48,
    },

    gradeLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      flex: 1,
    },

    radio: {
      width: 14,
      height: 14,
      borderRadius: 7,
      borderWidth: 1.5,
      borderColor:
        colors.ink40,
    },

    radioActive: {
      borderColor:
        colors.ink,
      backgroundColor:
        colors.ink,
    },

    gradeTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },

    gradeTitle: {
      color: colors.ink,
      fontWeight: "900",
    },

    gradeDescription: {
      color: colors.ink40,
      fontSize: 12,
      marginTop: 2,
      maxWidth: 340,
    },

    popularBadge: {
      backgroundColor:
        colors.limeLt,
      color: "#233300",
      fontSize: 10,
      fontWeight: "900",
      paddingHorizontal: 7,
      paddingVertical: 3,
      borderRadius: 999,
      overflow: "hidden",
    },

    gradePriceColumn: {
      alignItems: "flex-end",
      justifyContent: "center",
      marginLeft: 12,
      minWidth: 82,
    },

    gradeOldPrice: {
      color: colors.ink40,
      fontSize: 11,
      fontWeight: "700",
      textDecorationLine:
        "line-through",
      marginBottom: 2,
    },

    gradePrice: {
      color: colors.ink,
      fontWeight: "900",
      marginLeft: 10,
    },

    gradePriceUnavailable: {
      color: colors.ink40,
      fontSize: 12,
    },

    colorSectionRow: {
      gap: 7,
    },

    colorSwatchRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "center",
      gap: 8,
    },

    colorSwatchButton: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
      borderColor:
        "transparent",
      position: "relative",
    },

    colorSwatchButtonMobile: {
      width: 38,
      height: 38,
      borderRadius: 19,
    },

    colorSwatchButtonActive: {
      borderColor:
        colors.blue,
    },

    colorSwatch: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 1,
      borderColor:
        "rgba(16,24,40,0.18)",
    },

    colorSwatchMobile: {
      width: 28,
      height: 28,
      borderRadius: 14,
    },

    colorSwatchSoldOut: {
      opacity: 0.38,
    },

    swatchSoldOutLine: {
      position: "absolute",
      width: 23,
      height: 1.5,
      backgroundColor:
        "#C65A55",
      transform: [
        {
          rotate: "-45deg",
        },
      ],
    },

    selectedColorLabel: {
      color: colors.ink70,
      fontSize: 12,
      fontWeight: "800",
      marginTop: 2,
    },

    storageRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },

    storageChoice: {
      backgroundColor:
        colors.bg,
      borderWidth: 1,
      borderColor:
        colors.ink12,
      borderRadius: 14,
      paddingHorizontal: 15,
      paddingVertical: 11,
      alignItems: "center",
      minWidth: 95,
    },

    storageChoiceMobile: {
      flexGrow: 1,
      flexBasis: 94,
      minWidth: 0,
      paddingHorizontal: 8,
      paddingVertical: 10,
    },

    storageChoiceTextMobile: {
      fontSize: 14,
    },

    storagePrice: {
      color: colors.ink70,
      fontSize: 10,
      fontWeight: "700",
      marginTop: 3,
    },

    soldOutSmall: {
      color: "#B42318",
      fontSize: 9,
      fontWeight: "800",
      marginTop: 3,
    },

    insurance: {
      marginTop: 16,
      padding: 14,
      borderRadius: 16,
      backgroundColor:
        colors.bg,
      borderWidth: 1,
      borderColor:
        colors.ink12,
    },

    insuranceMobile: {
      marginTop: 14,
      padding: 12,
      borderRadius: 16,
    },

    insuranceActive: {
      backgroundColor:
        colors.blueLt,
      borderColor:
        colors.blue,
    },

    insuranceHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },

    insuranceTitle: {
      fontWeight: "900",
      color: colors.ink,
    },

    insuranceTitleMobile: {
      fontSize: 14,
    },

    insuranceText: {
      color: colors.ink70,
      marginTop: 4,
    },

    insuranceTextMobile: {
      fontSize: 13,
    },

    insuranceDeductible: {
      color: colors.ink40,
      marginTop: 3,
      fontSize: 11,
      fontWeight: "700",
    },

    priceBox: {
      marginTop: 24,
      borderTopWidth: 1,
      borderTopColor:
        colors.ink12,
      paddingTop: 20,
    },

    priceBoxMobile: {
      marginTop: 18,
      paddingTop: 16,
    },

    checkoutOldPrice: {
      color: colors.ink40,
      textDecorationLine:
        "line-through",
      fontSize: 17,
      fontWeight: "700",
      marginBottom: 2,
    },

    price: {
      color: colors.blue,
      fontSize: 32,
      fontWeight: "900",
    },

    priceMobile: {
      fontSize: 30,
      lineHeight: 34,
      letterSpacing: -1,
    },

    priceSub: {
      color: colors.ink40,
      marginTop: 4,
      marginBottom: 10,
      fontWeight: "700",
      fontSize: 13,
    },

    batteryPriceNote: {
      color: colors.ink70,
      fontSize: 12,
      fontWeight: "700",
      marginTop: 4,
    },

    buttonRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
      marginTop: 16,
    },

    buttonRowMobile: {
      flexDirection:
        "column-reverse",
      flexWrap: "nowrap",
      gap: 9,
      marginTop: 14,
    },

    addButton: {
      flexGrow: 1,
      flexBasis: 180,
      backgroundColor:
        colors.ink,
      borderRadius: 18,
      paddingVertical: 16,
      alignItems: "center",
      justifyContent: "center",
    },

    addButtonMobile: {
      flexGrow: 0,
      flexBasis: "auto",
      width: "100%",
      minHeight: 54,
      paddingVertical: 14,
      backgroundColor:
        colors.white,
      borderWidth: 1,
      borderColor:
        colors.ink,
    },

    disabledButton: {
      opacity: 0.45,
    },

    addButtonText: {
      color: colors.white,
      fontWeight: "900",
      fontSize: 16,
    },

    addButtonTextMobile: {
      color: colors.ink,
    },

    checkoutButton: {
      flexGrow: 1,
      flexBasis: 180,
      backgroundColor:
        colors.blue,
      borderRadius: 18,
      paddingVertical: 16,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor:
        colors.blue,
    },

    checkoutButtonMobile: {
      flexGrow: 0,
      flexBasis: "auto",
      width: "100%",
      minHeight: 58,
      paddingVertical: 15,
    },

    checkoutButtonText: {
      color: colors.white,
      fontWeight: "900",
      fontSize: 16,
    },

    practicalSection: {
      marginTop: 20,
      borderWidth: 1,
      borderColor:
        colors.ink12,
      borderRadius: 20,
      overflow: "hidden",
      backgroundColor:
        colors.white,
    },

    practicalSectionMobile: {
      marginTop: 16,
      borderRadius: 18,
    },

    practicalHeading: {
      color: colors.ink,
      fontSize: 18,
      fontWeight: "900",
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 10,
    },

    practicalHeadingMobile: {
      fontSize: 16,
      paddingHorizontal: 14,
      paddingTop: 14,
      paddingBottom: 8,
    },

    practicalAccordion: {
      borderTopWidth: 1,
      borderTopColor:
        colors.ink06,
    },

    practicalAccordionLast: {
      borderBottomWidth: 0,
    },

    practicalAccordionHeader: {
      minHeight: 68,
      paddingHorizontal: 16,
      paddingVertical: 13,
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
      gap: 14,
    },

    practicalHeaderCopy: {
      flex: 1,
      minWidth: 0,
    },

    practicalTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      flexWrap: "wrap",
      gap: 8,
    },

    practicalTitle: {
      color: colors.ink,
      fontSize: 14,
      fontWeight: "900",
    },

    practicalSummary: {
      color: colors.ink40,
      fontSize: 12,
      lineHeight: 17,
      fontWeight: "700",
      marginTop: 4,
    },

    practicalChevron: {
      width: 28,
      textAlign: "center",
      color: colors.blue,
      fontSize: 22,
      lineHeight: 24,
      fontWeight: "700",
    },

    practicalBody: {
      paddingHorizontal: 16,
      paddingTop: 2,
      paddingBottom: 16,
      gap: 9,
    },

    practicalSubheading: {
      color: colors.ink,
      fontSize: 12,
      fontWeight: "900",
      marginBottom: 1,
    },

    practicalSubheadingSpaced: {
      marginTop: 9,
    },

    practicalBulletRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 9,
    },

    practicalBullet: {
      width: 18,
      color: colors.good,
      fontSize: 13,
      lineHeight: 19,
      fontWeight: "900",
    },

    practicalBulletMuted: {
      width: 18,
      color: colors.ink40,
      fontSize: 13,
      lineHeight: 19,
      fontWeight: "900",
    },

    practicalBodyText: {
      flex: 1,
      color: colors.ink70,
      fontSize: 12,
      lineHeight: 19,
      fontWeight: "600",
    },

    cancelBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 999,
      backgroundColor:
        "#EAF8EE",
    },

    cancelBadgeText: {
      color: colors.good,
      fontSize: 9,
      fontWeight: "900",
      letterSpacing: 0.2,
    },

    practicalDeductible: {
      marginTop: 4,
      paddingHorizontal: 10,
      paddingVertical: 9,
      borderRadius: 12,
      backgroundColor:
        colors.bg,
      borderWidth: 1,
      borderColor:
        colors.ink06,
    },

    practicalDeductibleText: {
      color: colors.ink,
      fontSize: 11,
      fontWeight: "900",
    },

    guaranteeHighlight: {
      alignSelf: "flex-start",
      flexDirection: "row",
      alignItems: "flex-end",
      gap: 5,
      marginBottom: 2,
    },

    guaranteeNumber: {
      color: colors.blue,
      fontSize: 34,
      lineHeight: 36,
      fontWeight: "900",
      letterSpacing: -1.2,
    },

    guaranteeUnit: {
      color: colors.ink40,
      fontSize: 12,
      fontWeight: "900",
      paddingBottom: 4,
    },

    specToggle: {
      marginTop: 14,
      minHeight: 50,
      paddingHorizontal: 14,
      borderRadius: 15,
      borderWidth: 1,
      borderColor:
        colors.ink12,
      backgroundColor:
        colors.bg,
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
    },

    specToggleText: {
      color: colors.ink,
      fontSize: 14,
      fontWeight: "900",
    },

    specToggleArrow: {
      color: colors.blue,
      fontSize: 16,
      fontWeight: "900",
    },

    sectionHeading: {
      color: colors.ink,
      fontSize: 18,
      fontWeight: "900",
      marginTop: 26,
      marginBottom: 10,
    },

    sectionHeadingMobile: {
      fontSize: 16,
      marginTop: 18,
      marginBottom: 9,
    },

    specificationTable: {
      borderWidth: 1,
      borderColor:
        colors.ink12,
      borderRadius: 16,
      overflow: "hidden",
    },

    specificationRow: {
      flexDirection: "row",
      justifyContent:
        "space-between",
      gap: 16,
      paddingHorizontal: 14,
      paddingVertical: 11,
      borderBottomWidth: 1,
      borderBottomColor:
        colors.ink06,
    },

    specificationRowMobile: {
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },

    specificationRowLast: {
      borderBottomWidth: 0,
    },

    specificationName: {
      flex: 0.4,
      color: colors.ink40,
      fontSize: 13,
      fontWeight: "800",
    },

    specificationNameMobile: {
      flex: 0.4,
      fontSize: 12,
      minWidth: 0,
    },

    specificationValue: {
      flex: 0.6,
      color: colors.ink,
      fontSize: 13,
      fontWeight: "700",
      textAlign: "right",
    },

    specificationValueMobile: {
      flex: 0.6,
      fontSize: 12,
      lineHeight: 17,
      minWidth: 0,
      flexShrink: 1,
    },

    specs: {
      marginTop: 18,
      gap: 6,
    },

    spec: {
      color: colors.ink70,
      fontSize: 14,
    },

    leaseNotifyBox: {
      marginTop: 16,
      padding: 16,
      borderRadius: 20,
      backgroundColor:
        colors.bg,
      borderWidth: 1,
      borderColor:
        colors.ink12,
      gap: 10,
    },

    leaseNotifyTitle: {
      color: colors.ink,
      fontSize: 16,
      fontWeight: "900",
    },

    leaseSelection: {
      color: colors.ink70,
      fontSize: 13,
      fontWeight: "700",
    },

    leaseInput: {
      minHeight: 50,
      backgroundColor:
        colors.white,
      borderRadius: 14,
      borderWidth: 1,
      borderColor:
        colors.ink12,
      paddingHorizontal: 14,
      color: colors.ink,
      fontSize: 15,
      outlineStyle:
        "none" as any,
    },

    notifyButton: {
      backgroundColor:
        colors.ink,
      borderRadius: 16,
      minHeight: 54,
      paddingHorizontal: 22,
      paddingVertical: 15,
      alignItems: "center",
      justifyContent: "center",
    },

    notifyButtonSuccess: {
      backgroundColor:
        colors.good,
    },

    notifyButtonText: {
      color: colors.white,
      fontSize: 15,
      fontWeight: "900",
    },

    button: {
      backgroundColor:
        colors.ink,
      paddingHorizontal: 18,
      paddingVertical: 14,
      borderRadius: 16,
      alignSelf: "center",
      marginTop: 18,
    },

    buttonText: {
      color: colors.white,
      fontWeight: "900",
    },
  });
