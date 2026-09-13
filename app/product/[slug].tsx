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
} from "react-native";

import { useCart } from "../../src/context/CartContext";

import {
  findProductVariant,
  getAvailableColorsByCondition,
  getColorImage,
  getDefaultSellCondition,
  getProductColors,
  getProductSellConditions,
  getPublicProductBySlug,
  getPublicProductSpecifications,
  getPublicProductVariants,
  getStorageOptionsForColor,
  tryGetPublicVariantNormalPriceByCondition,
  tryGetPublicVariantPriceByCondition,
  variantHasPromotionByCondition,
  variantIsPurchasableByCondition,
  type PublicProduct,
  type PublicProductColor,
  type PublicProductSpecification,
  type PublicProductStorage,
  type PublicProductVariant,
  type PublicSellCondition,
} from "../../src/services/productService";

import { colors } from "../../src/theme/colors";

import type {
  PaymentMode,
  Phone,
  PhoneBrand,
  PhoneCondition,
} from "../../src/types/phone";

import { formatCurrency } from "../../src/utils/formatCurrency";

/* =========================================================
   TYPES
========================================================= */

type RefurbishedGrade =
  | "correct"
  | "good"
  | "excellent"
  | "premium";

type BatteryGrade =
  | "optimal"
  | "new";

/* =========================================================
   REFURBISHED OPTIONS
========================================================= */

/*
 * IMPORTANT
 *
 * Cosmetic grade does NOT change the base product price.
 *
 * Supabase product_variants remains the source of truth
 * for the actual refurbished selling price.
 *
 * If Lumina later needs different inventory and pricing
 * for Correct / Good / Excellent / Premium, those grades
 * should become database-backed variants/options.
 */

const refurbishedGrades: Array<{
  id: RefurbishedGrade;
  label: string;
  description: string;
  popular?: boolean;
}> = [
  {
    id: "correct",
    label: "Correct",
    description:
      "Visible signs of use · fully tested",
  },
  {
    id: "good",
    label: "Good",
    description:
      "Light signs of use · fully tested",
  },
  {
    id: "excellent",
    label: "Excellent",
    description:
      "Very light signs of use",
    popular: true,
  },
  {
    id: "premium",
    label: "Premium",
    description:
      "Top condition · near-new look",
  },
];

const batteryGrades: Array<{
  id: BatteryGrade;
  label: string;
  description: string;
  priceIncrease: number;
  popular?: boolean;
}> = [
  {
    id: "optimal",
    label: "Optimal",
    description:
      "Optimal battery life with the existing battery · No additional environmental impact",
    priceIncrease: 0,
    popular: true,
  },
  {
    id: "new",
    label: "New battery",
    description:
      "Fresh replacement battery for maximum battery capacity",
    priceIncrease: 89,
  },
];

/* =========================================================
   HELPERS
========================================================= */

function normalize(
  value:
    | string
    | null
    | undefined
) {
  return (
    value ??
    ""
  )
    .trim()
    .toLowerCase();
}

function safeMoney(
  value: number
) {
  return (
    Math.round(
      (
        value +
        Number.EPSILON
      ) *
        100
    ) /
    100
  );
}

