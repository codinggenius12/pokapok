import { Link, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Header from "../../src/components/layout/Header";
import PhoneVisual from "../../src/components/phone/PhoneVisual";
import { useCurrency } from "../../src/context/CurrencyStore";
import { useLanguage } from "../../src/context/LanguageContext";
import { phones } from "../../src/data/phones";

import {
  getLowestPublicVariantRefurbishedGradePrice,
  getProductSellConditions,
  getPublicProducts,
  getPublicProductVariants,
  type PublicProduct,
  type PublicProductVariant,
  type PublicSellCondition,
} from "../../src/services/productService";

import { colors } from "../../src/theme/colors";

type ConditionFilter =
  | "all"
  | "new"
  | "refurbished"
  | "used";

type PriceFilter =
  | "all"
  | "under300"
  | "300to500"
  | "500to800"
  | "800plus";

type CatalogItem = {
  id: string;
  slug: string;
  name: string;
  brand: string;

  condition:
    | "new"
    | "refurbished"
    | "used";

  live: PublicProduct;

  legacyPhone?: (typeof phones)[number];
};

function formatBrandLabel(brand: string) {
  if (!brand) {
    return "";
  }

  return (
    brand.charAt(0).toUpperCase() +
    brand.slice(1).toLowerCase()
  );
}

export default function CatalogScreen() {
  const {
    brand: brandParam,
    condition: conditionParam,
    maxPrice: maxPriceParam,
    sort: sortParam,
  } = useLocalSearchParams<{
    brand?: string | string[];
    condition?: string | string[];
    maxPrice?: string | string[];
    sort?: string | string[];
  }>();

  const rawMaxPrice =
    Array.isArray(maxPriceParam)
      ? maxPriceParam[0]
      : maxPriceParam;

  const parsedMaxPrice =
    rawMaxPrice
      ? Number(rawMaxPrice)
      : null;

  const maxPriceFromUrl =
    parsedMaxPrice !== null &&
    Number.isFinite(
      parsedMaxPrice
    ) &&
    parsedMaxPrice > 0
      ? parsedMaxPrice
      : null;

  const rawSort =
    Array.isArray(sortParam)
      ? sortParam[0]
      : sortParam;

  const requestedSort =
    rawSort
      ?.trim()
      .toLowerCase() ?? "";

  const {
    t,
    language,
  } = useLanguage();

  const {
    formatPrice,
  } = useCurrency(
    language
  );

  const insets =
    useSafeAreaInsets();

  const {
    width,
  } = useWindowDimensions();

  const isMobile =
    width <= 767;

  const mobileCardWidth =
    Math.min(
      Math.max(
        width * 0.74,
        260
      ),
      300
    );

  const [brand, setBrand] = useState("all");

  const [condition, setCondition] =
    useState<ConditionFilter>("all");

  const [priceFilter, setPriceFilter] =
    useState<PriceFilter>("all");

  const [
    showFilters,
    setShowFilters,
  ] = useState(false);

  const [query, setQuery] = useState("");

  const [
    supabaseProducts,
    setSupabaseProducts,
  ] = useState<PublicProduct[]>([]);

  const [
    variantsByProductId,
    setVariantsByProductId,
  ] = useState<
    Record<
      string,
      PublicProductVariant[]
    >
  >({});

  const [
    loadingProducts,
    setLoadingProducts,
  ] = useState(true);

  const [
    productsError,
    setProductsError,
  ] = useState<string | null>(null);

  const [
    failedImages,
    setFailedImages,
  ] = useState<Record<string, boolean>>({});

  /* =========================================================
     LOAD LIVE PRODUCTS
  ========================================================= */

  useEffect(() => {
    let active = true;

    async function loadProducts() {
      try {
        setLoadingProducts(true);
        setProductsError(null);

        const data =
          await getPublicProducts();

        const variantEntries =
          await Promise.all(
            data.map(
              async (product) => {
                try {
                  const variants =
                    await getPublicProductVariants(
                      product.id
                    );

                  return [
                    product.id,
                    variants,
                  ] as const;
                } catch (error) {
                  console.warn(
                    `Could not load variants for ${product.name}:`,
                    error
                  );

                  return [
                    product.id,
                    [],
                  ] as const;
                }
              }
            )
          );

        if (!active) {
          return;
        }

        setSupabaseProducts(data);

        setVariantsByProductId(
          Object.fromEntries(
            variantEntries
          )
        );

        console.log(
          "SUPABASE PRODUCTS:",
          data
        );

        console.log(
          "SUPABASE PRODUCT VARIANTS:",
          Object.fromEntries(
            variantEntries
          )
        );
      } catch (error) {
        console.error(
          "Failed to load live catalogue:",
          error
        );

        if (!active) {
          return;
        }

        setProductsError(
          "Live product information could not be loaded."
        );
      } finally {
        if (active) {
          setLoadingProducts(false);
        }
      }
    }

    loadProducts();

    return () => {
      active = false;
    };
  }, []);

  /* =========================================================
     CATALOG ITEMS

     Supabase is the source of truth.

     phones.ts is currently only used for legacy
     visual/specification enrichment.
  ========================================================= */

  const catalogItems =
    useMemo<CatalogItem[]>(() => {
      const legacyMap = new Map(
        phones.map((phone) => [
          phone.slug,
          phone,
        ])
      );

      return supabaseProducts
        .filter(
          (product) =>
            product.published
        )
        .map((product) => {
          const legacyPhone =
            legacyMap.get(
              product.slug
            );

          return {
            id: product.id,
            slug: product.slug,
            name: product.name,
            brand: product.brand,
            condition:
              product.condition,
            live: product,
            legacyPhone,
          };
        })
        .sort(
          (a, b) =>
            Number(
              b.live.featured
            ) -
            Number(
              a.live.featured
            )
        );
    }, [supabaseProducts]);

  /* =========================================================
     DYNAMIC BRANDS
  ========================================================= */

  const brands = useMemo(() => {
    const uniqueBrands =
      Array.from(
        new Set(
          catalogItems.map(
            (item) =>
              item.brand.toLowerCase()
          )
        )
      ).sort();

    return [
      "all",
      ...uniqueBrands,
    ];
  }, [catalogItems]);

  /* =========================================================
     BRAND FROM URL

     Allows links such as:
     /catalog?brand=apple
     /catalog?brand=samsung
     /catalog?brand=all

     The brand is only selected after the live catalogue has
     loaded and the requested brand actually exists.
  ========================================================= */

  useEffect(() => {
    const rawBrand =
      Array.isArray(brandParam)
        ? brandParam[0]
        : brandParam;

    const requestedBrand =
      rawBrand
        ?.trim()
        .toLowerCase();

    if (!requestedBrand) {
      return;
    }

    if (requestedBrand === "all") {
      setBrand("all");
      return;
    }

    if (
      brands.includes(
        requestedBrand
      )
    ) {
      setBrand(
        requestedBrand
      );
    }
  }, [
    brandParam,
    brands,
  ]);

  /* =========================================================
     CONDITION FROM URL

     Allows links such as:
     /catalog?condition=new
     /catalog?condition=refurbished
     /catalog?condition=used
     /catalog?condition=all
  ========================================================= */

  useEffect(() => {
    const rawCondition =
      Array.isArray(
        conditionParam
      )
        ? conditionParam[0]
        : conditionParam;

    const requestedCondition =
      rawCondition
        ?.trim()
        .toLowerCase();

    if (!requestedCondition) {
      return;
    }

    if (
      requestedCondition === "all" ||
      requestedCondition === "new" ||
      requestedCondition ===
        "refurbished" ||
      requestedCondition === "used"
    ) {
      setCondition(
        requestedCondition as
          ConditionFilter
      );
    }
  }, [conditionParam]);

  /* =========================================================
     CATALOGUE DISPLAY PRICE

     The price filter uses the same price that is shown on the
     product card for the currently selected condition.

     Pricing source of truth:
     Supabase product_variants only.
  ========================================================= */

  function getCatalogItemPricing(
    item: CatalogItem
  ) {
    const live =
      item.live;

    const productVariants =
      variantsByProductId[
        item.id
      ] ?? [];

    const availableVariants =
      productVariants.filter(
        (variant) =>
          variant.available
      );

    const sellConditions =
      item.condition === "used"
        ? []
        : getProductSellConditions(
            live
          );

    function getActiveDirectVariantPrice(
      variant: PublicProductVariant
    ) {
      const normalPrice =
        variant.sale_price;

      const promotionalPrice =
        variant.promotional_price;

      if (
        normalPrice === null ||
        !Number.isFinite(
          normalPrice
        ) ||
        normalPrice <= 0
      ) {
        return {
          normalPrice: null,
          activePrice: null,
        };
      }

      const activePrice =
        promotionalPrice !== null &&
        Number.isFinite(
          promotionalPrice
        ) &&
        promotionalPrice > 0 &&
        promotionalPrice <
          normalPrice
          ? promotionalPrice
          : normalPrice;

      return {
        normalPrice,
        activePrice,
      };
    }

    function getLowestDirectPrice() {
      const entries =
        availableVariants
          .map(
            getActiveDirectVariantPrice
          )
          .filter(
            (
              entry
            ) =>
              entry.activePrice !==
              null
          );

      if (
        entries.length === 0
      ) {
        return {
          normalPrice: null,
          activePrice: null,
        };
      }

      return entries.reduce(
        (
          best,
          current
        ) =>
          (
            current.activePrice ??
            Number.POSITIVE_INFINITY
          ) <
          (
            best.activePrice ??
            Number.POSITIVE_INFINITY
          )
            ? current
            : best
      );
    }

    function getNewPricing() {
      if (
        item.condition ===
          "used" ||
        (
          item.condition !==
            "new" &&
          !sellConditions.includes(
            "new"
          )
        )
      ) {
        return {
          normalPrice: null,
          activePrice: null,
        };
      }

      return getLowestDirectPrice();
    }

    function getRefurbishedPricing() {
      if (
        item.condition ===
          "used" ||
        (
          item.condition !==
            "refurbished" &&
          !sellConditions.includes(
            "refurbished"
          )
        )
      ) {
        return {
          normalPrice: null,
          activePrice: null,
        };
      }

      if (
        live.condition ===
        "refurbished"
      ) {
        return getLowestDirectPrice();
      }

      const prices =
        availableVariants
          .map(
            (
              variant
            ) =>
              getLowestPublicVariantRefurbishedGradePrice(
                variant
              )
          )
          .filter(
            (
              price
            ): price is number =>
              price !==
                null &&
              Number.isFinite(
                price
              ) &&
              price > 0
          );

      const activePrice =
        prices.length > 0
          ? Math.min(
              ...prices
            )
          : null;

      return {
        normalPrice:
          activePrice,
        activePrice,
      };
    }

    function getUsedPricing() {
      if (
        item.condition !==
        "used"
      ) {
        return {
          normalPrice: null,
          activePrice: null,
        };
      }

      return getLowestDirectPrice();
    }

    const newPricing =
      getNewPricing();

    const refurbishedPricing =
      getRefurbishedPricing();

    const usedPricing =
      getUsedPricing();

    let displayCondition:
      CatalogItem["condition"] =
        item.condition;

    let normalPrice:
      number | null =
      null;

    let activePrice:
      number | null =
      null;

    if (
      condition === "new"
    ) {
      displayCondition =
        "new";

      normalPrice =
        newPricing.normalPrice;

      activePrice =
        newPricing.activePrice;
    } else if (
      condition ===
      "refurbished"
    ) {
      displayCondition =
        "refurbished";

      normalPrice =
        refurbishedPricing.normalPrice;

      activePrice =
        refurbishedPricing.activePrice;
    } else if (
      condition === "used"
    ) {
      displayCondition =
        "used";

      normalPrice =
        usedPricing.normalPrice;

      activePrice =
        usedPricing.activePrice;
    } else {
      const candidatePrices: Array<{
        condition:
          CatalogItem["condition"];
        normalPrice:
          number | null;
        activePrice:
          number | null;
      }> = [
        {
          condition:
            "new",
          normalPrice:
            newPricing.normalPrice,
          activePrice:
            newPricing.activePrice,
        },
        {
          condition:
            "refurbished",
          normalPrice:
            refurbishedPricing.normalPrice,
          activePrice:
            refurbishedPricing.activePrice,
        },
        {
          condition:
            "used",
          normalPrice:
            usedPricing.normalPrice,
          activePrice:
            usedPricing.activePrice,
        },
      ];

      const candidates =
        candidatePrices.filter(
          (
            entry
          ) =>
            entry.activePrice !==
              null &&
            Number.isFinite(
              entry.activePrice
            ) &&
            entry.activePrice > 0
        );

      if (
        candidates.length > 0
      ) {
        const cheapest =
          candidates.reduce(
            (
              best,
              current
            ) =>
              (
                current.activePrice ??
                Number.POSITIVE_INFINITY
              ) <
              (
                best.activePrice ??
                Number.POSITIVE_INFINITY
              )
                ? current
                : best
          );

        displayCondition =
          cheapest.condition;

        normalPrice =
          cheapest.normalPrice;

        activePrice =
          cheapest.activePrice;
      }
    }

    return {
      displayCondition,
      availableVariants,
      activePrice,
      normalPrice,
      hasPromotion:
        activePrice !== null &&
        normalPrice !== null &&
        activePrice <
          normalPrice,
    };
  }

  function priceMatchesFilter(
    price: number | null
  ) {
    if (
      priceFilter === "all"
    ) {
      return true;
    }

    if (
      price === null ||
      !Number.isFinite(
        price
      )
    ) {
      return false;
    }

    switch (priceFilter) {
      case "under300":
        return price <= 300;

      case "300to500":
        return (
          price >= 300 &&
          price < 500
        );

      case "500to800":
        return (
          price >= 500 &&
          price < 800
        );

      case "800plus":
        return price >= 800;

      default:
        return true;
    }
  }

  function getPriceFilterLabel(
    item: PriceFilter
  ) {
    if (
      language === "pt"
    ) {
      switch (item) {
        case "under300":
          return `Menos de ${formatPrice(300)}`;

        case "300to500":
          return `${formatPrice(300)}–${formatPrice(499)}`;

        case "500to800":
          return `${formatPrice(500)}–${formatPrice(799)}`;

        case "800plus":
          return `${formatPrice(800)}+`;

        default:
          return "Qualquer preço";
      }
    }

    switch (item) {
      case "under300":
        return `Under ${formatPrice(300)}`;

      case "300to500":
        return `${formatPrice(300)}–${formatPrice(499)}`;

      case "500to800":
        return `${formatPrice(500)}–${formatPrice(799)}`;

      case "800plus":
        return `${formatPrice(800)}+`;

      default:
        return "Any price";
    }
  }

  /* =========================================================
     FILTER PRODUCTS
  ========================================================= */

  const filteredPhones =
    useMemo(() => {
      const q = query
        .trim()
        .toLowerCase();

      const filtered =
        catalogItems.filter(
          (item) => {
            const brandMatches =
              brand === "all" ||
              item.brand.toLowerCase() ===
                brand;

            const sellConditions =
              getProductSellConditions(
                item.live
              );

            const conditionMatches =
              condition === "all"
                ? true
                : condition === "used"
                  ? item.condition ===
                    "used"
                  : sellConditions.includes(
                      condition as
                        PublicSellCondition
                    );

            const queryMatches =
              !q ||
              item.name
                .toLowerCase()
                .includes(q) ||
              item.brand
                .toLowerCase()
                .includes(q) ||
              item.live.model
                ?.toLowerCase()
                .includes(q) ||
              item.live.storage
                ?.toLowerCase()
                .includes(q) ||
              item.live.color
                ?.toLowerCase()
                .includes(q);

            const {
              activePrice,
            } =
              getCatalogItemPricing(
                item
              );

            const priceMatches =
              priceMatchesFilter(
                activePrice
              );

            const urlMaxPriceMatches =
              maxPriceFromUrl ===
              null
                ? true
                : activePrice !==
                    null &&
                  Number.isFinite(
                    activePrice
                  ) &&
                  activePrice <=
                    maxPriceFromUrl;

            return (
              brandMatches &&
              conditionMatches &&
              queryMatches &&
              priceMatches &&
              urlMaxPriceMatches
            );
          }
        );

      if (
        requestedSort ===
        "price-asc"
      ) {
        return filtered.sort(
          (
            a,
            b
          ) => {
            const priceA =
              getCatalogItemPricing(
                a
              ).activePrice ??
              Number.POSITIVE_INFINITY;

            const priceB =
              getCatalogItemPricing(
                b
              ).activePrice ??
              Number.POSITIVE_INFINITY;

            if (
              priceA !==
              priceB
            ) {
              return (
                priceA -
                priceB
              );
            }

            return a.name.localeCompare(
              b.name
            );
          }
        );
      }

      if (
        requestedSort ===
        "price-desc"
      ) {
        return filtered.sort(
          (
            a,
            b
          ) => {
            const priceA =
              getCatalogItemPricing(
                a
              ).activePrice ??
              Number.NEGATIVE_INFINITY;

            const priceB =
              getCatalogItemPricing(
                b
              ).activePrice ??
              Number.NEGATIVE_INFINITY;

            return (
              priceB -
              priceA
            );
          }
        );
      }

      return filtered;
    }, [
      catalogItems,
      brand,
      condition,
      priceFilter,
      query,
      variantsByProductId,
      maxPriceFromUrl,
      requestedSort,
    ]);

  const hasActiveFilters =
    query.trim().length > 0 ||
    brand !== "all" ||
    condition !== "all" ||
    priceFilter !== "all";

  const activeFilterCount =
    [
      brand !== "all",
      condition !== "all",
      priceFilter !== "all",
    ].filter(Boolean).length;

  const collapsedFilterSummary =
    [
      brand !== "all"
        ? formatBrandLabel(
            brand
          )
        : null,

      condition !== "all"
        ? getConditionLabel(
            condition
          )
        : null,

      priceFilter !== "all"
        ? getPriceFilterLabel(
            priceFilter
          )
        : null,
    ]
      .filter(
        (
          item
        ): item is string =>
          Boolean(item)
      )
      .join(" · ");

  function resetAllFilters() {
    setQuery("");
    setBrand("all");
    setCondition("all");
    setPriceFilter("all");
  }

  /* =========================================================
     IMAGE FAILURE HANDLER
  ========================================================= */

  function markImageFailed(
    productId: string
  ) {
    setFailedImages(
      (current) => ({
        ...current,
        [productId]: true,
      })
    );
  }

  /* =========================================================
     CONDITION LABEL
  ========================================================= */

  function getConditionLabel(
    item: ConditionFilter
  ) {
    switch (item) {
      case "new":
        return t.catalog.new;

      case "refurbished":
        return t.catalog.refurbished;

      case "used":
        return t.catalog.used;

      default:
        return t.catalog.all;
    }
  }


  /* =========================================================
     MOBILE GROUPS

     On mobile the catalogue is grouped by brand so customers
     can browse sideways instead of scrolling through one long
     vertical stack of product cards.
  ========================================================= */

  const mobileGroups =
    useMemo(() => {
      if (
        requestedSort ===
        "price-asc" ||
        requestedSort ===
        "price-desc"
      ) {
        return [
          [
            language === "pt"
              ? "preço"
              : "price",
            filteredPhones,
          ] as [
            string,
            CatalogItem[],
          ],
        ];
      }

      const groups =
        new Map<
          string,
          CatalogItem[]
        >();

      filteredPhones.forEach(
        (item) => {
          const key =
            item.brand
              .trim()
              .toLowerCase() ||
            "other";

          const current =
            groups.get(key) ?? [];

          current.push(item);

          groups.set(
            key,
            current
          );
        }
      );

      return Array.from(
        groups.entries()
      ).sort(
        ([a], [b]) =>
          a.localeCompare(b)
      );
    }, [
      filteredPhones,
      requestedSort,
      language,
    ]);

  function getResultsLabel(
    count: number
  ) {
    if (language === "pt") {
      return count === 1
        ? "1 modelo"
        : `${count} modelos`;
    }

    return count === 1
      ? "1 model"
      : `${count} models`;
  }

  function renderCatalogCard(
    item: CatalogItem,
    compact = false
  ) {
    const live =
      item.live;

    const legacy =
      item.legacyPhone;

    const {
      displayCondition,
      availableVariants,
      activePrice,
      normalPrice,
      hasPromotion,
    } =
      getCatalogItemPricing(
        item
      );

    /*
     * CONDITION BADGES
     *
     * These describe every condition enabled for the product
     * in Supabase, not merely the condition currently being
     * used to calculate the card price.
     */
    const cardConditions:
      Array<
        "new" |
        "refurbished" |
        "used"
      > =
        item.condition ===
        "used"
          ? ["used"]
          : getProductSellConditions(
              live
            );

    /*
     * AVAILABILITY SOURCE OF TRUTH:
     * Supabase product + product_variants availability flags.
     */
    const availableFromSupabase =
      Boolean(
        live.published &&
        live.available &&
        availableVariants.length >
          0
      );

    /*
     * Purchasability is stricter than availability:
     * a valid price must exist for the condition being shown.
     */
    const purchasable =
      Boolean(
        availableFromSupabase &&
        activePrice !== null
      );

    const hasWorkingLiveImage =
      Boolean(
        live.image_url
      ) &&
      !failedImages[
        item.id
      ];

    return (
      <Link
        key={item.id}
        href={
          `/product/${item.slug}` as any
        }
        asChild
      >
        <Pressable
          style={StyleSheet.flatten([
            styles.card,

            compact &&
              styles.cardCompact,

            compact && {
              width:
                mobileCardWidth,
            },
          ])}
        >
          <View
            style={[
              styles.cardTop,
              compact &&
                styles.cardTopCompact,
            ]}
          >
            <Text
              numberOfLines={1}
              style={
                styles.cardBrand
              }
            >
              {item.brand.toUpperCase()}
            </Text>

            <View
              style={
                styles.badges
              }
            >
              {hasPromotion ? (
                <Text
                  style={[
                    styles.promotionBadge,
                    compact &&
                      styles.badgeCompact,
                  ]}
                >
                  {
                    t.catalog
                      .sale
                  }
                </Text>
              ) : null}

              {cardConditions.map(
                (
                  cardCondition
                ) => (
                  <Text
                    key={
                      cardCondition
                    }
                    style={[
                      styles.condition,

                      compact &&
                        styles.badgeCompact,

                      cardCondition ===
                      "new"
                        ? styles.new
                        : cardCondition ===
                            "used"
                          ? styles.used
                          : styles.refurbished,
                    ]}
                  >
                    {cardCondition ===
                    "new"
                      ? t.catalog.new.toUpperCase()
                      : cardCondition ===
                          "used"
                        ? t.catalog.used.toUpperCase()
                        : t.catalog.refurbished.toUpperCase()}
                  </Text>
                )
              )}
            </View>
          </View>

          <View
            style={[
              styles.phoneStage,
              compact &&
                styles.phoneStageCompact,
            ]}
          >
            {hasWorkingLiveImage ? (
              <Image
                source={{
                  uri:
                    live.image_url!,
                }}
                style={[
                  styles.productImage,
                  compact &&
                    styles.productImageCompact,
                ]}
                resizeMode="contain"
                onError={(
                  event
                ) => {
                  console.error(
                    "Product image failed to load:",
                    {
                      product:
                        item.name,

                      image_url:
                        live.image_url,

                      error:
                        event
                          .nativeEvent
                          .error,
                    }
                  );

                  markImageFailed(
                    item.id
                  );
                }}
              />
            ) : legacy ? (
              <PhoneVisual
                phone={legacy}
                variant="card"
              />
            ) : (
              <View
                style={[
                  styles.imagePlaceholder,

                  compact &&
                    styles.imagePlaceholderCompact,
                ]}
              >
                <Text
                  style={[
                    styles.imagePlaceholderBrand,

                    compact &&
                      styles.imagePlaceholderBrandCompact,
                  ]}
                >
                  {item.brand
                    .slice(
                      0,
                      1
                    )
                    .toUpperCase()}
                </Text>

                <Text
                  style={
                    styles.imagePlaceholderText
                  }
                >
                  {
                    t.catalog
                      .imageComingSoon
                  }
                </Text>
              </View>
            )}
          </View>

          <Text
            numberOfLines={
              compact
                ? 1
                : 2
            }
            style={[
              styles.cardName,
              compact &&
                styles.cardNameCompact,
            ]}
          >
            {item.name}
          </Text>

          <Text
            numberOfLines={
              compact
                ? 1
                : 2
            }
            style={[
              styles.cardSpec,
              compact &&
                styles.cardSpecCompact,
            ]}
          >
            {legacy
              ? `${legacy.specs.screen} · ${legacy.specs.chip}`
              : [
                  live.storage,
                  live.color,
                ]
                  .filter(
                    Boolean
                  )
                  .join(
                    " · "
                  ) ||
                t.catalog
                  .smartphone}
          </Text>

          {!compact ? (
            <>
              {legacy &&
              legacy.colors.length >
                0 ? (
                <View
                  style={
                    styles.colorRow
                  }
                >
                  {legacy.colors
                    .slice(0, 4)
                    .map(
                      (color) => (
                        <View
                          key={
                            color.name
                          }
                          style={[
                            styles.colorDot,
                            {
                              backgroundColor:
                                color.hex,
                            },
                          ]}
                        />
                      )
                    )}
                </View>
              ) : live.color ? (
                <Text
                  style={
                    styles.singleColor
                  }
                >
                  {live.color}
                </Text>
              ) : (
                <View
                  style={
                    styles.colorSpacer
                  }
                />
              )}

              <View
                style={
                  styles.statusRow
                }
              >
                <View
                  style={
                    styles.availabilityRow
                  }
                >
                  <View
                    style={[
                      styles.availabilityDot,

                      availableFromSupabase
                        ? styles.availabilityDotAvailable
                        : styles.availabilityDotUnavailable,
                    ]}
                  />

                  <Text
                    style={
                      availableFromSupabase
                        ? styles.availableText
                        : styles.unavailableText
                    }
                  >
                    {availableFromSupabase
                      ? t.catalog
                          .available
                      : t.catalog
                          .unavailable}
                  </Text>
                </View>
              </View>

              <View
                style={
                  styles.purchaseMethods
                }
              >
                {live.lease_enabled ? (
                  <View
                    style={
                      styles.methodBadge
                    }
                  >
                    <Text
                      style={
                        styles.methodBadgeText
                      }
                    >
                      {
                        t.catalog
                          .lease
                      }
                    </Text>
                  </View>
                ) : null}

                {live.financing_enabled ? (
                  <View
                    style={
                      styles.methodBadge
                    }
                  >
                    <Text
                      style={
                        styles.methodBadgeText
                      }
                    >
                      {
                        t.catalog
                          .financing
                      }
                    </Text>
                  </View>
                ) : null}

                {live.insurance_enabled ? (
                  <View
                    style={
                      styles.methodBadge
                    }
                  >
                    <Text
                      style={
                        styles.methodBadgeText
                      }
                    >
                      {
                        t.catalog
                          .insurance
                      }
                    </Text>
                  </View>
                ) : null}
              </View>
            </>
          ) : (
            <View
              style={
                styles.compactStatusRow
              }
            >
              <View
                style={[
                  styles.availabilityDot,

                  availableFromSupabase
                    ? styles.availabilityDotAvailable
                    : styles.availabilityDotUnavailable,
                ]}
              />

              <Text
                numberOfLines={1}
                style={
                  availableFromSupabase
                    ? styles.availableTextCompact
                    : styles.unavailableTextCompact
                }
              >
                {availableFromSupabase
                  ? t.catalog
                      .available
                  : t.catalog
                      .unavailable}
              </Text>
            </View>
          )}

          <View
            style={[
              styles.cardFooter,
              compact &&
                styles.cardFooterCompact,
            ]}
          >
            <View
              style={
                styles.priceBlock
              }
            >
              <Text
                style={[
                  styles.buyLabel,
                  compact &&
                    styles.buyLabelCompact,
                ]}
              >
                {
                  t.catalog
                    .buyNow
                }
              </Text>

              {hasPromotion ? (
                <Text
                  style={[
                    styles.oldPrice,
                    compact &&
                      styles.oldPriceCompact,
                  ]}
                >
                  {normalPrice !== null
                    ? formatPrice(
                        normalPrice
                      )
                    : ""}
                </Text>
              ) : null}

              <Text
                numberOfLines={1}
                style={[
                  styles.buyMainPrice,
                  compact &&
                    styles.buyMainPriceCompact,
                ]}
              >
                {activePrice !== null
                  ? formatPrice(
                      activePrice
                    )
                  : "—"}
              </Text>

              {!compact &&
              live.lease_enabled &&
              live.lease_monthly_price !==
                null ? (
                <Text
                  style={
                    styles.optionPriceText
                  }
                >
                  {
                    t.catalog
                      .leaseFrom
                  }{" "}
                  {formatPrice(
                    live.lease_monthly_price
                  )}
                  {
                    t.catalog
                      .perMonth
                  }
                </Text>
              ) : null}

              {!compact &&
              live.financing_enabled &&
              live.financing_monthly_price !==
                null ? (
                <Text
                  style={
                    styles.optionPriceText
                  }
                >
                  {
                    t.catalog
                      .financingFrom
                  }{" "}
                  {formatPrice(
                    live.financing_monthly_price
                  )}
                  {
                    t.catalog
                      .perMonth
                  }
                </Text>
              ) : null}

              {!compact &&
              live.insurance_enabled &&
              live.insurance_monthly_price !==
                null ? (
                <Text
                  style={
                    styles.optionPriceText
                  }
                >
                  {
                    t.catalog
                      .insuranceFrom
                  }{" "}
                  {formatPrice(
                    live.insurance_monthly_price
                  )}
                  {
                    t.catalog
                      .perMonth
                  }
                </Text>
              ) : null}
            </View>

            <View
              style={[
                styles.viewButton,

                compact &&
                  styles.viewButtonCompact,

                !purchasable &&
                  styles.viewButtonDisabled,
              ]}
            >
              <Text
                style={[
                  styles.viewButtonText,

                  compact &&
                    styles.viewButtonTextCompact,
                ]}
              >
                {t.catalog.view}
              </Text>
            </View>
          </View>
        </Pressable>
      </Link>
    );
  }


  /* =========================================================
     RENDER
  ========================================================= */

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
      <View
        style={[
          isMobile
            ? styles.mobileHeaderSafeArea
            : undefined,

          isMobile
            ? {
                paddingTop:
                  Math.max(
                    insets.top,
                    44
                  ) + 6,
              }
            : undefined,
        ]}
      >
        <Header
          showBack
          backHref="/"
        />
      </View>

      {/* =====================================================
          COMPACT HERO
      ===================================================== */}

      <View
        style={[
          styles.hero,
          isMobile &&
            styles.heroMobile,
        ]}
      >
        <View
          style={[
            styles.heroTopRow,
            isMobile &&
              styles.heroTopRowMobile,
          ]}
        >
          <Text
            style={[
              styles.kicker,
              isMobile &&
                styles.kickerMobile,
            ]}
          >
            {t.catalog.kicker}
          </Text>

          {!loadingProducts &&
          !productsError ? (
            <Text
              style={
                styles.resultCount
              }
            >
              {getResultsLabel(
                filteredPhones.length
              )}
            </Text>
          ) : null}
        </View>

        <Text
          style={[
            styles.title,
            isMobile &&
              styles.titleMobile,
          ]}
        >
          {t.catalog.title}
        </Text>

        {!isMobile ? (
          <Text
            style={
              styles.text
            }
          >
            {
              t.catalog
                .description
            }
          </Text>
        ) : null}

        {loadingProducts ? (
          <View
            style={
              styles.connectionRow
            }
          >
            <ActivityIndicator
              size="small"
            />

            <Text
              style={
                styles.syncText
              }
            >
              {
                t.catalog
                  .updating
              }
            </Text>
          </View>
        ) : productsError ? (
          <Text
            style={
              styles.errorText
            }
          >
            {
              productsError
            }
          </Text>
        ) : !isMobile ? (
          <Text
            style={
              styles.syncText
            }
          >
            {
              t.catalog
                .updated
            }
          </Text>
        ) : null}
      </View>

      {/* =====================================================
          SEARCH + COLLAPSIBLE FILTERS
      ===================================================== */}

      <View
        style={[
          styles.controls,
          isMobile &&
            styles.controlsMobile,
        ]}
      >
        <TextInput
          value={query}
          onChangeText={
            setQuery
          }
          placeholder={
            t.catalog
              .searchPlaceholder
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
          style={
            styles.filterToggleRow
          }
        >
          <Pressable
            onPress={() =>
              setShowFilters(
                (current) =>
                  !current
              )
            }
            style={
              styles.filterToggleButton
            }
          >
            <View
              style={
                styles.filterToggleCopy
              }
            >
              <View
                style={
                  styles.filterToggleTitleRow
                }
              >
                <Text
                  style={
                    styles.filterToggleTitle
                  }
                >
                  {language === "pt"
                    ? "Filtros"
                    : "Filters"}
                </Text>

                {activeFilterCount >
                0 ? (
                  <View
                    style={
                      styles.activeFilterCount
                    }
                  >
                    <Text
                      style={
                        styles.activeFilterCountText
                      }
                    >
                      {
                        activeFilterCount
                      }
                    </Text>
                  </View>
                ) : null}
              </View>

              <Text
                numberOfLines={1}
                style={
                  styles.filterToggleSummary
                }
              >
                {collapsedFilterSummary
                  ? collapsedFilterSummary
                  : language === "pt"
                    ? "Marca, condição e preço"
                    : "Brand, condition and price"}
              </Text>
            </View>

            <Text
              style={[
                styles.filterToggleChevron,
                showFilters &&
                  styles.filterToggleChevronOpen,
              ]}
            >
              ⌄
            </Text>
          </Pressable>

          {hasActiveFilters ? (
            <Pressable
              onPress={
                resetAllFilters
              }
              style={
                styles.clearFiltersButton
              }
            >
              <Text
                style={
                  styles.clearFiltersText
                }
              >
                {language === "pt"
                  ? "Limpar"
                  : "Clear"}
              </Text>
            </Pressable>
          ) : null}
        </View>

        {showFilters ? (
          <View
            style={[
              styles.filterGroups,
              isMobile &&
                styles.filterGroupsMobile,
            ]}
          >
            {/* BRAND */}

            <View
              style={[
                styles.filterGroup,
                styles.filterGroupBrand,
                isMobile &&
                  styles.filterGroupMobile,
              ]}
            >
              <Text
                style={
                  styles.filterGroupLabel
                }
              >
                {language === "pt"
                  ? "MARCA"
                  : "BRAND"}
              </Text>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={
                  false
                }
                contentContainerStyle={
                  styles.filterRail
                }
                keyboardShouldPersistTaps="handled"
              >
                {brands.map(
                  (item) => {
                    const active =
                      brand === item;

                    return (
                      <Pressable
                        key={item}
                        onPress={() =>
                          setBrand(
                            item
                          )
                        }
                        style={[
                          styles.chip,
                          isMobile &&
                            styles.chipMobile,
                          active &&
                            styles.chipActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            isMobile &&
                              styles.chipTextMobile,
                            active &&
                              styles.chipTextActive,
                          ]}
                        >
                          {item === "all"
                            ? language ===
                              "pt"
                              ? "Todas"
                              : "All brands"
                            : formatBrandLabel(
                                item
                              )}
                        </Text>
                      </Pressable>
                    );
                  }
                )}
              </ScrollView>
            </View>

            {/* CONDITION */}

            <View
              style={[
                styles.filterGroup,
                styles.filterGroupCondition,
                isMobile &&
                  styles.filterGroupMobile,
              ]}
            >
              <Text
                style={
                  styles.filterGroupLabel
                }
              >
                {language === "pt"
                  ? "CONDIÇÃO"
                  : "CONDITION"}
              </Text>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={
                  false
                }
                contentContainerStyle={
                  styles.filterRail
                }
                keyboardShouldPersistTaps="handled"
              >
                {(
                  [
                    "all",
                    "new",
                    "refurbished",
                  ] as ConditionFilter[]
                ).map(
                  (item) => {
                    const active =
                      condition ===
                      item;

                    return (
                      <Pressable
                        key={item}
                        onPress={() =>
                          setCondition(
                            item
                          )
                        }
                        style={[
                          styles.chip,
                          isMobile &&
                            styles.chipMobile,
                          active &&
                            styles.chipActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            isMobile &&
                              styles.chipTextMobile,
                            active &&
                              styles.chipTextActive,
                          ]}
                        >
                          {item === "all"
                            ? language ===
                              "pt"
                              ? "Todas"
                              : "All"
                            : getConditionLabel(
                                item
                              )}
                        </Text>
                      </Pressable>
                    );
                  }
                )}
              </ScrollView>
            </View>

            {/* PRICE */}

            <View
              style={[
                styles.filterGroup,
                styles.filterGroupPrice,
                isMobile &&
                  styles.filterGroupMobile,
              ]}
            >
              <Text
                style={
                  styles.filterGroupLabel
                }
              >
                {language === "pt"
                  ? "PREÇO"
                  : "PRICE"}
              </Text>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={
                  false
                }
                contentContainerStyle={
                  styles.filterRail
                }
                keyboardShouldPersistTaps="handled"
              >
                {(
                  [
                    "all",
                    "under300",
                    "300to500",
                    "500to800",
                    "800plus",
                  ] as PriceFilter[]
                ).map(
                  (item) => {
                    const active =
                      priceFilter ===
                      item;

                    return (
                      <Pressable
                        key={
                          `price-${item}`
                        }
                        onPress={() =>
                          setPriceFilter(
                            item
                          )
                        }
                        style={[
                          styles.chip,
                          styles.priceChip,
                          isMobile &&
                            styles.chipMobile,
                          active &&
                            styles.chipActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            isMobile &&
                              styles.chipTextMobile,
                            active &&
                              styles.chipTextActive,
                          ]}
                        >
                          {getPriceFilterLabel(
                            item
                          )}
                        </Text>
                      </Pressable>
                    );
                  }
                )}
              </ScrollView>
            </View>
          </View>
        ) : null}
      </View>

      {/* =====================================================
          CATALOG
      ===================================================== */}

      {loadingProducts ? (
        <View
          style={[
            styles.empty,
            isMobile &&
              styles.emptyMobile,
          ]}
        >
          <ActivityIndicator
            size="large"
          />

          <Text
            style={
              styles.loadingTitle
            }
          >
            {
              t.catalog
                .loading
            }
          </Text>
        </View>
      ) : filteredPhones.length ===
        0 ? (
        <View
          style={[
            styles.empty,
            isMobile &&
              styles.emptyMobile,
          ]}
        >
          <Text
            style={
              styles.emptyTitle
            }
          >
            {
              t.catalog
                .noProducts
            }
          </Text>

          <Text
            style={
              styles.emptyText
            }
          >
            {
              t.catalog
                .noProductsDescription
            }
          </Text>
        </View>
      ) : isMobile ? (
        <View
          style={
            styles.mobileCatalog
          }
        >
          {mobileGroups.map(
            ([
              brandKey,
              items,
            ]) => (
              <View
                key={
                  brandKey
                }
                style={
                  styles.mobileSection
                }
              >
                <View
                  style={
                    styles.mobileSectionHeader
                  }
                >
                  <View>
                    <Text
                      style={
                        styles.mobileSectionKicker
                      }
                    >
                      {
                        formatBrandLabel(
                          brandKey
                        )
                      }
                    </Text>

                    <Text
                      style={
                        styles.mobileSectionCount
                      }
                    >
                      {getResultsLabel(
                        items.length
                      )}
                    </Text>
                  </View>

                  <Text
                    style={
                      styles.swipeHint
                    }
                  >
                    →
                  </Text>
                </View>

                <ScrollView
                  horizontal
                  nestedScrollEnabled
                  showsHorizontalScrollIndicator={
                    false
                  }
                  decelerationRate="fast"
                  snapToInterval={
                    mobileCardWidth +
                    12
                  }
                  snapToAlignment="start"
                  contentContainerStyle={
                    styles.mobileProductRail
                  }
                >
                  {items.map(
                    (item) =>
                      renderCatalogCard(
                        item,
                        true
                      )
                  )}
                </ScrollView>
              </View>
            )
          )}
        </View>
      ) : (
        <View
          style={
            styles.grid
          }
        >
          {filteredPhones.map(
            (item) =>
              renderCatalogCard(
                item,
                false
              )
          )}
        </View>
      )}
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
      paddingHorizontal: 0,
      paddingBottom: 34,
    },

    mobileHeaderSafeArea: {
      paddingHorizontal: 16,
      paddingBottom: 6,
      backgroundColor:
        colors.bg,
    },

    hero: {
      marginTop: 28,
      marginBottom: 20,
    },

    heroMobile: {
      marginTop: 12,
      marginBottom: 12,
      paddingHorizontal: 16,
    },

    heroTopRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
      gap: 12,
    },

    heroTopRowMobile: {
      marginBottom: 5,
    },

    kicker: {
      color: colors.blue,
      fontSize: 12,
      fontWeight: "900",
      letterSpacing: 1.8,
      marginBottom: 10,
    },

    kickerMobile: {
      marginBottom: 0,
      fontSize: 10,
      letterSpacing: 1.5,
    },

    title: {
      fontSize: 46,
      lineHeight: 50,
      fontWeight: "900",
      color: colors.ink,
      letterSpacing: -1.5,
    },

    titleMobile: {
      fontSize: 30,
      lineHeight: 33,
      letterSpacing: -1,
    },

    text: {
      marginTop: 10,
      color: colors.ink70,
      fontSize: 17,
      lineHeight: 25,
      maxWidth: 680,
    },

    resultCount: {
      color: colors.ink40,
      fontSize: 11,
      fontWeight: "800",
    },

    connectionRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginTop: 8,
    },

    syncText: {
      marginTop: 8,
      color: colors.good,
      fontSize: 11,
      fontWeight: "800",
    },

    errorText: {
      marginTop: 8,
      color: "#B42318",
      fontSize: 11,
      fontWeight: "800",
    },

    controls: {
      backgroundColor:
        colors.white,
      borderRadius: 28,
      borderWidth: 1,
      borderColor:
        colors.ink12,
      padding: 16,
      gap: 14,
      marginBottom: 22,

      shadowColor: "#000",
      shadowOpacity: 0.035,
      shadowRadius: 18,
      shadowOffset: {
        width: 0,
        height: 8,
      },
    },

    controlsMobile: {
      marginHorizontal: 12,
      marginBottom: 16,
      padding: 10,
      borderRadius: 22,
      gap: 9,
    },

    input: {
      minHeight: 52,
      backgroundColor:
        colors.bg,
      borderRadius: 16,
      paddingHorizontal: 16,
      color: colors.ink,
      fontSize: 16,
      fontWeight: "700",
      outlineStyle:
        "none" as any,
    },

    inputMobile: {
      minHeight: 46,
      fontSize: 14,
      borderRadius: 14,
    },

    filterToggleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },

    filterToggleButton: {
      flex: 1,
      minHeight: 54,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 16,
      backgroundColor:
        colors.bg,
      borderWidth: 1,
      borderColor:
        colors.ink06,
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
      gap: 12,
    },

    filterToggleCopy: {
      flex: 1,
      minWidth: 0,
    },

    filterToggleTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 7,
    },

    filterToggleTitle: {
      color: colors.ink,
      fontSize: 14,
      fontWeight: "900",
      letterSpacing: -0.2,
    },

    filterToggleSummary: {
      color: colors.ink40,
      fontSize: 11,
      lineHeight: 15,
      fontWeight: "700",
      marginTop: 2,
    },

    activeFilterCount: {
      minWidth: 20,
      height: 20,
      paddingHorizontal: 6,
      borderRadius: 999,
      backgroundColor:
        colors.blue,
      alignItems: "center",
      justifyContent:
        "center",
    },

    activeFilterCountText: {
      color: colors.white,
      fontSize: 10,
      fontWeight: "900",
    },

    filterToggleChevron: {
      color: colors.blue,
      fontSize: 22,
      lineHeight: 22,
      fontWeight: "900",
      transform: [
        {
          rotate: "0deg",
        },
      ],
    },

    filterToggleChevronOpen: {
      transform: [
        {
          rotate: "180deg",
        },
      ],
    },

    clearFiltersButton: {
      minHeight: 34,
      paddingHorizontal: 12,
      borderRadius: 999,
      backgroundColor:
        colors.white,
      borderWidth: 1,
      borderColor:
        colors.ink12,
      alignItems: "center",
      justifyContent:
        "center",
    },

    clearFiltersText: {
      color: colors.blue,
      fontSize: 11,
      fontWeight: "900",
    },

    filterGroups: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
      alignItems: "stretch",
    },

    filterGroupsMobile: {
      flexDirection: "column",
      flexWrap: "nowrap",
      gap: 8,
    },

    filterGroup: {
      backgroundColor:
        colors.bg,
      borderRadius: 18,
      paddingHorizontal: 11,
      paddingTop: 10,
      paddingBottom: 11,
      borderWidth: 1,
      borderColor:
        colors.ink06,
      minWidth: 0,
    },

    filterGroupBrand: {
      flexGrow: 1,
      flexBasis: 390,
    },

    filterGroupCondition: {
      flexGrow: 1,
      flexBasis: 285,
    },

    filterGroupPrice: {
      flexGrow: 1,
      flexBasis: 430,
    },

    filterGroupMobile: {
      flexGrow: 0,
      flexBasis: "auto",
      width: "100%",
      borderRadius: 16,
      paddingHorizontal: 10,
      paddingTop: 9,
      paddingBottom: 10,
    },

    filterGroupLabel: {
      color: colors.ink40,
      fontSize: 9,
      fontWeight: "900",
      letterSpacing: 1.25,
      marginBottom: 8,
      paddingHorizontal: 2,
    },

    filterRail: {
      gap: 7,
      paddingRight: 6,
      alignItems: "center",
    },

    chip: {
      minHeight: 36,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 999,
      backgroundColor:
        colors.white,
      borderWidth: 1,
      borderColor:
        colors.ink12,
      alignItems: "center",
      justifyContent:
        "center",
    },

    chipMobile: {
      minHeight: 34,
      paddingHorizontal: 12,
      paddingVertical: 7,
    },

    priceChip: {
      minWidth: 76,
    },

    conditionChip: {
      backgroundColor:
        colors.white,
    },

    chipActive: {
      backgroundColor:
        colors.blue,
      borderColor:
        colors.blue,

      shadowColor:
        colors.blue,
      shadowOpacity: 0.14,
      shadowRadius: 8,
      shadowOffset: {
        width: 0,
        height: 4,
      },
    },

    chipText: {
      color: colors.ink70,
      fontSize: 12,
      fontWeight: "900",
    },

    chipTextMobile: {
      fontSize: 11,
    },

    chipTextActive: {
      color: colors.white,
    },

    mobileCatalog: {
      gap: 20,
    },

    mobileSection: {
      gap: 9,
    },

    mobileSectionHeader: {
      paddingHorizontal: 16,
      flexDirection: "row",
      alignItems: "flex-end",
      justifyContent:
        "space-between",
    },

    mobileSectionKicker: {
      color: colors.ink,
      fontSize: 22,
      lineHeight: 25,
      fontWeight: "900",
      letterSpacing: -0.6,
    },

    mobileSectionCount: {
      marginTop: 2,
      color: colors.ink40,
      fontSize: 11,
      fontWeight: "700",
    },

    swipeHint: {
      color: colors.blue,
      fontSize: 24,
      fontWeight: "900",
      lineHeight: 26,
    },

    mobileProductRail: {
      paddingLeft: 16,
      paddingRight: 28,
      paddingBottom: 5,
      gap: 12,
    },

    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 16,
    },

    card: {
      backgroundColor:
        colors.white,
      borderRadius: 24,
      padding: 18,
      borderWidth: 1,
      borderColor:
        colors.ink12,
      flexGrow: 1,
      flexBasis: 260,
      maxWidth: 370,
      minHeight: 500,

      shadowColor: "#000",
      shadowOpacity: 0.045,
      shadowRadius: 14,

      shadowOffset: {
        width: 0,
        height: 10,
      },
    },

    cardCompact: {
      flexGrow: 0,
      flexBasis: "auto",
      maxWidth: undefined,
      minHeight: 0,
      height: 350,
      borderRadius: 22,
      padding: 14,
    },

    cardTop: {
      flexDirection: "row",
      justifyContent:
        "space-between",
      alignItems: "center",
      marginBottom: 12,
      gap: 7,
    },

    cardTopCompact: {
      marginBottom: 5,
    },

    badges: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-end",
      flexWrap: "wrap",
      gap: 5,
      flexShrink: 1,
    },

    cardBrand: {
      fontSize: 11,
      fontWeight: "900",
      color: colors.ink40,
      letterSpacing: 1.5,
      flexShrink: 1,
    },

    promotionBadge: {
      fontSize: 10,
      fontWeight: "900",
      color: "#B42318",
      backgroundColor:
        "#FEE4E2",
      paddingHorizontal: 9,
      paddingVertical: 4,
      borderRadius: 999,
      overflow: "hidden",
    },

    condition: {
      fontSize: 10,
      fontWeight: "900",
      paddingHorizontal: 9,
      paddingVertical: 4,
      borderRadius: 999,
      overflow: "hidden",
    },

    badgeCompact: {
      fontSize: 8,
      paddingHorizontal: 7,
      paddingVertical: 3,
    },

    new: {
      color: colors.good,
      backgroundColor:
        "rgba(31,164,99,0.10)",
    },

    refurbished: {
      color: "#233300",
      backgroundColor:
        colors.limeLt,
    },

    used: {
      color: "#6941C6",
      backgroundColor:
        "#F4F3FF",
    },

    phoneStage: {
      height: 220,
      alignItems: "center",
      justifyContent:
        "center",
      marginBottom: 16,
      overflow: "hidden",
    },

    phoneStageCompact: {
      height: 154,
      marginBottom: 7,
    },

    productImage: {
      width: "100%",
      height: 210,
    },

    productImageCompact: {
      height: 148,
    },

    imagePlaceholder: {
      width: 150,
      height: 180,
      borderRadius: 22,
      backgroundColor:
        colors.bg,
      borderWidth: 1,
      borderColor:
        colors.ink12,
      alignItems: "center",
      justifyContent:
        "center",
      padding: 15,
    },

    imagePlaceholderCompact: {
      width: 110,
      height: 135,
      borderRadius: 18,
    },

    imagePlaceholderBrand: {
      fontSize: 42,
      fontWeight: "900",
      color: colors.blue,
    },

    imagePlaceholderBrandCompact: {
      fontSize: 32,
    },

    imagePlaceholderText: {
      color: colors.ink40,
      fontSize: 10,
      fontWeight: "700",
      textAlign: "center",
      marginTop: 8,
    },

    cardName: {
      fontSize: 19,
      fontWeight: "900",
      color: colors.ink,
      marginBottom: 6,
    },

    cardNameCompact: {
      fontSize: 18,
      lineHeight: 21,
      letterSpacing: -0.4,
      marginBottom: 3,
    },

    cardSpec: {
      fontSize: 13,
      color: colors.ink40,
      minHeight: 36,
    },

    cardSpecCompact: {
      fontSize: 11,
      minHeight: 16,
      lineHeight: 15,
    },

    colorRow: {
      flexDirection: "row",
      gap: 6,
      marginVertical: 14,
    },

    colorDot: {
      width: 16,
      height: 16,
      borderRadius: 8,
      borderWidth: 1,
      borderColor:
        colors.ink12,
    },

    singleColor: {
      color: colors.ink40,
      fontSize: 11,
      fontWeight: "700",
      marginVertical: 14,
    },

    colorSpacer: {
      height: 44,
    },

    statusRow: {
      minHeight: 20,
      marginBottom: 8,
    },

    availabilityRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },

    compactStatusRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      marginTop: 7,
    },

    availabilityDot: {
      width: 7,
      height: 7,
      borderRadius: 999,
    },

    availabilityDotAvailable: {
      backgroundColor:
        colors.good,
    },

    availabilityDotUnavailable: {
      backgroundColor:
        "#B42318",
    },

    availableText: {
      color: colors.good,
      fontSize: 11,
      fontWeight: "800",
    },

    unavailableText: {
      color: "#B42318",
      fontSize: 11,
      fontWeight: "800",
    },

    availableTextCompact: {
      color: colors.good,
      fontSize: 10,
      fontWeight: "800",
    },

    unavailableTextCompact: {
      color: "#B42318",
      fontSize: 10,
      fontWeight: "800",
    },

    purchaseMethods: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
      marginBottom: 12,
      minHeight: 24,
    },

    methodBadge: {
      backgroundColor:
        colors.bg,
      borderWidth: 1,
      borderColor:
        colors.ink12,
      borderRadius: 999,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },

    methodBadgeText: {
      color: colors.ink70,
      fontSize: 9,
      fontWeight: "800",
    },

    cardFooter: {
      flexDirection: "row",
      justifyContent:
        "space-between",
      alignItems: "flex-end",
      marginTop: "auto",
      borderTopWidth: 1,
      borderTopColor:
        colors.ink06,
      paddingTop: 14,
      gap: 12,
    },

    cardFooterCompact: {
      paddingTop: 9,
      gap: 8,
    },

    priceBlock: {
      flex: 1,
      minWidth: 0,
    },

    buyLabel: {
      color: colors.ink40,
      fontSize: 11,
      fontWeight: "900",
      textTransform:
        "uppercase",
      letterSpacing: 0.6,
    },

    buyLabelCompact: {
      fontSize: 9,
    },

    oldPrice: {
      color: colors.ink40,
      fontSize: 13,
      fontWeight: "700",
      textDecorationLine:
        "line-through",
      marginTop: 4,
    },

    oldPriceCompact: {
      fontSize: 10,
      marginTop: 1,
    },

    buyMainPrice: {
      color: colors.blue,
      fontSize: 24,
      fontWeight: "900",
      letterSpacing: -0.8,
      marginTop: 2,
    },

    buyMainPriceCompact: {
      fontSize: 21,
      lineHeight: 24,
      letterSpacing: -0.6,
    },

    optionPriceText: {
      color: colors.ink40,
      fontSize: 10,
      fontWeight: "800",
      marginTop: 3,
      lineHeight: 14,
    },

    viewButton: {
      backgroundColor:
        colors.ink,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
    },

    viewButtonCompact: {
      minWidth: 58,
      minHeight: 40,
      paddingHorizontal: 11,
      paddingVertical: 9,
      borderRadius: 999,
    },

    viewButtonText: {
      color: colors.white,
      fontWeight: "900",
      fontSize: 13,
    },

    viewButtonTextCompact: {
      fontSize: 11,
    },

    viewButtonDisabled: {
      opacity: 0.55,
    },

    empty: {
      backgroundColor:
        colors.white,
      borderRadius: 24,
      borderWidth: 1,
      borderColor:
        colors.ink12,
      padding: 28,
      alignItems: "center",
      justifyContent:
        "center",
      minHeight: 180,
    },

    emptyMobile: {
      marginHorizontal: 12,
      minHeight: 150,
      borderRadius: 20,
      padding: 22,
    },

    loadingTitle: {
      color: colors.ink70,
      fontSize: 14,
      fontWeight: "800",
      marginTop: 12,
    },

    emptyTitle: {
      color: colors.ink,
      fontSize: 22,
      fontWeight: "900",
      textAlign: "center",
    },

    emptyText: {
      color: colors.ink70,
      marginTop: 8,
      textAlign: "center",
    },
  });