function resolvePhoneBrand(
  brand: string
): PhoneBrand {
  const normalizedBrand =
    normalize(
      brand
    );

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
   * Compatibility fallback required by the
   * current PhoneBrand type.
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
      (
        specification
      ) =>
        normalize(
          specification.name
        ) ===
        normalize(
          name
        )
    )?.value ??
    null
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
  const params =
    useLocalSearchParams<{
      slug?:
        | string
        | string[];
    }>();

  const slug =
    Array.isArray(
      params.slug
    )
      ? params.slug[0]
      : params.slug;

  const {
    addItem,
  } =
    useCart();

  /* =======================================================
     SUPABASE STATE
  ======================================================= */

  const [
    product,
    setProduct,
  ] =
    useState<
      PublicProduct | null
    >(
      null
    );

  const [
    variants,
    setVariants,
  ] =
    useState<
      PublicProductVariant[]
    >(
      []
    );

  const [
    specifications,
    setSpecifications,
  ] =
    useState<
      PublicProductSpecification[]
    >(
      []
    );

  const [
    loading,
    setLoading,
  ] =
    useState(
      true
    );

  const [
    loadError,
    setLoadError,
  ] =
    useState<
      string | null
    >(
      null
    );

  const [
    imageError,
    setImageError,
  ] =
    useState(
      false
    );

  /* =======================================================
     CONFIGURATION
  ======================================================= */

  const [
    selectedColorName,
    setSelectedColorName,
  ] =
    useState(
      ""
    );

  const [
    selectedStorageLabel,
    setSelectedStorageLabel,
  ] =
    useState(
      ""
    );

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
    useState(
      36
    );

  const [
    insurance,
    setInsurance,
  ] =
    useState(
      false
    );

  const [
    addedToCart,
    setAddedToCart,
  ] =
    useState(
      false
    );

  const [
    leaseEmail,
    setLeaseEmail,
  ] =
    useState(
      ""
    );

  const [
    leaseSubmitted,
    setLeaseSubmitted,
  ] =
    useState(
      false
    );

  /* =======================================================
     LOAD PRODUCT
  ======================================================= */

  useEffect(
    () => {
      let active =
        true;

      async function loadProduct() {
        if (
          !slug
        ) {
          if (
            active
          ) {
            setProduct(
              null
            );

            setVariants(
              []
            );

            setSpecifications(
              []
            );

            setLoadError(
              "Product not found."
            );

            setLoading(
              false
            );
          }

          return;
        }

        try {
          setLoading(
            true
          );

          setLoadError(
            null
          );

          setImageError(
            false
          );

          const productData =
            await getPublicProductBySlug(
              slug
            );

          if (
            !active
          ) {
            return;
          }

          if (
            !productData
          ) {
            setProduct(
              null
            );

            setVariants(
              []
            );

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

          if (
            !active
          ) {
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
           * Prefer an actually purchasable variant.
           *
           * If stock is currently zero across the product,
           * fall back to the first Supabase variant so the
           * customer can still inspect the configuration.
           */
          const preferredVariant =
            variantData.find(
              (
                variant
              ) =>
                variantIsPurchasableByCondition(
                  productData,
                  variant,
                  defaultCondition
                )
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

          console.log(
            "LUMINA PRODUCT:",
            productData
          );

          console.log(
            "LUMINA VARIANTS:",
            variantData
          );

          console.log(
            "LUMINA SPECIFICATIONS:",
            specificationData
          );
        } catch (
          error
        ) {
          console.error(
            "Failed to load Lumina product:",
            error
          );

          if (
            !active
          ) {
            return;
          }

          setProduct(
            null
          );

          setVariants(
            []
          );

          setSpecifications(
            []
          );

          setLoadError(
            "This product could not be loaded."
          );
        } finally {
          if (
            active
          ) {
            setLoading(
              false
            );
          }
        }
      }

      loadProduct();

      return () => {
        active =
          false;
      };
    },
    [
      slug,
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
        if (
          !product
        ) {
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

  /*
   * Ensure selected condition remains valid when another
   * product is loaded.
   */
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
      (
        grade
      ) =>
        grade.id ===
        refurbishedGrade
    ) ??
    refurbishedGrades[2];

  const selectedBatteryGrade =
    batteryGrades.find(
      (
        grade
      ) =>
        grade.id ===
        batteryGrade
    ) ??
    batteryGrades[0];

  /* =======================================================
     ALL COLORS — SUPABASE ONLY
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
     AVAILABLE COLORS FOR CURRENT CONDITION
  ======================================================= */

  const availableColorOptions =
    useMemo<
      PublicProductColor[]
    >(
      () => {
        if (
          !product
        ) {
          return [];
        }

        return getAvailableColorsByCondition(
          product,
          variants,
          selectedCondition
        );
      },
      [
        product,
        variants,
        selectedCondition,
      ]
    );

  const availableColorNames =
    useMemo(
      () =>
        new Set(
          availableColorOptions.map(
            (
              color
            ) =>
              normalize(
                color.name
              )
          )
        ),
      [
        availableColorOptions,
      ]
    );

  /* =======================================================
     STORAGE OPTIONS FOR SELECTED COLOR
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
     KEEP CONDITION / COLOR / STORAGE VALID
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

      /*
       * Current variant is already valid.
       */
      if (
        selectedVariant &&
        variantIsPurchasableByCondition(
          product,
          selectedVariant,
          selectedCondition
        )
      ) {
        return;
      }

      /*
       * First try to preserve selected colour.
       */
      const sameColorVariant =
        variants.find(
          (
            variant
          ) =>
            normalize(
              variant.color
            ) ===
              normalize(
                selectedColorName
              ) &&
            variantIsPurchasableByCondition(
              product,
              variant,
              selectedCondition
            )
        );

      /*
       * Otherwise choose the first purchasable
       * combination for the condition.
       */
      const firstAvailableVariant =
        variants.find(
          (
            variant
          ) =>
            variantIsPurchasableByCondition(
              product,
              variant,
              selectedCondition
            )
        );

      const preferred =
        sameColorVariant ??
        firstAvailableVariant;

      if (
        preferred
      ) {
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
      }
    },
    [
      product,
      variants,
      selectedVariant,
      selectedCondition,
      selectedColorName,
      selectedStorageLabel,
    ]
  );

  /* =======================================================
     KEEP STORAGE VALID FOR COLOR
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
          (
            option
          ) =>
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

      const preferred =
        storageOptions.find(
          (
            option
          ) =>
            option.available
        ) ??
        storageOptions[0];

      setSelectedStorageLabel(
        preferred.label
      );
    },
    [
      product,
      selectedColorName,
      selectedStorageLabel,
      storageOptions,
    ]
  );

  /* =======================================================
     COLOR AVAILABILITY
  ======================================================= */

  function colorHasStock(
    colorName: string
  ) {
    if (
      !product
    ) {
      return false;
    }

    return availableColorNames.has(
      normalize(
        colorName
      )
    );
  }

  /* =======================================================
     STORAGE AVAILABILITY
  ======================================================= */

  function storageHasStock(
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

    if (
      !variant
    ) {
      return false;
    }

    return variantIsPurchasableByCondition(
      product,
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
      ]
    );

  /* =======================================================
     FINAL UNIT PRICE
  ======================================================= */

  const batteryPriceIncrease =
    selectedCondition ===
    "refurbished"
      ? selectedBatteryGrade.priceIncrease
      : 0;

  const unitPrice =
    useMemo(
      () => {
        if (
          databaseActivePrice ===
          null
        ) {
          return 0;
        }

        return safeMoney(
          databaseActivePrice +
            batteryPriceIncrease
        );
      },
      [
        databaseActivePrice,
        batteryPriceIncrease,
      ]
    );

  /* =======================================================
     PROMOTION
  ======================================================= */

  const hasPromotion =
    useMemo(
      () => {
        if (
          !product ||
          !selectedVariant
        ) {
          return false;
        }

        return variantHasPromotionByCondition(
          product,
          selectedVariant,
          selectedCondition
        );
      },
      [
        product,
        selectedVariant,
        selectedCondition,
      ]
    );

  /* =======================================================
     STOCK
  ======================================================= */

  const selectedStock =
    selectedVariant
      ? Math.max(
          0,
          Number(
            selectedVariant.stock ??
              0
          )
        )
      : 0;

  const selectedAvailable =
    Boolean(
      product &&
      selectedVariant &&
      databaseActivePrice !==
        null &&
      variantIsPurchasableByCondition(
        product,
        selectedVariant,
        selectedCondition
      )
    );

  /* =======================================================
     IMAGE — SUPABASE ONLY
  ======================================================= */

  const selectedImageUrl =
    useMemo(
      () => {
        if (
          !product
        ) {
          return null;
        }

        /*
         * 1. Exact storage + colour variant.
         */
        if (
          selectedVariant?.image_url
        ) {
          return selectedVariant.image_url;
        }

        /*
         * 2. Any migrated image for this colour.
         */
        if (
          selectedColorName
        ) {
          const colorImage =
            getColorImage(
              product,
              variants,
              selectedColorName
            );

          if (
            colorImage
          ) {
            return colorImage;
          }
        }

        /*
         * 3. Product-level Supabase image.
         */
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
      setImageError(
        false
      );
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

  /* =======================================================
     PAYMENT MODE VALIDATION
  ======================================================= */

  useEffect(
    () => {
      if (
        !product
      ) {
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

  if (
    loading
  ) {
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
          Loading product...
        </Text>
      </ScrollView>
    );
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (
    loadError
  ) {
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
          Product unavailable.
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
              Back to catalog
            </Text>
          </Pressable>
        </Link>
      </ScrollView>
    );
  }

  /* =======================================================
     NOT FOUND
  ======================================================= */

  if (
    !product
  ) {
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
          Product not found.
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
              Back to catalog
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
    "Smartphone";

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
            (
              color
            ) => ({
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
                "Default",

              hex:
                "#D9D9D9",
            },
          ],

    storage:
      storageOptions.length >
      0
        ? storageOptions.map(
            (
              storage
            ) => ({
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
                "Default",

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
        "Smartphone",

      chip:
        getSpecificationValue(
          specifications,
          "chip"
        ) ??
        getSpecificationValue(
          specifications,
          "processor"
        ) ??
        "Not specified",

      camera:
        getSpecificationValue(
          specifications,
          "camera"
        ) ??
        getSpecificationValue(
          specifications,
          "cameras"
        ) ??
        "Not specified",

      battery:
        getSpecificationValue(
          specifications,
          "battery"
        ) ??
        "Not specified",

      ram:
        getSpecificationValue(
          specifications,
          "ram"
        ) ??
        "Not specified",

      os:
        getSpecificationValue(
          specifications,
          "os"
        ) ??
        (
          normalize(
            selectedProduct.brand
          ) ===
          "apple"
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
      ? `${selectedStorageLabel} · ${selectedRefurbishedGrade.label} · Battery ${selectedBatteryGrade.label}`
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
        (
          variant
        ) =>
          normalize(
            variant.color
          ) ===
          normalize(
            colorName
          )
      );

    const preferred =
      colorVariants.find(
        (
          variant
        ) =>
          variantIsPurchasableByCondition(
            selectedProduct,
            variant,
            selectedCondition
          )
      ) ??
      colorVariants[0];

    if (
      preferred
    ) {
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

    /*
     * Reset the battery when moving back to new.
     */
    if (
      condition ===
      "new"
    ) {
      setBatteryGrade(
        "optimal"
      );
    }

    resetMessages();
  }

  /* =======================================================
     ADD TO CART
  ======================================================= */

  function handleAddToCart() {
    if (
      !selectedAvailable ||
      !selectedVariant ||
      databaseActivePrice ===
        null
    ) {
      return;
    }

    const cartItem = {
      id:
        `${selectedProduct.id}-${selectedVariant.id}-${selectedCondition}-${batteryGrade}-${refurbishedGrade}-${Date.now()}`,

      phone:
        cartPhone,

      colorName:
        selectedColorName ||
        "Default",

      storageLabel:
        cartStorageLabel ||
        "Default",

      paymentMode,

      months,

      insurance,

      unitPrice,

      monthlyPrice:
        paymentMode ===
        "lease"
          ? leasePrice ??
            0
          : paymentMode ===
              "installments"
            ? financingPrice ??
              0
            : 0,

      quantity:
        1,
    };

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

        productId:
          selectedProduct.id,

        variantId:
          selectedVariant.id,

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

  return (
    <ScrollView
      style={
        styles.screen
      }
      contentContainerStyle={
        styles.content
      }
    >
      {/* ===================================================
          HEADER
      =================================================== */}

      <View
        style={
          styles.header
        }
      >
        <Link
          href={
            "/catalog" as any
          }
          asChild
        >
          <Pressable>
            <Text
              style={
                styles.back
              }
            >
              ← Back to catalog
            </Text>
          </Pressable>
        </Link>

        <Text
          style={
            styles.logo
          }
        >
          LUMINA
        </Text>
      </View>

      <View
        style={
          styles.page
        }
      >
        {/* =================================================
            PRODUCT IMAGE
        ================================================= */}

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
                LUMINA
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

        {/* =================================================
            INFORMATION
        ================================================= */}

        <View
          style={
            styles.info
          }
        >
          <Text
            style={
              styles.brand
            }
          >
            {selectedProduct.brand.toUpperCase()}{" "}
            ·{" "}
            {selectedCondition ===
            "new"
              ? "NEW"
              : selectedProduct.condition ===
                  "used"
                ? "USED"
                : "REFURBISHED"}
          </Text>

          <Text
            style={
              styles.title
            }
          >
            {
              selectedProduct.name
            }
          </Text>

          <Text
            style={
              styles.tagline
            }
          >
            {
              displayDescription
            }
          </Text>

          {/* ===============================================
              PROMOTION
          =============================================== */}

          {hasPromotion &&
          databaseNormalPrice !==
            null &&
          databaseActivePrice !==
            null &&
          databaseNormalPrice >
            databaseActivePrice ? (
            <View
              style={
                styles.promotionBox
              }
            >
              <Text
                style={
                  styles.promotionLabel
                }
              >
                PROMOTION
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
                  {formatCurrency(
                    databaseNormalPrice
                  )}
                </Text>

                <Text
                  style={
                    styles.promotionPrice
                  }
                >
                  {formatCurrency(
                    databaseActivePrice
                  )}
                </Text>
              </View>
            </View>
          ) : null}

          {/* ===============================================
              STOCK
          =============================================== */}

          <View
            style={
              styles.stockBox
            }
          >
            {selectedAvailable ? (
              <Text
                style={[
                  styles.stockText,

                  selectedStock <=
                    2 &&
                    styles.lowStockText,
                ]}
              >
                {selectedStock <=
                2
                  ? `Only ${selectedStock} left`
                  : `${selectedStock} in stock`}
              </Text>
            ) : (
              <Text
                style={
                  styles.outOfStockText
                }
              >
                Sold out
              </Text>
            )}
          </View>

          {/* ===============================================
              CONDITION
          =============================================== */}

          {conditionOptions.length >
          1 ? (
            <>
              <Text
                style={
                  styles.label
                }
              >
                Condition
              </Text>

              <View
                style={
                  styles.row
                }
              >
                {conditionOptions.map(
                  (
                    condition
                  ) => (
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
                          ? "New"
                          : "Refurbished"}
                      </Text>

                      <Text
                        style={
                          styles.conditionSubText
                        }
                      >
                        {condition ===
                        "new"
                          ? "Brand-new device"
                          : "Checked device · lower price"}
                      </Text>
                    </Pressable>
                  )
                )}
              </View>
            </>
          ) : null}

          {/* ===============================================
              REFURBISHED OPTIONS
          =============================================== */}

          {selectedCondition ===
          "refurbished" ? (
            <>
              <View
                style={
                  styles.refurbInfoBox
                }
              >
                <Text
                  style={
                    styles.refurbInfoTitle
                  }
                >
                  Professionally checked
                </Text>

                <Text
                  style={
                    styles.refurbInfoText
                  }
                >
                  Every device is tested before dispatch.
                  Choose your preferred cosmetic condition
                  and battery option.
                </Text>
              </View>

              <Text
                style={
                  styles.label
                }
              >
                Cosmetic condition
              </Text>

              <View
                style={
                  styles.gradeList
                }
              >
                {refurbishedGrades.map(
                  (
                    grade
                  ) => {
                    const active =
                      refurbishedGrade ===
                      grade.id;

                    return (
                      <Pressable
                        key={
                          grade.id
                        }
                        onPress={() => {
                          setRefurbishedGrade(
                            grade.id
                          );

                          resetMessages();
                        }}
                        style={[
                          styles.gradeChoice,

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
                              flex:
                                1,
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
                                {
                                  grade.label
                                }
                              </Text>

                              {grade.popular ? (
                                <Text
                                  style={
                                    styles.popularBadge
                                  }
                                >
                                  Popular
                                </Text>
                              ) : null}
                            </View>

                            <Text
                              style={
                                styles.gradeDescription
                              }
                            >
                              {
                                grade.description
                              }
                            </Text>
                          </View>
                        </View>
                      </Pressable>
                    );
                  }
                )}
              </View>

              <Text
                style={
                  styles.label
                }
              >
                Battery
              </Text>

              <View
                style={
                  styles.gradeList
                }
              >
                {batteryGrades.map(
                  (
                    grade
                  ) => {
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
                              flex:
                                1,
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
                                {
                                  grade.label
                                }
                              </Text>

                              {grade.popular ? (
                                <Text
                                  style={
                                    styles.popularBadge
                                  }
                                >
                                  Popular
                                </Text>
                              ) : null}
                            </View>

                            <Text
                              style={
                                styles.gradeDescription
                              }
                            >
                              {
                                grade.description
                              }
                            </Text>
                          </View>
                        </View>

                        <Text
                          style={
                            styles.gradePrice
                          }
                        >
                          {grade.priceIncrease >
                          0
                            ? `+${formatCurrency(
                                grade.priceIncrease
                              )}`
                            : "Included"}
                        </Text>
                      </Pressable>
                    );
                  }
                )}
              </View>
            </>
          ) : null}

          {/* ===============================================
              COLOR
          =============================================== */}

          {colorOptions.length >
          0 ? (
            <>
              <Text
                style={
                  styles.label
                }
              >
                Color
              </Text>

              <View
                style={
                  styles.colorSwatchRow
                }
              >
                {colorOptions.map(
                  (
                    item
                  ) => {
                    const active =
                      normalize(
                        selectedColorName
                      ) ===
                      normalize(
                        item.name
                      );

                    const available =
                      colorHasStock(
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
                            : ", sold out"
                        }`}
                        onPress={() =>
                          selectColor(
                            item.name
                          )
                        }
                        style={[
                          styles.colorSwatchButton,

                          active &&
                            styles.colorSwatchButtonActive,
                        ]}
                      >
                        <View
                          style={[
                            styles.colorSwatch,

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
                style={
                  styles.selectedColorLabel
                }
              >
                {
                  selectedColorName
                }
              </Text>
            </>
          ) : null}

          {/* ===============================================
              STORAGE
          =============================================== */}

          {storageOptions.length >
          0 ? (
            <>
              <Text
                style={
                  styles.label
                }
              >
                Storage
              </Text>

              <View
                style={
                  styles.row
                }
              >
                {storageOptions.map(
                  (
                    item
                  ) => {
                    const active =
                      normalize(
                        selectedStorageLabel
                      ) ===
                      normalize(
                        item.label
                      );

                    const available =
                      storageHasStock(
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
                        ? tryGetPublicVariantPriceByCondition(
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

                          active &&
                            styles.choiceActive,

                          !available &&
                            styles.choiceSoldOut,
                        ]}
                      >
                        <Text
                          style={[
                            styles.choiceText,

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
                            {formatCurrency(
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
                            Sold out
                          </Text>
                        ) : null}
                      </Pressable>
                    );
                  }
                )}
              </View>
            </>
          ) : null}

          {/* ===============================================
              PAYMENT
          =============================================== */}

          <Text
            style={
              styles.label
            }
          >
            Payment
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
                Buy now
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
                  Lease
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
                  Financing
                </Text>
              </Pressable>
            ) : null}
          </View>

          {/* ===============================================
              INSURANCE
          =============================================== */}

          {selectedProduct.insurance_enabled ? (
            <View
              style={[
                styles.insurance,

                insurance &&
                  styles.insuranceActive,
              ]}
            >
              <Pressable
                onPress={() => {
                  setInsurance(
                    (
                      current
                    ) =>
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
                    flex:
                      1,
                  }}
                >
                  <Text
                    style={
                      styles.insuranceTitle
                    }
                  >
                    Protection insurance
                  </Text>

                  <Text
                    style={
                      styles.insuranceText
                    }
                  >
                    {insuranceMonthlyPrice !==
                    null
                      ? `${formatCurrency(
                          insuranceMonthlyPrice
                        )}/month`
                      : selectedProduct.insurance_annual_price !==
                          null
                        ? `${formatCurrency(
                            selectedProduct.insurance_annual_price
                          )}/year`
                        : selectedProduct.insurance_single_price !==
                            null
                          ? `${formatCurrency(
                              selectedProduct.insurance_single_price
                            )} one-time`
                          : "Insurance available"}
                  </Text>

                  {selectedProduct.insurance_deductible !==
                  null ? (
                    <Text
                      style={
                        styles.insuranceDeductible
                      }
                    >
                      Deductible:{" "}
                      {formatCurrency(
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

          {/* ===============================================
              SPECIFICATIONS
          =============================================== */}

          {specifications.length >
          0 ? (
            <>
              <Text
                style={
                  styles.sectionHeading
                }
              >
                Specifications
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
                      style={
                        styles.specificationRow
                      }
                    >
                      <Text
                        style={
                          styles.specificationName
                        }
                      >
                        {
                          specification.name
                        }
                      </Text>

                      <Text
                        style={
                          styles.specificationValue
                        }
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
                  ]}
                >
                  <Text
                    style={
                      styles.specificationName
                    }
                  >
                    Warranty
                  </Text>

                  <Text
                    style={
                      styles.specificationValue
                    }
                  >
                    {
                      selectedProduct.warranty_months
                    }{" "}
                    months
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
                  Model:{" "}
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
                Warranty:{" "}
                {
                  selectedProduct.warranty_months
                }{" "}
                months
              </Text>
            </View>
          )}

          {/* ===============================================
              PRICE + CTA
          =============================================== */}

          <View
            style={
              styles.priceBox
            }
          >
            {paymentMode ===
            "lease" ? (
              <>
                <Text
                  style={
                    styles.price
                  }
                >
                  {leasePrice !==
                  null
                    ? `${formatCurrency(
                        leasePrice
                      )}/month`
                    : "Lease available"}
                </Text>

                {selectedProduct.lease_deposit !==
                null ? (
                  <Text
                    style={
                      styles.priceSub
                    }
                  >
                    Deposit:{" "}
                    {formatCurrency(
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
                    month lease
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
                    Interested in leasing{" "}
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
                    placeholder="Enter your email"
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
                        ? "Email saved"
                        : "Notify me"}
                    </Text>
                  </Pressable>
                </View>
              </>
            ) : paymentMode ===
              "installments" ? (
              <>
                <Text
                  style={
                    styles.price
                  }
                >
                  {financingPrice !==
                  null
                    ? `${formatCurrency(
                        financingPrice
                      )}/month`
                    : "Financing available"}
                </Text>

                {selectedProduct.financing_deposit !==
                null ? (
                  <Text
                    style={
                      styles.priceSub
                    }
                  >
                    Deposit:{" "}
                    {formatCurrency(
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
                    month term
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
                    {formatCurrency(
                      databaseNormalPrice
                    )}
                  </Text>
                ) : null}

                <Text
                  style={
                    styles.price
                  }
                >
                  {databaseActivePrice !==
                  null
                    ? formatCurrency(
                        unitPrice
                      )
                    : "Price unavailable"}
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
                    Device{" "}
                    {formatCurrency(
                      databaseActivePrice
                    )}{" "}
                    + new battery{" "}
                    {formatCurrency(
                      batteryPriceIncrease
                    )}
                  </Text>
                ) : null}

                <Text
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
                    ? ` · ${selectedRefurbishedGrade.label}`
                    : ""}
                </Text>

                <View
                  style={
                    styles.buttonRow
                  }
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
                      style={
                        styles.addButtonText
                      }
                    >
                      {databaseActivePrice ===
                      null
                        ? "Price unavailable"
                        : !selectedAvailable ||
                            !selectedVariant
                          ? "Sold out"
                          : addedToCart
                            ? "Added to cart"
                            : "Add to cart"}
                    </Text>
                  </Pressable>

                  {selectedAvailable &&
                  selectedVariant &&
                  databaseActivePrice !==
                    null ? (
                    <Link
                      href={
                        `/checkout?phone=${encodeURIComponent(
                          selectedProduct.slug
                        )}&variant=${encodeURIComponent(
                          selectedVariant.id
                        )}&condition=${encodeURIComponent(
                          selectedCondition
                        )}&color=${encodeURIComponent(
                          selectedColorName
                        )}&storage=${encodeURIComponent(
                          selectedStorageLabel
                        )}&payment=${encodeURIComponent(
                          paymentMode
                        )}&battery=${encodeURIComponent(
                          selectedCondition ===
                            "refurbished"
                            ? batteryGrade
                            : ""
                        )}&grade=${encodeURIComponent(
                          selectedCondition ===
                            "refurbished"
                            ? refurbishedGrade
                            : ""
                        )}` as any
                      }
                      asChild
                    >
                      <Pressable
                        style={
                          styles.checkoutButton
                        }
                      >
                        <Text
                          style={
                            styles.checkoutButtonText
                          }
                        >
                          Go to checkout
                        </Text>
                      </Pressable>
                    </Link>
                  ) : null}
                </View>
              </>
            )}
          </View>
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
      flex:
        1,

      backgroundColor:
        colors.bg,
    },

    content: {
      width:
        "100%",

      maxWidth:
        1180,

      alignSelf:
        "center",

      paddingHorizontal:
        20,

      paddingBottom:
        42,
    },

    centerContent: {
      width:
        "100%",

      maxWidth:
        1180,

      alignSelf:
        "center",

      paddingHorizontal:
        20,

      paddingVertical:
        80,

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    loadingText: {
      marginTop:
        14,

      color:
        colors.ink70,

      fontWeight:
        "800",
    },

    errorText: {
      color:
        colors.ink70,

      marginTop:
        10,

      textAlign:
        "center",
    },

    header: {
      paddingVertical:
        18,

      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "space-between",
    },

    back: {
      color:
        colors.ink70,

      fontWeight:
        "900",
    },

    logo: {
      color:
        colors.blue,

      fontWeight:
        "900",

      letterSpacing:
        2,
    },

    page: {
      flexDirection:
        "row",

      flexWrap:
        "wrap",

      gap:
        24,
    },

    visual: {
      flexGrow:
        1,

      flexBasis:
        320,

      backgroundColor:
        colors.white,

      borderRadius:
        32,

      borderWidth:
        1,

      borderColor:
        colors.ink12,

      padding:
        40,

      alignItems:
        "center",

      justifyContent:
        "center",

      minHeight:
        560,

      position:
        "relative",

      overflow:
        "hidden",
    },

    visualGlow: {
      position:
        "absolute",

      width:
        380,

      height:
        380,

      borderRadius:
        190,

      backgroundColor:
        "rgba(0,87,255,0.06)",
    },

    productImage: {
      width:
        "100%",

      maxWidth:
        430,

      height:
        460,

      alignSelf:
        "center",

      zIndex:
        2,
    },

    imageFallback: {
      minHeight:
        320,

      width:
        "100%",

      alignItems:
        "center",

      justifyContent:
        "center",

      zIndex:
        2,
    },

    imageFallbackText: {
      color:
        colors.blue,

      fontWeight:
        "900",

      letterSpacing:
        2,

      fontSize:
        20,
    },

    imageFallbackSubText: {
      color:
        colors.ink70,

      fontWeight:
        "800",

      marginTop:
        10,

      textAlign:
        "center",
    },

    selectedColorName: {
      color:
        colors.ink40,

      fontWeight:
        "900",

      marginTop:
        18,

      zIndex:
        2,
    },

    info: {
      flexGrow:
        1,

      flexBasis:
        420,

      backgroundColor:
        colors.white,

      borderRadius:
        32,

      borderWidth:
        1,

      borderColor:
        colors.ink12,

      padding:
        26,
    },

    brand: {
      color:
        colors.blue,

      fontWeight:
        "900",

      letterSpacing:
        1.5,

      fontSize:
        12,

      marginBottom:
        10,
    },

    title: {
      fontSize:
        42,

      lineHeight:
        46,

      fontWeight:
        "900",

      color:
        colors.ink,

      letterSpacing:
        -1.5,
    },

    tagline: {
      fontSize:
        17,

      color:
        colors.ink70,

      lineHeight:
        26,

      marginTop:
        12,

      marginBottom:
        22,
    },

    promotionBox: {
      backgroundColor:
        "#FFF4ED",

      borderWidth:
        1,

      borderColor:
        "#FFD6AE",

      borderRadius:
        16,

      padding:
        14,

      marginBottom:
        14,
    },

    promotionLabel: {
      color:
        "#B54708",

      fontSize:
        10,

      fontWeight:
        "900",

      letterSpacing:
        1,
    },

    promotionPrices: {
      flexDirection:
        "row",

      alignItems:
        "center",

      gap:
        10,

      marginTop:
        5,
    },

    oldPrice: {
      color:
        colors.ink40,

      textDecorationLine:
        "line-through",

      fontWeight:
        "700",
    },

    promotionPrice: {
      color:
        "#B42318",

      fontSize:
        20,

      fontWeight:
        "900",
    },

    stockBox: {
      marginBottom:
        8,
    },

    stockText: {
      color:
        colors.good,

      fontWeight:
        "900",
    },

    lowStockText: {
      color:
        "#B54708",
    },

    outOfStockText: {
      color:
        "#B42318",

      fontWeight:
        "900",
    },

    label: {
      color:
        colors.ink40,

      fontSize:
        12,

      fontWeight:
        "900",

      letterSpacing:
        1.2,

      marginTop:
        18,

      marginBottom:
        10,

      textTransform:
        "uppercase",
    },

    row: {
      flexDirection:
        "row",

      flexWrap:
        "wrap",

      gap:
        8,
    },

    choice: {
      backgroundColor:
        colors.bg,

      borderWidth:
        1,

      borderColor:
        colors.ink12,

      borderRadius:
        14,

      paddingHorizontal:
        14,

      paddingVertical:
        11,
    },

    choiceActive: {
      borderColor:
        colors.blue,

      backgroundColor:
        colors.blueLt,
    },

    choiceSoldOut: {
      opacity:
        0.48,
    },

    choiceText: {
      color:
        colors.ink,

      fontWeight:
        "900",
    },

    choiceTextSoldOut: {
      color:
        colors.ink40,
    },

    conditionChoice: {
      flexGrow:
        1,

      flexBasis:
        170,

      backgroundColor:
        colors.bg,

      borderWidth:
        1,

      borderColor:
        colors.ink12,

      borderRadius:
        16,

      paddingHorizontal:
        14,

      paddingVertical:
        13,
    },

    conditionSubText: {
      color:
        colors.ink40,

      fontSize:
        12,

      fontWeight:
        "700",

      marginTop:
        4,
    },

    refurbInfoBox: {
      marginTop:
        14,

      padding:
        14,

      borderRadius:
        18,

      backgroundColor:
        colors.blueLt,

      borderWidth:
        1,

      borderColor:
        "rgba(0,87,255,0.25)",
    },

    refurbInfoTitle: {
      color:
        colors.ink,

      fontWeight:
        "900",

      marginBottom:
        4,
    },

    refurbInfoText: {
      color:
        colors.ink70,

      lineHeight:
        20,

      fontSize:
        13,
    },

    gradeList: {
      gap:
        8,
    },

    gradeChoice: {
      backgroundColor:
        colors.bg,

      borderWidth:
        1,

      borderColor:
        colors.ink12,

      borderRadius:
        16,

      paddingHorizontal:
        14,

      paddingVertical:
        13,

      flexDirection:
        "row",

      justifyContent:
        "space-between",

      alignItems:
        "center",
    },

    gradeChoiceActive: {
      borderColor:
        colors.ink,

      backgroundColor:
        "#F3EEFF",
    },

    gradeLeft: {
      flexDirection:
        "row",

      alignItems:
        "center",

      gap:
        12,

      flex:
        1,
    },

    radio: {
      width:
        14,

      height:
        14,

      borderRadius:
        7,

      borderWidth:
        1.5,

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
      flexDirection:
        "row",

      alignItems:
        "center",

      gap:
        8,
    },

    gradeTitle: {
      color:
        colors.ink,

      fontWeight:
        "900",
    },

    gradeDescription: {
      color:
        colors.ink40,

      fontSize:
        12,

      marginTop:
        2,

      maxWidth:
        340,
    },

    popularBadge: {
      backgroundColor:
        colors.limeLt,

      color:
        "#233300",

      fontSize:
        10,

      fontWeight:
        "900",

      paddingHorizontal:
        7,

      paddingVertical:
        3,

      borderRadius:
        999,

      overflow:
        "hidden",
    },

    gradePrice: {
      color:
        colors.ink,

      fontWeight:
        "900",

      marginLeft:
        10,
    },

    colorSwatchRow: {
      flexDirection:
        "row",

      flexWrap:
        "wrap",

      alignItems:
        "center",

      gap:
        8,
    },

    colorSwatchButton: {
      width:
        34,

      height:
        34,

      borderRadius:
        17,

      alignItems:
        "center",

      justifyContent:
        "center",

      borderWidth:
        2,

      borderColor:
        "transparent",

      position:
        "relative",
    },

    colorSwatchButtonActive: {
      borderColor:
        colors.blue,
    },

    colorSwatch: {
      width:
        24,

      height:
        24,

      borderRadius:
        12,

      borderWidth:
        1,

      borderColor:
        "rgba(16,24,40,0.18)",
    },

    colorSwatchSoldOut: {
      opacity:
        0.38,
    },

    swatchSoldOutLine: {
      position:
        "absolute",

      width:
        23,

      height:
        1.5,

      backgroundColor:
        "#C65A55",

      transform: [
        {
          rotate:
            "-45deg",
        },
      ],
    },

    selectedColorLabel: {
      color:
        colors.ink70,

      fontSize:
        13,

      fontWeight:
        "800",

      marginTop:
        6,
    },

    storageChoice: {
      backgroundColor:
        colors.bg,

      borderWidth:
        1,

      borderColor:
        colors.ink12,

      borderRadius:
        14,

      paddingHorizontal:
        15,

      paddingVertical:
        11,

      alignItems:
        "center",

      minWidth:
        95,
    },

    storagePrice: {
      color:
        colors.ink70,

      fontSize:
        10,

      fontWeight:
        "700",

      marginTop:
        3,
    },

    soldOutSmall: {
      color:
        "#B42318",

      fontSize:
        9,

      fontWeight:
        "800",

      marginTop:
        3,
    },

    insurance: {
      marginTop:
        16,

      padding:
        14,

      borderRadius:
        16,

      backgroundColor:
        colors.bg,

      borderWidth:
        1,

      borderColor:
        colors.ink12,
    },

    insuranceActive: {
      backgroundColor:
        colors.blueLt,

      borderColor:
        colors.blue,
    },

    insuranceHeader: {
      flexDirection:
        "row",

      alignItems:
        "center",

      gap:
        12,
    },

    insuranceTitle: {
      fontWeight:
        "900",

      color:
        colors.ink,
    },

    insuranceText: {
      color:
        colors.ink70,

      marginTop:
        4,
    },

    insuranceDeductible: {
      color:
        colors.ink40,

      marginTop:
        3,

      fontSize:
        11,

      fontWeight:
        "700",
    },

    sectionHeading: {
      color:
        colors.ink,

      fontSize:
        18,

      fontWeight:
        "900",

      marginTop:
        26,

      marginBottom:
        10,
    },

    specificationTable: {
      borderWidth:
        1,

      borderColor:
        colors.ink12,

      borderRadius:
        16,

      overflow:
        "hidden",
    },

    specificationRow: {
      flexDirection:
        "row",

      justifyContent:
        "space-between",

      gap:
        16,

      paddingHorizontal:
        14,

      paddingVertical:
        11,

      borderBottomWidth:
        1,

      borderBottomColor:
        colors.ink06,
    },

    specificationRowLast: {
      borderBottomWidth:
        0,
    },

    specificationName: {
      flex:
        0.4,

      color:
        colors.ink40,

      fontSize:
        13,

      fontWeight:
        "800",
    },

    specificationValue: {
      flex:
        0.6,

      color:
        colors.ink,

      fontSize:
        13,

      fontWeight:
        "700",

      textAlign:
        "right",
    },

    specs: {
      marginTop:
        18,

      gap:
        6,
    },

    spec: {
      color:
        colors.ink70,

      fontSize:
        14,
    },

    priceBox: {
      marginTop:
        24,

      borderTopWidth:
        1,

      borderTopColor:
        colors.ink12,

      paddingTop:
        20,
    },

    checkoutOldPrice: {
      color:
        colors.ink40,

      textDecorationLine:
        "line-through",

      fontSize:
        17,

      fontWeight:
        "700",

      marginBottom:
        2,
    },

    price: {
      color:
        colors.blue,

      fontSize:
        32,

      fontWeight:
        "900",
    },

    priceSub: {
      color:
        colors.ink40,

      marginTop:
        4,

      marginBottom:
        10,

      fontWeight:
        "700",
    },

    batteryPriceNote: {
      color:
        colors.ink70,

      fontSize:
        12,

      fontWeight:
        "700",

      marginTop:
        4,
    },

    buttonRow: {
      flexDirection:
        "row",

      flexWrap:
        "wrap",

      gap:
        10,

      marginTop:
        16,
    },

    addButton: {
      flexGrow:
        1,

      flexBasis:
        180,

      backgroundColor:
        colors.ink,

      borderRadius:
        18,

      paddingVertical:
        16,

      alignItems:
        "center",
    },

    disabledButton: {
      opacity:
        0.45,
    },

    addButtonText: {
      color:
        colors.white,

      fontWeight:
        "900",

      fontSize:
        16,
    },

    checkoutButton: {
      flexGrow:
        1,

      flexBasis:
        180,

      backgroundColor:
        colors.blueLt,

      borderRadius:
        18,

      paddingVertical:
        16,

      alignItems:
        "center",

      borderWidth:
        1,

      borderColor:
        colors.blue,
    },

    checkoutButtonText: {
      color:
        colors.blue,

      fontWeight:
        "900",

      fontSize:
        16,
    },

    leaseNotifyBox: {
      marginTop:
        16,

      padding:
        16,

      borderRadius:
        20,

      backgroundColor:
        colors.bg,

      borderWidth:
        1,

      borderColor:
        colors.ink12,

      gap:
        10,
    },

    leaseNotifyTitle: {
      color:
        colors.ink,

      fontSize:
        16,

      fontWeight:
        "900",
    },

    leaseSelection: {
      color:
        colors.ink70,

      fontSize:
        13,

      fontWeight:
        "700",
    },

    leaseInput: {
      minHeight:
        50,

      backgroundColor:
        colors.white,

      borderRadius:
        14,

      borderWidth:
        1,

      borderColor:
        colors.ink12,

      paddingHorizontal:
        14,

      color:
        colors.ink,

      fontSize:
        15,

      outlineStyle:
        "none" as any,
    },

    notifyButton: {
      backgroundColor:
        colors.ink,

      borderRadius:
        16,

      minHeight:
        54,

      paddingHorizontal:
        22,

      paddingVertical:
        15,

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    notifyButtonSuccess: {
      backgroundColor:
        colors.good,
    },

    notifyButtonText: {
      color:
        colors.white,

      fontSize:
        15,

      fontWeight:
        "900",
    },

    button: {
      backgroundColor:
        colors.ink,

      paddingHorizontal:
        18,

      paddingVertical:
        14,

      borderRadius:
        16,

      alignSelf:
        "center",

      marginTop:
        18,
    },

    buttonText: {
      color:
        colors.white,

      fontWeight:
        "900",
    },
  });