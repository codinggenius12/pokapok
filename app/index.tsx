import { Link, useRouter } from "expo-router";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import PhoneVisual from "../src/components/phone/PhoneVisual";
import CurrencySwitcher from "../src/components/ui/CurrencySwitcher";
import { useCart } from "../src/context/CartContext";
import { useCurrency } from "../src/context/CurrencyStore";
import { useLanguage } from "../src/context/LanguageContext";
import { phones } from "../src/data/phones";
import {
  getLowestPublicVariantRefurbishedGradePrice,
  getProductSellConditions,
  getPublicProducts,
  getPublicProductVariants,
  type PublicProduct,
  type PublicProductVariant,
  type PublicSellCondition,
} from "../src/services/productService";
import { colors } from "../src/theme/colors";

/* =========================================================
   TYPES
========================================================= */

type ConditionOption =
  | "all"
  | "new"
  | "refurbished";

type ParsedSearch = {
  raw: string;
  text: string;
  maxPrice: number | null;

  requestedCondition:
    | PublicSellCondition
    | null;

  requestedBrand:
    string | null;
};

/* =========================================================
   FILTER DATA
========================================================= */

const conditionOptions: ConditionOption[] = [
  "all",
  "new",
  "refurbished",
];

const fallbackBrandOptions =
  Array.from(
    new Set(
      phones
        .map((phone) =>
          phone.brand
            .trim()
            .toLowerCase()
        )
        .filter(Boolean)
    )
  ).sort();

function formatBrandLabel(
  brand: string
) {
  if (!brand) {
    return "";
  }

  return (
    brand.charAt(0).toUpperCase() +
    brand.slice(1).toLowerCase()
  );
}

/* =========================================================
   SEARCH HELPERS
========================================================= */

function normalizeSearchText(
  value: string
) {
  return value
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .trim()
    .toLowerCase();
}

function parseSearch(
  value: string
): ParsedSearch {
  const raw =
    value.trim();

  let normalized =
    normalizeSearchText(
      raw
    );

  let maxPrice:
    number | null =
    null;

  const budgetPatterns = [
    /(?:ate|under|below|less than|menos de|abaixo de)\s*€?\s*(\d{2,4})/i,
    /<\s*€?\s*(\d{2,4})/i,
    /€\s*(\d{2,4})/i,
  ];

  for (
    const pattern of
    budgetPatterns
  ) {
    const match =
      normalized.match(
        pattern
      );

    if (match?.[1]) {
      const parsed =
        Number(
          match[1]
        );

      if (
        Number.isFinite(
          parsed
        ) &&
        parsed > 0
      ) {
        maxPrice =
          parsed;

        normalized =
          normalized
            .replace(
              match[0],
              " "
            )
            .replace(
              /\s+/g,
              " "
            )
            .trim();

        break;
      }
    }
  }

  let requestedCondition:
    | PublicSellCondition
    | null =
    null;

  const refurbishedWords = [
    "refurbished",
    "recondicionado",
    "recondicionados",
    "recondicionada",
    "recondicionadas",
  ];

  const newWords = [
    "new",
    "novo",
    "novos",
    "nova",
    "novas",
  ];

  for (
    const word of
    refurbishedWords
  ) {
    if (
      normalized.includes(
        word
      )
    ) {
      requestedCondition =
        "refurbished";

      normalized =
        normalized
          .replace(
            word,
            " "
          )
          .replace(
            /\s+/g,
            " "
          )
          .trim();

      break;
    }
  }

  if (
    !requestedCondition
  ) {
    for (
      const word of
      newWords
    ) {
      if (
        normalized.includes(
          word
        )
      ) {
        requestedCondition =
          "new";

        normalized =
          normalized
            .replace(
              word,
              " "
            )
            .replace(
              /\s+/g,
              " "
            )
            .trim();

        break;
      }
    }
  }

  let requestedBrand:
    string | null =
    null;

  if (
    normalized.includes(
      "iphone"
    ) ||
    normalized.includes(
      "apple"
    )
  ) {
    requestedBrand =
      "apple";

    normalized =
      normalized
        .replace(
          /\biphone\b/g,
          " "
        )
        .replace(
          /\bapple\b/g,
          " "
        )
        .replace(
          /\s+/g,
          " "
        )
        .trim();
  } else if (
    normalized.includes(
      "samsung"
    ) ||
    normalized.includes(
      "galaxy"
    )
  ) {
    requestedBrand =
      "samsung";

    normalized =
      normalized
        .replace(
          /\bsamsung\b/g,
          " "
        )
        .replace(
          /\bgalaxy\b/g,
          " "
        )
        .replace(
          /\s+/g,
          " "
        )
        .trim();
  } else if (
    normalized.includes(
      "xiaomi"
    ) ||
    normalized.includes(
      "poco"
    )
  ) {
    requestedBrand =
      "xiaomi";

    normalized =
      normalized
        .replace(
          /\bxiaomi\b/g,
          " "
        )
        .replace(
          /\bpoco\b/g,
          " "
        )
        .replace(
          /\s+/g,
          " "
        )
        .trim();
  }

  return {
    raw,
    text:
      normalized,
    maxPrice,
    requestedCondition,
    requestedBrand,
  };
}

/* =========================================================
   HOME
========================================================= */

export default function HomeScreen() {
  const router =
    useRouter();

  const {
    totalItems,
  } = useCart();

  const {
    language,
    t,
    setLanguage,
  } = useLanguage();

  const {
    formatPrice,
  } = useCurrency(
    language
  );

  const {
    width,
  } =
    useWindowDimensions();

  const insets =
    useSafeAreaInsets();

  const isMobile =
    width <= 767;

  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    searchFocused,
    setSearchFocused,
  ] =
    useState(false);

  const [
    brandOptions,
    setBrandOptions,
  ] =
    useState<string[]>(
      fallbackBrandOptions
    );

  const [
    liveProducts,
    setLiveProducts,
  ] =
    useState<
      PublicProduct[]
    >([]);

  const [
    variantsByProductId,
    setVariantsByProductId,
  ] =
    useState<
      Record<
        string,
        PublicProductVariant[]
      >
    >({});

  /* =======================================================
     LOAD STOREFRONT DATA
  ======================================================= */

  useEffect(() => {
    let active =
      true;

    async function loadStorefrontData() {
      try {
        const products =
          await getPublicProducts();

        const variantEntries =
          await Promise.all(
            products.map(
              async (
                product
              ) => {
                try {
                  const variants =
                    await getPublicProductVariants(
                      product.id
                    );

                  return [
                    product.id,
                    variants,
                  ] as const;
                } catch (
                  error
                ) {
                  console.warn(
                    `Could not load homepage variants for ${product.name}:`,
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

        if (
          !active
        ) {
          return;
        }

        setLiveProducts(
          products
        );

        setVariantsByProductId(
          Object.fromEntries(
            variantEntries
          )
        );

        const liveBrands =
          Array.from(
            new Set(
              products
                .filter(
                  (
                    product
                  ) =>
                    product.published &&
                    Boolean(
                      product.brand
                    )
                )
                .map(
                  (
                    product
                  ) =>
                    product.brand
                      .trim()
                      .toLowerCase()
                )
                .filter(
                  Boolean
                )
            )
          ).sort();

        if (
          liveBrands.length >
          0
        ) {
          setBrandOptions(
            liveBrands
          );
        }
      } catch (
        error
      ) {
        console.warn(
          "Could not load homepage storefront data. Using local fallback data.",
          error
        );
      }
    }

    void loadStorefrontData();

    return () => {
      active =
        false;
    };
  }, []);

  /* =======================================================
     PRICE HELPERS
  ======================================================= */

  function getHomepagePrice(
    slug: string
  ): number | null {
    const liveProduct =
      liveProducts.find(
        (
          product
        ) =>
          product.slug ===
          slug
      );

    if (
      !liveProduct
    ) {
      return null;
    }

    const variants =
      variantsByProductId[
        liveProduct.id
      ] ?? [];

    const prices =
      variants
        .filter(
          (
            variant
          ) =>
            variant.available
        )
        .map(
          (
            variant
          ) => {
            const normalPrice =
              variant.sale_price;

            const promotionalPrice =
              variant.promotional_price;

            if (
              normalPrice ===
                null ||
              !Number.isFinite(
                normalPrice
              ) ||
              normalPrice <=
                0
            ) {
              return null;
            }

            if (
              promotionalPrice !==
                null &&
              Number.isFinite(
                promotionalPrice
              ) &&
              promotionalPrice >
                0 &&
              promotionalPrice <
                normalPrice
            ) {
              return promotionalPrice;
            }

            return normalPrice;
          }
        )
        .filter(
          (
            price
          ): price is number =>
            price !==
            null
        );

    return prices.length >
      0
      ? Math.min(
          ...prices
        )
      : null;
  }

  function getHomepageRefurbishedPrice(
    slug: string
  ): number | null {
    const liveProduct =
      liveProducts.find(
        (
          product
        ) =>
          product.slug ===
          slug
      );

    if (
      !liveProduct
    ) {
      return null;
    }

    const variants =
      variantsByProductId[
        liveProduct.id
      ] ?? [];

    const prices =
      variants
        .filter(
          (
            variant
          ) =>
            variant.available
        )
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
            null
        );

    return prices.length >
      0
      ? Math.min(
          ...prices
        )
      : null;
  }

  function getLowestPhonePrice(
    slug: string
  ): number | null {
    const newPrice =
      getHomepagePrice(
        slug
      );

    const refurbishedPrice =
      getHomepageRefurbishedPrice(
        slug
      );

    const validPrices =
      [
        newPrice,
        refurbishedPrice,
      ].filter(
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

    return validPrices.length >
      0
      ? Math.min(
          ...validPrices
        )
      : null;
  }

  function getLowestStorePrice({
    brand,
    condition,
  }: {
    brand?:
      string;

    condition:
      PublicSellCondition;
  }): number | null {
    const normalizedBrand =
      brand
        ?.trim()
        .toLowerCase();

    const prices:
      number[] = [];

    for (
      const product of
      liveProducts
    ) {
      if (
        !product.published ||
        !product.available
      ) {
        continue;
      }

      if (
        normalizedBrand &&
        product.brand
          .trim()
          .toLowerCase() !==
          normalizedBrand
      ) {
        continue;
      }

      const sellConditions =
        getProductSellConditions(
          product
        );

      if (
        !sellConditions.includes(
          condition
        )
      ) {
        continue;
      }

      const variants =
        variantsByProductId[
          product.id
        ] ?? [];

      for (
        const variant of
        variants
      ) {
        if (
          !variant.available
        ) {
          continue;
        }

        if (
          condition ===
          "refurbished"
        ) {
          const price =
            getLowestPublicVariantRefurbishedGradePrice(
              variant
            );

          if (
            price !==
              null &&
            Number.isFinite(
              price
            ) &&
            price > 0
          ) {
            prices.push(
              price
            );
          }

          continue;
        }

        const normalPrice =
          variant.sale_price;

        const promotionalPrice =
          variant.promotional_price;

        if (
          normalPrice ===
            null ||
          !Number.isFinite(
            normalPrice
          ) ||
          normalPrice <=
            0
        ) {
          continue;
        }

        const activePrice =
          promotionalPrice !==
            null &&
          Number.isFinite(
            promotionalPrice
          ) &&
          promotionalPrice >
            0 &&
          promotionalPrice <
            normalPrice
            ? promotionalPrice
            : normalPrice;

        prices.push(
          activePrice
        );
      }
    }

    return prices.length >
      0
      ? Math.min(
          ...prices
        )
      : null;
  }

  function getLowestBrandPrice(
    brand: string
  ): number | null {
    const normalizedBrand =
      brand
        .trim()
        .toLowerCase();

    const prices:
      number[] = [];

    for (
      const product of
      liveProducts
    ) {
      if (
        !product.published ||
        !product.available
      ) {
        continue;
      }

      if (
        product.brand
          .trim()
          .toLowerCase() !==
        normalizedBrand
      ) {
        continue;
      }

      const sellConditions =
        getProductSellConditions(
          product
        );

      const variants =
        variantsByProductId[
          product.id
        ] ?? [];

      for (
        const variant of
        variants
      ) {
        if (
          !variant.available
        ) {
          continue;
        }

        if (
          sellConditions.includes(
            "new"
          )
        ) {
          const normalPrice =
            variant.sale_price;

          const promotionalPrice =
            variant.promotional_price;

          if (
            normalPrice !==
              null &&
            Number.isFinite(
              normalPrice
            ) &&
            normalPrice >
              0
          ) {
            const activePrice =
              promotionalPrice !==
                null &&
              Number.isFinite(
                promotionalPrice
              ) &&
              promotionalPrice >
                0 &&
              promotionalPrice <
                normalPrice
                ? promotionalPrice
                : normalPrice;

            prices.push(
              activePrice
            );
          }
        }

        if (
          sellConditions.includes(
            "refurbished"
          )
        ) {
          const refurbishedPrice =
            getLowestPublicVariantRefurbishedGradePrice(
              variant
            );

          if (
            refurbishedPrice !==
              null &&
            Number.isFinite(
              refurbishedPrice
            ) &&
            refurbishedPrice >
              0
          ) {
            prices.push(
              refurbishedPrice
            );
          }
        }
      }
    }

    return prices.length >
      0
      ? Math.min(
          ...prices
        )
      : null;
  }

  /* =======================================================
     FEATURED DATA
  ======================================================= */

  const lowestIphonePrice =
    getLowestBrandPrice(
      "apple"
    );

  const lowestSamsungPrice =
    getLowestBrandPrice(
      "samsung"
    );

  const sortedFeaturedPhones =
    [...phones].sort(
      (
        a,
        b
      ) =>
        b.featured -
        a.featured
    );

  const featuredPhone =
    sortedFeaturedPhones.find(
      (
        phone
      ) =>
        getLowestPhonePrice(
          phone.slug
        ) !==
        null
    ) ??
    sortedFeaturedPhones[0] ??
    phones[0];

  const featuredBudgetPhone =
    [...phones]
      .filter(
        (
          phone
        ) => {
          const price =
            getLowestPhonePrice(
              phone.slug
            );

          return (
            price !==
              null &&
            price <= 300
          );
        }
      )
      .sort(
        (
          a,
          b
        ) =>
          (
            getLowestPhonePrice(
              a.slug
            ) ??
            Number.POSITIVE_INFINITY
          ) -
          (
            getLowestPhonePrice(
              b.slug
            ) ??
            Number.POSITIVE_INFINITY
          )
      )[0] ??
    featuredPhone;

  const featuredIphone =
    [...phones]
      .filter(
        (
          phone
        ) =>
          phone.brand ===
            "apple" &&
          getLowestPhonePrice(
            phone.slug
          ) !==
            null
      )
      .sort(
        (
          a,
          b
        ) =>
          (
            getLowestPhonePrice(
              a.slug
            ) ??
            Number.POSITIVE_INFINITY
          ) -
          (
            getLowestPhonePrice(
              b.slug
            ) ??
            Number.POSITIVE_INFINITY
          )
      )[0] ??
    sortedFeaturedPhones.find(
      (
        phone
      ) =>
        phone.brand ===
        "apple"
    ) ??
    featuredPhone;

  const featuredSamsung =
    [...phones]
      .filter(
        (
          phone
        ) =>
          phone.brand ===
            "samsung" &&
          getLowestPhonePrice(
            phone.slug
          ) !==
            null
      )
      .sort(
        (
          a,
          b
        ) =>
          (
            getLowestPhonePrice(
              a.slug
            ) ??
            Number.POSITIVE_INFINITY
          ) -
          (
            getLowestPhonePrice(
              b.slug
            ) ??
            Number.POSITIVE_INFINITY
          )
      )[0] ??
    sortedFeaturedPhones.find(
      (
        phone
      ) =>
        phone.brand ===
        "samsung"
    ) ??
    featuredPhone;

  const promoCardWidth =
    isMobile
      ? Math.min(
          Math.max(
            width - 52,
            290
          ),
          360
        )
      : 370;

  const promoCopy =
    language ===
      "pt"
      ? {
          budgetKicker:
            "Desde 180 €",

          budgetTitle:
            "Smartphones desde 180 €",

          budgetBody:
            "Descubra equipamentos acessíveis, novos e recondicionados, do mais barato ao mais caro.",

          budgetAction:
            "Ver desde 180 €",

          iphoneKicker:
            "IPHONE",

          iphoneTitle:
            "iPhone desde",

          iphoneBody:
            "Descubra todos os iPhones novos e recondicionados disponíveis na POKAPOK.",

          iphoneAction:
            "Ver iPhones",

          samsungKicker:
            "SAMSUNG",

          samsungTitle:
            "Galaxy desde",

          samsungBody:
            "Descubra Samsung novos e recondicionados com preços atualizados diretamente da POKAPOK.",

          samsungAction:
            "Ver Samsung",
        }
      : {
          budgetKicker:
            "FROM €180",

          budgetTitle:
            "Phones from €180",

          budgetBody:
            "Discover affordable new and refurbished phones, ordered from cheapest to most expensive.",

          budgetAction:
            "Shop from €180",

          iphoneKicker:
            "IPHONE",

          iphoneTitle:
            "iPhone from",

          iphoneBody:
            "Discover all new and refurbished iPhones available at POKAPOK.",

          iphoneAction:
            "Shop iPhones",

          samsungKicker:
            "SAMSUNG",

          samsungTitle:
            "Galaxy from",

          samsungBody:
            "Discover new and refurbished Samsung phones with live POKAPOK pricing.",

          samsungAction:
            "View Samsung",
        };

  const mobileProductCardWidth =
    Math.min(
      Math.max(
        width * 0.72,
        260
      ),
      310
    );

  /* =======================================================
     CONDITION LABEL
  ======================================================= */

  function getConditionLabel(
    condition:
      ConditionOption
  ) {
    if (
      language ===
      "pt"
    ) {
      switch (
        condition
      ) {
        case "all":
          return "Todas as condições";

        case "new":
          return "Novo";

        case "refurbished":
          return "Recondicionado";

        default:
          return condition;
      }
    }

    switch (
      condition
    ) {
      case "all":
        return "All conditions";

      case "new":
        return "New";

      case "refurbished":
        return "Refurbished";

      default:
        return condition;
    }
  }

  /* =======================================================
     SEARCH DATA
  ======================================================= */

  const parsedSearch =
    useMemo(
      () =>
        parseSearch(
          search
        ),
      [
        search,
      ]
    );

  function phoneSupportsCondition(
    slug:
      string,

    condition:
      PublicSellCondition
  ) {
    const liveProduct =
      liveProducts.find(
        (
          product
        ) =>
          product.slug ===
          slug
      );

    if (
      !liveProduct
    ) {
      const localPhone =
        phones.find(
          (
            phone
          ) =>
            phone.slug ===
            slug
        );

      return (
        localPhone
          ?.condition ===
        condition
      );
    }

    return getProductSellConditions(
      liveProduct
    ).includes(
      condition
    );
  }

  function getSearchConditionText(
    slug:
      string
  ) {
    const supportsNew =
      phoneSupportsCondition(
        slug,
        "new"
      );

    const supportsRefurbished =
      phoneSupportsCondition(
        slug,
        "refurbished"
      );

    if (
      supportsNew &&
      supportsRefurbished
    ) {
      return language ===
        "pt"
        ? "Novo ou recondicionado"
        : "New or refurbished";
    }

    if (
      supportsRefurbished
    ) {
      return language ===
        "pt"
        ? "Recondicionado"
        : "Refurbished";
    }

    return language ===
      "pt"
      ? "Novo"
      : "New";
  }

  /* =======================================================
     FILTER PRODUCTS
  ======================================================= */

  const filteredPhones =
    useMemo(
      () => {
        const {
          text,
          maxPrice,
          requestedCondition,
          requestedBrand,
        } =
          parsedSearch;

        return [
          ...phones,
        ]
          .filter(
            (
              phone
            ) => {
              if (
                requestedBrand &&
                phone.brand
                  .trim()
                  .toLowerCase() !==
                  requestedBrand
              ) {
                return false;
              }

              if (
                requestedCondition &&
                !phoneSupportsCondition(
                  phone.slug,
                  requestedCondition
                )
              ) {
                return false;
              }

              if (
                maxPrice !==
                null
              ) {
                let matchingPrice:
                  | number
                  | null =
                  null;

                if (
                  requestedCondition ===
                  "refurbished"
                ) {
                  matchingPrice =
                    getHomepageRefurbishedPrice(
                      phone.slug
                    );
                } else if (
                  requestedCondition ===
                  "new"
                ) {
                  matchingPrice =
                    getHomepagePrice(
                      phone.slug
                    );
                } else {
                  matchingPrice =
                    getLowestPhonePrice(
                      phone.slug
                    );
                }

                if (
                  matchingPrice ===
                    null ||
                  matchingPrice >
                    maxPrice
                ) {
                  return false;
                }
              }

              if (
                !text
              ) {
                return true;
              }

              const searchableText =
                normalizeSearchText(
                  [
                    phone.name,
                    phone.brand,
                    phone.condition,
                    phone.specs.screen,
                    phone.specs.chip,
                    phone.specs.camera,
                    phone.specs.battery,
                    phone.specs.ram,
                    phone.specs.os,
                    phone.tagline,
                    phone.storage
                      .map(
                        (
                          item
                        ) =>
                          item.label
                      )
                      .join(
                        " "
                      ),
                    phone.colors
                      .map(
                        (
                          item
                        ) =>
                          item.name
                      )
                      .join(
                        " "
                      ),
                  ].join(
                    " "
                  )
                );

              const terms =
                text
                  .split(
                    " "
                  )
                  .filter(
                    Boolean
                  );

              return terms.every(
                (
                  term
                ) =>
                  searchableText.includes(
                    term
                  )
              );
            }
          )
          .sort(
            (
              a,
              b
            ) =>
              b.featured -
              a.featured
          )
          .slice(
            0,
            8
          );
      },
      [
        parsedSearch,
        liveProducts,
        variantsByProductId,
      ]
    );

  const searchSuggestions =
    useMemo(
      () =>
        filteredPhones.slice(
          0,
          5
        ),
      [
        filteredPhones,
      ]
    );

  const showSearchPanel =
    searchFocused;

  /* =======================================================
     SEARCH COPY
  ======================================================= */

  const searchCopy =
    language ===
      "pt"
      ? {
          suggestions:
            "SUGESTÕES",

          quick:
            "PESQUISAS RÁPIDAS",

          noResults:
            "Nenhum equipamento encontrado",

          noResultsDescription:
            "Tente outro modelo, marca, preço ou condição.",

          from:
            "desde",

          resultsBelow:
            "Ver resultados no catálogo",

          clear:
            "Limpar",

          quickIphone:
            "iPhone",

          quickSamsung:
            "Samsung",

          quickRefurbished:
            "Recondicionados",

          quick300:
            "desde €180",

          quick400:
            "Até €400",
        }
      : {
          suggestions:
            "SUGGESTIONS",

          quick:
            "QUICK SEARCHES",

          noResults:
            "No devices found",

          noResultsDescription:
            "Try another model, brand, price or condition.",

          from:
            "from",

          resultsBelow:
            "View results in catalog",

          clear:
            "Clear",

          quickIphone:
            "iPhone",

          quickSamsung:
            "Samsung",

          quickRefurbished:
            "Refurbished",

          quick300:
            "desde 180",

          quick400:
            "Under €400",
        };

  function applyQuickSearch(
    value:
      string
  ) {
    setSearch(
      value
    );

    setSearchFocused(
      true
    );
  }

  /* =======================================================
     OPEN SEARCH IN FULL CATALOG
  ======================================================= */

  function openCatalogSearch(
    value:
      string = search
  ) {
    const cleanSearch =
      value.trim();

    setSearchFocused(
      false
    );

    if (
      !cleanSearch
    ) {
      router.push(
        "/catalog" as any
      );

      return;
    }

    router.push(
      `/catalog?search=${encodeURIComponent(
        cleanSearch
      )}` as any
    );
  }

  /* =======================================================
     SEARCH COMPONENT
  ======================================================= */

  function renderSearchBox(
    mobile:
      boolean
  ) {
    return (
      <View
        style={[
          styles.searchExperience,

          mobile &&
            styles.searchExperienceMobile,
        ]}
      >
        <View
          style={[
            styles.searchBox,

            mobile &&
              styles.searchBoxMobile,

            searchFocused &&
              styles.searchBoxFocused,
          ]}
        >
          <Text
            style={[
              styles.searchIcon,

              mobile &&
                styles.searchIconMobile,
            ]}
          >
            ⌕
          </Text>

          <TextInput
            value={
              search
            }
            onChangeText={(
              value
            ) => {
              setSearch(
                value
              );

              if (
                !searchFocused
              ) {
                setSearchFocused(
                  true
                );
              }
            }}
            onFocus={() =>
              setSearchFocused(
                true
              )
            }
            onSubmitEditing={() =>
              openCatalogSearch()
            }
            placeholder={
              t.home
                .searchPlaceholder
            }
            placeholderTextColor={
              colors.ink40
            }
            returnKeyType="search"
            autoCorrect={
              false
            }
            style={[
              styles.searchInput,

              mobile &&
                styles.searchInputMobile,
            ]}
          />

          {search ? (
            <Pressable
              onPress={() => {
                setSearch(
                  ""
                );

                setSearchFocused(
                  true
                );
              }}
              hitSlop={
                8
              }
              style={
                styles.searchClearButton
              }
            >
              <Text
                style={
                  styles.searchClearText
                }
              >
                ×
              </Text>
            </Pressable>
          ) : null}
        </View>

        {showSearchPanel ? (
          <View
            style={[
              styles.searchPanel,

              mobile &&
                styles.searchPanelMobile,
            ]}
          >
            {search.trim() ? (
              <>
                <View
                  style={
                    styles.searchPanelHeader
                  }
                >
                  <Text
                    style={
                      styles.searchPanelTitle
                    }
                  >
                    {
                      searchCopy.suggestions
                    }
                  </Text>

                  <Text
                    style={
                      styles.searchResultCount
                    }
                  >
                    {
                      filteredPhones.length
                    }
                  </Text>
                </View>

                {searchSuggestions.length >
                0 ? (
                  <>
                    <View
                      style={
                        styles.searchSuggestionList
                      }
                    >
                      {searchSuggestions.map(
                        (
                          phone
                        ) => {
                          const price =
                            parsedSearch
                              .requestedCondition ===
                            "refurbished"
                              ? getHomepageRefurbishedPrice(
                                  phone.slug
                                )
                              : parsedSearch
                                    .requestedCondition ===
                                  "new"
                                ? getHomepagePrice(
                                    phone.slug
                                  )
                                : getLowestPhonePrice(
                                    phone.slug
                                  );

                          return (
                            <Link
                              key={
                                phone.id
                              }
                              href={
                                `/product/${phone.slug}` as any
                              }
                              asChild
                            >
                              <Pressable
                                onPress={() =>
                                  setSearchFocused(
                                    false
                                  )
                                }
                                style={({
                                  pressed,
                                }) => [
                                  styles.searchSuggestionItem,

                                  pressed &&
                                    styles.searchSuggestionItemPressed,
                                ]}
                              >
                                <View
                                  style={
                                    styles.searchSuggestionInfo
                                  }
                                >
                                  <Text
                                    numberOfLines={
                                      1
                                    }
                                    style={
                                      styles.searchSuggestionBrand
                                    }
                                  >
                                    {phone.brand.toUpperCase()}
                                  </Text>

                                  <Text
                                    numberOfLines={
                                      1
                                    }
                                    style={
                                      styles.searchSuggestionName
                                    }
                                  >
                                    {
                                      phone.name
                                    }
                                  </Text>

                                  <Text
                                    numberOfLines={
                                      1
                                    }
                                    style={
                                      styles.searchSuggestionMeta
                                    }
                                  >
                                    {
                                      getSearchConditionText(
                                        phone.slug
                                      )
                                    }

                                    {phone
                                      .storage[0]
                                      ?.label
                                      ? ` · ${phone.storage[0].label}`
                                      : ""}
                                  </Text>
                                </View>

                                <View
                                  style={
                                    styles.searchSuggestionPriceArea
                                  }
                                >
                                  {price !==
                                  null ? (
                                    <>
                                      <Text
                                        style={
                                          styles.searchSuggestionFrom
                                        }
                                      >
                                        {
                                          searchCopy.from
                                        }
                                      </Text>

                                      <Text
                                        style={
                                          styles.searchSuggestionPrice
                                        }
                                      >
                                        {formatPrice(
                                          price
                                        )}
                                      </Text>
                                    </>
                                  ) : (
                                    <Text
                                      style={
                                        styles.searchSuggestionUnavailable
                                      }
                                    >
                                      —
                                    </Text>
                                  )}

                                  <Text
                                    style={
                                      styles.searchSuggestionArrow
                                    }
                                  >
                                    →
                                  </Text>
                                </View>
                              </Pressable>
                            </Link>
                          );
                        }
                      )}
                    </View>

                    <Pressable
                      onPress={() =>
                        openCatalogSearch()
                      }
                      style={
                        styles.searchSeeResultsButton
                      }
                    >
                      <Text
                        style={
                          styles.searchSeeResultsText
                        }
                      >
                        {
                          searchCopy.resultsBelow
                        }
                      </Text>

                      <Text
                        style={
                          styles.searchSeeResultsArrow
                        }
                      >
                        →
                      </Text>
                    </Pressable>
                  </>
                ) : (
                  <View
                    style={
                      styles.searchEmptyState
                    }
                  >
                    <View
                      style={
                        styles.searchEmptyIcon
                      }
                    >
                      <Text
                        style={
                          styles.searchEmptyIconText
                        }
                      >
                        ⌕
                      </Text>
                    </View>

                    <Text
                      style={
                        styles.searchEmptyTitle
                      }
                    >
                      {
                        searchCopy.noResults
                      }
                    </Text>

                    <Text
                      style={
                        styles.searchEmptyDescription
                      }
                    >
                      {
                        searchCopy.noResultsDescription
                      }
                    </Text>

                    <Pressable
                      onPress={() =>
                        setSearch(
                          ""
                        )
                      }
                      style={
                        styles.searchEmptyButton
                      }
                    >
                      <Text
                        style={
                          styles.searchEmptyButtonText
                        }
                      >
                        {
                          searchCopy.clear
                        }
                      </Text>
                    </Pressable>
                  </View>
                )}
              </>
            ) : (
              <>
                <Text
                  style={
                    styles.searchPanelTitle
                  }
                >
                  {
                    searchCopy.quick
                  }
                </Text>

                <View
                  style={
                    styles.quickSearchGrid
                  }
                >
                  <Pressable
                    onPress={() =>
                      applyQuickSearch(
                        "iPhone"
                      )
                    }
                    style={
                      styles.quickSearchChip
                    }
                  >
                    <Text
                      style={
                        styles.quickSearchIcon
                      }
                    >
                      ◉
                    </Text>

                    <Text
                      style={
                        styles.quickSearchText
                      }
                    >
                      {
                        searchCopy.quickIphone
                      }
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() =>
                      applyQuickSearch(
                        "Samsung"
                      )
                    }
                    style={
                      styles.quickSearchChip
                    }
                  >
                    <Text
                      style={
                        styles.quickSearchIcon
                      }
                    >
                      ◇
                    </Text>

                    <Text
                      style={
                        styles.quickSearchText
                      }
                    >
                      {
                        searchCopy.quickSamsung
                      }
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() =>
                      applyQuickSearch(
                        language ===
                          "pt"
                          ? "recondicionado"
                          : "refurbished"
                      )
                    }
                    style={
                      styles.quickSearchChip
                    }
                  >
                    <Text
                      style={
                        styles.quickSearchIcon
                      }
                    >
                      ↺
                    </Text>

                    <Text
                      style={
                        styles.quickSearchText
                      }
                    >
                      {
                        searchCopy.quickRefurbished
                      }
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() =>
                      applyQuickSearch(
                        language ===
                          "pt"
                          ? "desde €180"
                          : "from €180"
                      )
                    }
                    style={
                      styles.quickSearchChip
                    }
                  >
                    <Text
                      style={
                        styles.quickSearchIcon
                      }
                    >
                      €
                    </Text>

                    <Text
                      style={
                        styles.quickSearchText
                      }
                    >
                      {
                        searchCopy.quick300
                      }
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() =>
                      applyQuickSearch(
                        language ===
                          "pt"
                          ? "até €400"
                          : "under €400"
                      )
                    }
                    style={
                      styles.quickSearchChip
                    }
                  >
                    <Text
                      style={
                        styles.quickSearchIcon
                      }
                    >
                      €
                    </Text>

                    <Text
                      style={
                        styles.quickSearchText
                      }
                    >
                      {
                        searchCopy.quick400
                      }
                    </Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        ) : null}
      </View>
    );
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <View
      style={[
        styles.safeScreen,
        {
          paddingTop:
            insets.top,
        },
      ]}
    >
      <ScrollView
        style={
          styles.screen
        }
        contentContainerStyle={[
          styles.content,

          isMobile &&
            styles.contentMobile,
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {isMobile ? (
          <View
            style={
              styles.mobileHeader
            }
          >
            <View
              style={
                styles.mobileHeaderTop
              }
            >
              <Link
                href={
                  "/" as any
                }
                asChild
              >
                <Pressable
                  style={StyleSheet.flatten([
                    styles.brandRow,
                    styles.brandRowMobile,
                  ])}
                >
                  <View
                    style={[
                      styles.mark,
                      styles.markMobile,
                    ]}
                  >
                    <View
                      style={[
                        styles.markInner,
                        styles.markInnerMobile,
                      ]}
                    />
                  </View>

                  <View>
                    <Text
                      style={[
                        styles.logo,
                        styles.logoMobile,
                      ]}
                    >
                      POKAPOK
                    </Text>

                    <Text
                      style={[
                        styles.logoSub,
                        styles.logoSubMobile,
                      ]}
                    >
                      SMARTPHONES
                    </Text>
                  </View>
                </Pressable>
              </Link>

              <View
                style={
                  styles.mobileHeaderActions
                }
              >
                <View
                  style={
                    styles.mobileLanguageSwitcher
                  }
                >
                  <Text
                    style={
                      styles.mobileLanguageIcon
                    }
                  >
                    🌐
                  </Text>

                  <Pressable
                    onPress={() => {
                      void setLanguage(
                        "en"
                      );
                    }}
                    style={[
                      styles.mobileLanguageOption,

                      language ===
                        "en" &&
                        styles.mobileLanguageOptionActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.mobileLanguageOptionText,

                        language ===
                          "en" &&
                          styles.mobileLanguageOptionTextActive,
                      ]}
                    >
                      EN
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => {
                      void setLanguage(
                        "pt"
                      );
                    }}
                    style={[
                      styles.mobileLanguageOption,

                      language ===
                        "pt" &&
                        styles.mobileLanguageOptionActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.mobileLanguageOptionText,

                        language ===
                          "pt" &&
                          styles.mobileLanguageOptionTextActive,
                      ]}
                    >
                      PT
                    </Text>
                  </Pressable>
                </View>

                <Link
                  href={
                    "/cart" as any
                  }
                  asChild
                >
                  <Pressable
                    style={
                      styles.mobileCartButton
                    }
                  >
                    <Text
                      numberOfLines={
                        1
                      }
                      style={
                        styles.mobileCartText
                      }
                    >
                      {
                        t.navigation
                          .cart
                      }
                    </Text>

                    {totalItems >
                    0 ? (
                      <Text
                        style={
                          styles.mobileCartBadge
                        }
                      >
                        {
                          totalItems
                        }
                      </Text>
                    ) : null}
                  </Pressable>
                </Link>
              </View>
            </View>

            <View
              style={
                styles.mobileHeaderBottom
              }
            >
              {renderSearchBox(
                true
              )}

              <CurrencySwitcher
                compact
              />
            </View>
          </View>
        ) : (
          <>
            <View
              style={
                styles.utilityBar
              }
            >
              <Text
                style={
                  styles.utilityText
                }
              >
                {
                  t.home.utility
                }
              </Text>

              <View
                style={
                  styles.utilityControls
                }
              >
                <CurrencySwitcher
                  compact
                />

                <View
                  style={
                    styles.languageSelector
                  }
                >
                  <Pressable
                    onPress={() => {
                      void setLanguage(
                        "pt"
                      );
                    }}
                    style={[
                      styles.languageButton,

                      language ===
                        "pt" &&
                        styles.languageButtonActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.languageButtonText,

                        language ===
                          "pt" &&
                          styles.languageButtonTextActive,
                      ]}
                    >
                      PT
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => {
                      void setLanguage(
                        "en"
                      );
                    }}
                    style={[
                      styles.languageButton,

                      language ===
                        "en" &&
                        styles.languageButtonActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.languageButtonText,

                        language ===
                          "en" &&
                          styles.languageButtonTextActive,
                      ]}
                    >
                      EN
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>

            <View
              style={
                styles.topbar
              }
            >
              <Link
                href={
                  "/" as any
                }
                asChild
              >
                <Pressable
                  style={
                    styles.brandRow
                  }
                >
                  <View
                    style={
                      styles.mark
                    }
                  >
                    <View
                      style={
                        styles.markInner
                      }
                    />
                  </View>

                  <View>
                    <Text
                      style={
                        styles.logo
                      }
                    >
                      POKAPOK
                    </Text>

                    <Text
                      style={
                        styles.logoSub
                      }
                    >
                      SMARTPHONES
                    </Text>
                  </View>
                </Pressable>
              </Link>

              {renderSearchBox(
                false
              )}

              <View
                style={
                  styles.topActions
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
                        styles.helpText
                      }
                    >
                      {
                        t.home
                          .catalog
                      }
                    </Text>
                  </Pressable>
                </Link>

                <Link
                  href={
                    "/cart" as any
                  }
                  asChild
                >
                  <Pressable
                    style={
                      styles.cartButton
                    }
                  >
                    <Text
                      style={
                        styles.cartButtonText
                      }
                    >
                      {
                        t.navigation
                          .cart
                      }
                    </Text>

                    {totalItems >
                    0 ? (
                      <Text
                        style={
                          styles.cartBadge
                        }
                      >
                        {
                          totalItems
                        }
                      </Text>
                    ) : null}
                  </Pressable>
                </Link>
              </View>
            </View>
          </>
        )}

        <View
          style={[
            styles.combinedFilterSection,

            isMobile &&
              styles.combinedFilterSectionMobile,
          ]}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={
              false
            }
            contentContainerStyle={
              styles.combinedFilterRail
            }
            keyboardShouldPersistTaps="handled"
          >
            <Text
              style={
                styles.combinedFilterLabel
              }
            >
              {language ===
              "pt"
                ? "MARCA"
                : "BRAND"}
            </Text>

            <Link
              href={
                "/catalog?brand=all" as any
              }
              asChild
            >
              <Pressable
                style={StyleSheet.flatten([
                  styles.brandNavigationPill,
                  styles.brandNavigationPillAll,
                ])}
              >
                <Text
                  style={[
                    styles.brandNavigationText,
                    styles.brandNavigationTextAll,
                  ]}
                >
                  {language ===
                  "pt"
                    ? "Todas"
                    : "All"}
                </Text>
              </Pressable>
            </Link>

            {brandOptions.map(
              (
                brand
              ) => (
                <Link
                  key={`brand-${brand}`}
                  href={
                    `/catalog?brand=${encodeURIComponent(
                      brand
                    )}` as any
                  }
                  asChild
                >
                  <Pressable
                    style={
                      styles.brandNavigationPill
                    }
                  >
                    <Text
                      style={
                        styles.brandNavigationText
                      }
                    >
                      {formatBrandLabel(
                        brand
                      )}
                    </Text>
                  </Pressable>
                </Link>
              )
            )}

            <View
              style={
                styles.combinedFilterDivider
              }
            />

            <Text
              style={
                styles.combinedFilterLabel
              }
            >
              {language ===
              "pt"
                ? "CONDIÇÃO"
                : "CONDITION"}
            </Text>

            {conditionOptions.map(
              (
                condition
              ) => {
                const isAll =
                  condition ===
                  "all";

                return (
                  <Link
                    key={`condition-${condition}`}
                    href={
                      `/catalog?condition=${condition}` as any
                    }
                    asChild
                  >
                    <Pressable
                      style={
                        isAll
                          ? StyleSheet.flatten([
                              styles.brandNavigationPill,
                              styles.brandNavigationPillAll,
                            ])
                          : styles.brandNavigationPill
                      }
                    >
                      <Text
                        style={
                          isAll
                            ? [
                                styles.brandNavigationText,
                                styles.brandNavigationTextAll,
                              ]
                            : styles.brandNavigationText
                        }
                      >
                        {isAll
                          ? language ===
                            "pt"
                            ? "Todas"
                            : "All"
                          : getConditionLabel(
                              condition
                            )}
                      </Text>
                    </Pressable>
                  </Link>
                );
              }
            )}
          </ScrollView>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={
            false
          }
          decelerationRate="fast"
          snapToInterval={
            isMobile
              ? promoCardWidth +
                12
              : undefined
          }
          snapToAlignment="start"
          contentContainerStyle={[
            styles.promoCarouselContent,

            !isMobile &&
              styles.promoCarouselContentDesktop,
          ]}
          style={
            styles.promoCarousel
          }
        >
          <Link
            href={
              "/catalog?maxPrice=300&sort=price-asc" as any
            }
            asChild
          >
            <Pressable
              style={StyleSheet.flatten([
                styles.promoCard,
                styles.promoCardPurple,
                {
                  width:
                    promoCardWidth,
                },
              ])}
            >
              <View
                style={
                  styles.promoCopy
                }
              >
                <View>
                  <Text
                    style={
                      styles.promoKicker
                    }
                  >
                    {
                      promoCopy.budgetKicker
                    }
                  </Text>

                  <Text
                    style={
                      styles.promoTitle
                    }
                    numberOfLines={
                      2
                    }
                  >
                    {
                      promoCopy.budgetTitle
                    }
                  </Text>

                  <Text
                    style={
                      styles.promoBody
                    }
                    numberOfLines={
                      2
                    }
                  >
                    {
                      promoCopy.budgetBody
                    }
                  </Text>
                </View>

                <View
                  style={
                    styles.promoBottom
                  }
                >
                  <View>
                    <Text
                      style={
                        styles.promoPriceLabel
                      }
                    >
                      {language ===
                      "pt"
                        ? "DESDE"
                        : "FROM"}
                    </Text>

                    <Text
                      style={
                        styles.promoPrice
                      }
                    >
                      {formatPrice(
                        180
                      )}
                    </Text>
                  </View>

                  <View
                    style={
                      styles.promoActionDark
                    }
                  >
                    <Text
                      style={
                        styles.promoActionDarkText
                      }
                    >
                      {
                        promoCopy.budgetAction
                      }
                    </Text>
                  </View>
                </View>
              </View>

              <View
                style={
                  styles.promoPhoneWrap
                }
                pointerEvents="none"
              >
                <PhoneVisual
                  phone={
                    featuredBudgetPhone
                  }
                  variant="card"
                />
              </View>
            </Pressable>
          </Link>

          <Link
            href={
              "/catalog?brand=apple&sort=price-asc" as any
            }
            asChild
          >
            <Pressable
              style={StyleSheet.flatten([
                styles.promoCard,
                styles.promoCardDark,
                {
                  width:
                    promoCardWidth,
                },
              ])}
            >
              <View
                style={
                  styles.promoCopy
                }
              >
                <View>
                  <Text
                    style={[
                      styles.promoKicker,
                      styles.promoTextLight,
                    ]}
                  >
                    {
                      promoCopy.iphoneKicker
                    }
                  </Text>

                  <Text
                    style={[
                      styles.promoTitle,
                      styles.promoTextLight,
                    ]}
                    numberOfLines={
                      2
                    }
                  >
                    {
                      promoCopy.iphoneTitle
                    }
                  </Text>

                  <Text
                    style={
                      styles.promoBodyLight
                    }
                    numberOfLines={
                      2
                    }
                  >
                    {
                      promoCopy.iphoneBody
                    }
                  </Text>
                </View>

                <View
                  style={
                    styles.promoBottom
                  }
                >
                  <View>
                    <Text
                      style={
                        styles.promoPriceLabelLight
                      }
                    >
                      {
                        t.common
                          .from
                      }
                    </Text>

                    <Text
                      style={
                        styles.promoPriceLight
                      }
                    >
                      {lowestIphonePrice !==
                      null
                        ? formatPrice(
                            lowestIphonePrice
                          )
                        : "—"}
                    </Text>
                  </View>

                  <View
                    style={
                      styles.promoActionLight
                    }
                  >
                    <Text
                      style={
                        styles.promoActionLightText
                      }
                    >
                      {
                        promoCopy.iphoneAction
                      }
                    </Text>
                  </View>
                </View>
              </View>

              <View
                style={
                  styles.promoPhoneWrap
                }
                pointerEvents="none"
              >
                <PhoneVisual
                  phone={
                    featuredIphone
                  }
                  variant="card"
                />
              </View>
            </Pressable>
          </Link>

          <Link
            href={
              "/catalog?brand=samsung&sort=price-asc" as any
            }
            asChild
          >
            <Pressable
              style={StyleSheet.flatten([
                styles.promoCard,
                styles.promoCardLime,
                styles.promoCardSamsung,
                {
                  width:
                    promoCardWidth,
                },
              ])}
            >
              <View
                style={[
                  styles.promoCopy,
                  styles.promoCopySamsung,
                ]}
              >
                <View>
                  <Text
                    style={
                      styles.promoKicker
                    }
                  >
                    {
                      promoCopy.samsungKicker
                    }
                  </Text>

                  <Text
                    style={[
                      styles.promoTitle,
                      styles.promoTitleSamsung,
                    ]}
                    numberOfLines={
                      2
                    }
                  >
                    {
                      promoCopy.samsungTitle
                    }
                  </Text>

                  <Text
                    style={[
                      styles.promoBody,
                      styles.promoBodySamsung,
                    ]}
                    numberOfLines={
                      2
                    }
                  >
                    {
                      promoCopy.samsungBody
                    }
                  </Text>
                </View>

                <View
                  style={[
                    styles.promoBottom,
                    styles.promoBottomSamsung,
                  ]}
                >
                  <View>
                    <Text
                      style={
                        styles.promoPriceLabel
                      }
                    >
                      {
                        t.common
                          .from
                      }
                    </Text>

                    <Text
                      style={
                        styles.promoPrice
                      }
                    >
                      {lowestSamsungPrice !==
                      null
                        ? formatPrice(
                            lowestSamsungPrice
                          )
                        : "—"}
                    </Text>
                  </View>

                  <View
                    style={
                      styles.promoActionDark
                    }
                  >
                    <Text
                      style={
                        styles.promoActionDarkText
                      }
                    >
                      {
                        promoCopy.samsungAction
                      }
                    </Text>
                  </View>
                </View>
              </View>

              <View
                style={[
                  styles.promoPhoneWrap,
                  styles.promoPhoneWrapSamsung,
                ]}
                pointerEvents="none"
              >
                <View
                  style={
                    styles.samsungVisualHalo
                  }
                />

                <PhoneVisual
                  phone={
                    featuredSamsung
                  }
                  variant="card"
                />
              </View>
            </Pressable>
          </Link>
        </ScrollView>

        {!isMobile ? (
          <>
            <View
              style={
                styles.trustStrip
              }
            >
              <View
                style={
                  styles.trustItem
                }
              >
                <Text
                  style={
                    styles.trustIcon
                  }
                >
                  ✓
                </Text>

                <Text
                  style={
                    styles.trustText
                  }
                >
                  {
                    t.home.trust
                      .verified
                  }
                </Text>
              </View>

              <View
                style={
                  styles.trustItem
                }
              >
                <Text
                  style={
                    styles.trustIcon
                  }
                >
                  ★
                </Text>

                <Text
                  style={
                    styles.trustText
                  }
                >
                  {
                    t.home.trust
                      .warranty
                  }
                </Text>
              </View>

              <View
                style={
                  styles.trustItem
                }
              >
                <Text
                  style={
                    styles.trustIcon
                  }
                >
                  ↺
                </Text>

                <Text
                  style={
                    styles.trustText
                  }
                >
                  {
                    t.home.trust
                      .newOrRefurbished
                  }
                </Text>
              </View>

              <View
                style={
                  styles.trustItem
                }
              >
                <Text
                  style={
                    styles.trustIcon
                  }
                >
                  ▣
                </Text>

                <Text
                  style={
                    styles.trustText
                  }
                >
                  {
                    t.home.trust
                      .delivery
                  }
                </Text>
              </View>
            </View>

            <View
              style={
                styles.statement
              }
            >
              <Text
                style={
                  styles.statementTitle
                }
              >
                {
                  t.home.statement
                    .title
                }
              </Text>

              <Text
                style={
                  styles.statementText
                }
              >
                {
                  t.home.statement
                    .description
                }
              </Text>
            </View>
          </>
        ) : null}

        {isMobile ? (
          <View
            style={
              styles.sectionHeaderMobile
            }
          >
            <View
              style={
                styles.mobileSectionTopRow
              }
            >
              <Text
                style={
                  styles.sectionEyebrow
                }
              >
                {
                  t.home.selection
                    .kicker
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
                    styles.mobileCatalogButton
                  }
                >
                  <Text
                    style={
                      styles.mobileCatalogButtonText
                    }
                  >
                    {language ===
                    "pt"
                      ? "Ver catálogo"
                      : "View catalog"}
                  </Text>

                  <Text
                    style={
                      styles.mobileCatalogArrow
                    }
                  >
                    →
                  </Text>
                </Pressable>
              </Link>
            </View>

            <Text
              style={[
                styles.sectionTitle,
                styles.sectionTitleMobile,
              ]}
            >
              {
                t.home.selection
                  .featured
              }
            </Text>

            <Text
              style={
                styles.sectionSubTextMobile
              }
            >
              {
                t.home.selection
                  .lowestPrices
              }
            </Text>
          </View>
        ) : (
          <View
            style={
              styles.sectionHeader
            }
          >
            <View>
              <Text
                style={
                  styles.sectionEyebrow
                }
              >
                {
                  t.home.selection
                    .kicker
                }
              </Text>

              <Text
                style={
                  styles.sectionTitle
                }
              >
                {
                  t.home.selection
                    .featured
                }
              </Text>

              <Text
                style={
                  styles.sectionSubText
                }
              >
                {
                  t.home.selection
                    .lowestPrices
                }
              </Text>
            </View>

            <Link
              href={
                "/catalog" as any
              }
              asChild
            >
              <Pressable>
                <Text
                  style={
                    styles.sectionLink
                  }
                >
                  {
                    t.home.selection
                      .fullCatalog
                  }
                </Text>
              </Pressable>
            </Link>
          </View>
        )}

        {filteredPhones.length ===
        0 ? (
          <View
            style={[
              styles.emptyState,

              isMobile &&
                styles.emptyStateMobile,
            ]}
          >
            <Text
              style={
                styles.emptyTitle
              }
            >
              {
                t.home.empty
                  .title
              }
            </Text>

            <Text
              style={
                styles.emptyText
              }
            >
              {
                t.home.empty
                  .description
              }
            </Text>
          </View>
        ) : isMobile ? (
          <>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={
                false
              }
              decelerationRate="fast"
              snapToInterval={
                mobileProductCardWidth +
                12
              }
              snapToAlignment="start"
              contentContainerStyle={
                styles.mobileProductRail
              }
              style={
                styles.mobileProductScroll
              }
            >
              {filteredPhones.map(
                (
                  phone
                ) => (
                  <Link
                    key={
                      phone.id
                    }
                    href={
                      `/product/${phone.slug}` as any
                    }
                    asChild
                  >
                    <Pressable
                      style={StyleSheet.flatten([
                        styles.card,
                        styles.cardMobileRail,
                        {
                          width:
                            mobileProductCardWidth,
                        },
                      ])}
                    >
                      <View
                        style={
                          styles.cardTop
                        }
                      >
                        <Text
                          style={
                            styles.cardBrand
                          }
                        >
                          {phone.brand.toUpperCase()}
                        </Text>

                        <View
                          style={
                            styles.availabilityPills
                          }
                        >
                          {phoneSupportsCondition(
                            phone.slug,
                            "new"
                          ) ? (
                            <Text
                              style={
                                styles.availabilityPill
                              }
                            >
                              {
                                t.product
                                  .new
                              }
                            </Text>
                          ) : null}

                          {phoneSupportsCondition(
                            phone.slug,
                            "refurbished"
                          ) ? (
                            <Text
                              style={
                                styles.availabilityPill
                              }
                            >
                              {
                                t.product
                                  .refurbished
                              }
                            </Text>
                          ) : null}
                        </View>
                      </View>

                      <View
                        style={[
                          styles.phoneStage,
                          styles.phoneStageRail,
                        ]}
                      >
                        <PhoneVisual
                          phone={
                            phone
                          }
                          variant="card"
                        />
                      </View>

                      <Text
                        numberOfLines={
                          1
                        }
                        style={
                          styles.cardNameRail
                        }
                      >
                        {
                          phone.name
                        }
                      </Text>

                      <Text
                        numberOfLines={
                          1
                        }
                        style={
                          styles.cardSpecRail
                        }
                      >
                        {
                          phone.specs
                            .screen
                        }{" "}
                        ·{" "}
                        {
                          phone.specs
                            .chip
                        }
                      </Text>

                      <View
                        style={
                          styles.cardBottomRail
                        }
                      >
                        <View
                          style={
                            styles.priceArea
                          }
                        >
                          <Text
                            style={
                              styles.fromLabel
                            }
                          >
                            {
                              t.common
                                .from
                            }
                          </Text>

                          <Text
                            style={
                              styles.mainFromPriceRail
                            }
                          >
                            {(() => {
                              const price =
                                getLowestPhonePrice(
                                  phone.slug
                                );

                              return price !==
                                null
                                ? formatPrice(
                                    price
                                  )
                                : "—";
                            })()}
                          </Text>
                        </View>

                        <View
                          style={
                            styles.mobileOpenPill
                          }
                        >
                          <Text
                            style={
                              styles.mobileOpenPillText
                            }
                          >
                            {
                              t.catalog
                                .view
                            }
                          </Text>
                        </View>
                      </View>
                    </Pressable>
                  </Link>
                )
              )}
            </ScrollView>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={
                false
              }
              contentContainerStyle={
                styles.mobileTrustRail
              }
            >
              <View
                style={
                  styles.mobileTrustChip
                }
              >
                <Text
                  style={
                    styles.mobileTrustChipIcon
                  }
                >
                  ✓
                </Text>

                <Text
                  style={
                    styles.mobileTrustChipText
                  }
                >
                  {
                    t.home.trust
                      .verified
                  }
                </Text>
              </View>

              <View
                style={
                  styles.mobileTrustChip
                }
              >
                <Text
                  style={
                    styles.mobileTrustChipIcon
                  }
                >
                  ★
                </Text>

                <Text
                  style={
                    styles.mobileTrustChipText
                  }
                >
                  {
                    t.home.trust
                      .warranty
                  }
                </Text>
              </View>

              <View
                style={
                  styles.mobileTrustChip
                }
              >
                <Text
                  style={
                    styles.mobileTrustChipIcon
                  }
                >
                  ↺
                </Text>

                <Text
                  style={
                    styles.mobileTrustChipText
                  }
                >
                  {
                    t.home.trust
                      .newOrRefurbished
                  }
                </Text>
              </View>

              <View
                style={
                  styles.mobileTrustChip
                }
              >
                <Text
                  style={
                    styles.mobileTrustChipIcon
                  }
                >
                  ▣
                </Text>

                <Text
                  style={
                    styles.mobileTrustChipText
                  }
                >
                  {
                    t.home.trust
                      .delivery
                  }
                </Text>
              </View>
            </ScrollView>
          </>
        ) : (
          <View
            style={
              styles.grid
            }
          >
            {filteredPhones.map(
              (
                phone
              ) => (
                <View
                  key={
                    phone.id
                  }
                  style={
                    styles.card
                  }
                >
                  <View
                    style={
                      styles.cardTop
                    }
                  >
                    <Text
                      style={
                        styles.cardBrand
                      }
                    >
                      {phone.brand.toUpperCase()}
                    </Text>

                    <View
                      style={
                        styles.availabilityPills
                      }
                    >
                      {phoneSupportsCondition(
                        phone.slug,
                        "new"
                      ) ? (
                        <Text
                          style={
                            styles.availabilityPill
                          }
                        >
                          {
                            t.product
                              .new
                          }
                        </Text>
                      ) : null}

                      {phoneSupportsCondition(
                        phone.slug,
                        "refurbished"
                      ) ? (
                        <Text
                          style={
                            styles.availabilityPill
                          }
                        >
                          {
                            t.product
                              .refurbished
                          }
                        </Text>
                      ) : null}
                    </View>
                  </View>

                  <View
                    style={
                      styles.phoneStage
                    }
                  >
                    <PhoneVisual
                      phone={
                        phone
                      }
                      variant="card"
                    />
                  </View>

                  <Text
                    style={
                      styles.cardName
                    }
                  >
                    {
                      phone.name
                    }
                  </Text>

                  <Text
                    style={
                      styles.cardSpec
                    }
                  >
                    {
                      phone.specs
                        .screen
                    }{" "}
                    ·{" "}
                    {
                      phone.specs
                        .chip
                    }
                  </Text>

                  <View
                    style={
                      styles.cardBottom
                    }
                  >
                    <View
                      style={
                        styles.priceArea
                      }
                    >
                      <Text
                        style={
                          styles.fromLabel
                        }
                      >
                        {
                          t.common
                            .from
                        }
                      </Text>

                      <Text
                        style={
                          styles.mainFromPrice
                        }
                      >
                        {(() => {
                          const price =
                            getLowestPhonePrice(
                              phone.slug
                            );

                          return price !==
                            null
                            ? formatPrice(
                                price
                              )
                            : "—";
                        })()}
                      </Text>

                      <Text
                        style={
                          styles.priceSubText
                        }
                      >
                        {
                          t.home.card
                            .newOrRefurbished
                        }
                      </Text>
                    </View>

                    <Link
                      href={
                        `/product/${phone.slug}` as any
                      }
                      asChild
                    >
                      <Pressable
                        style={
                          styles.viewButton
                        }
                      >
                        <Text
                          style={
                            styles.viewButtonText
                          }
                        >
                          {
                            t.catalog
                              .view
                          }
                        </Text>
                      </Pressable>
                    </Link>
                  </View>
                </View>
              )
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

/* =========================================================
   STYLES
========================================================= */

const styles =
  StyleSheet.create({
    safeScreen: {
      flex: 1,
      backgroundColor:
        colors.bg,
    },

    screen: {
      flex: 1,
      backgroundColor:
        colors.bg,
    },

    content: {
      width: "100%",
      maxWidth: 1280,
      alignSelf: "center",
      paddingBottom: 56,
    },

    contentMobile: {
      maxWidth: undefined,
      paddingBottom: 36,
    },

    utilityBar: {
      paddingHorizontal: 24,
      paddingTop: 12,
      paddingBottom: 6,
      flexDirection: "row",
      justifyContent:
        "space-between",
      alignItems: "center",
      gap: 12,
      zIndex: 200,
    },

    utilityText: {
      color:
        colors.ink40,
      fontSize: 12,
      fontWeight: "800",
    },

    utilityControls: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },

    languageSelector: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor:
        colors.white,
      borderWidth: 1,
      borderColor:
        colors.ink12,
      borderRadius: 999,
      padding: 3,
    },

    languageButton: {
      minWidth: 38,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
      alignItems: "center",
      justifyContent:
        "center",
    },

    languageButtonActive: {
      backgroundColor:
        colors.ink,
    },

    languageButtonText: {
      color:
        colors.ink40,
      fontSize: 11,
      fontWeight: "900",
    },

    languageButtonTextActive: {
      color:
        colors.white,
    },

    topbar: {
      paddingHorizontal: 24,
      paddingVertical: 16,
      flexDirection: "row",
      alignItems: "center",
      gap: 18,
      backgroundColor:
        colors.bg,
      zIndex: 150,
    },

    brandRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 11,
    },

    mark: {
      width: 34,
      height: 34,
      borderRadius: 12,
      backgroundColor:
        colors.ink,
      alignItems: "center",
      justifyContent:
        "center",
    },

    markInner: {
      width: 14,
      height: 14,
      borderRadius: 5,
      backgroundColor:
        colors.blue,
    },

    logo: {
      fontSize: 22,
      fontWeight: "900",
      color:
        colors.blue,
      letterSpacing: -1.2,
    },

    logoSub: {
      fontSize: 9,
      fontWeight: "900",
      color:
        colors.ink40,
      letterSpacing: 2.4,
      marginTop: -3,
    },

    searchExperience: {
      flex: 1,
      minWidth: 0,
      position: "relative",
      zIndex: 1000,
    },

    searchExperienceMobile: {
      flex: 1,
      width: "100%",
    },

    searchBox: {
      width: "100%",
      minHeight: 52,
      backgroundColor:
        colors.white,
      borderRadius: 999,
      borderWidth: 1,
      borderColor:
        colors.ink12,
      paddingHorizontal: 18,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },

    searchBoxFocused: {
      borderColor:
        colors.blue,
      shadowColor: "#000",
      shadowOpacity: 0.08,
      shadowRadius: 16,
      shadowOffset: {
        width: 0,
        height: 6,
      },
    },

    searchIcon: {
      color:
        colors.ink,
      fontSize: 22,
      fontWeight: "900",
      flexShrink: 0,
    },

    searchInput: {
      flex: 1,
      minWidth: 0,
      color:
        colors.ink,
      fontSize: 15,
      outlineStyle:
        "none" as any,
    },

    searchClearButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor:
        colors.bg,
      alignItems: "center",
      justifyContent:
        "center",
      flexShrink: 0,
    },

    searchClearText: {
      color:
        colors.ink70,
      fontSize: 23,
      lineHeight: 25,
      fontWeight: "600",
      marginTop: -2,
    },

    searchPanel: {
      position: "absolute",
      top: 58,
      left: 0,
      right: 0,
      backgroundColor:
        colors.white,
      borderWidth: 1,
      borderColor:
        colors.ink12,
      borderRadius: 20,
      paddingHorizontal: 10,
      paddingTop: 8,
      paddingBottom: 10,
      zIndex: 9999,
      shadowColor: "#000",
      shadowOpacity: 0.1,
      shadowRadius: 20,
      shadowOffset: {
        width: 0,
        height: 10,
      },
    },

    searchPanelMobile: {
      top: 50,
      borderRadius: 18,
      paddingHorizontal: 8,
      paddingTop: 7,
      paddingBottom: 8,
      minWidth: 280,
      right: -54,
    },

    searchPanelHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
      paddingHorizontal: 6,
      paddingTop: 2,
      paddingBottom: 5,
    },

    searchPanelTitle: {
      color:
        colors.ink40,
      fontSize: 9,
      lineHeight: 12,
      fontWeight: "900",
      letterSpacing: 1.2,
      paddingHorizontal: 5,
      paddingVertical: 3,
    },

    searchResultCount: {
      minWidth: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor:
        colors.bg,
      color:
        colors.ink70,
      textAlign: "center",
      lineHeight: 20,
      fontSize: 9,
      fontWeight: "900",
      overflow: "hidden",
    },

    searchSuggestionList: {
      gap: 1,
    },

    searchSuggestionItem: {
      width: "100%",
      minHeight: 54,
      borderRadius: 14,
      paddingHorizontal: 10,
      paddingVertical: 7,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },

    searchSuggestionItemPressed: {
      backgroundColor:
        colors.bg,
    },

    searchSuggestionInfo: {
      flex: 1,
      minWidth: 0,
      justifyContent:
        "center",
    },

    searchSuggestionBrand: {
      color:
        colors.blue,
      fontSize: 7,
      lineHeight: 9,
      letterSpacing: 1,
      fontWeight: "900",
    },

    searchSuggestionName: {
      color:
        colors.ink,
      fontSize: 13,
      lineHeight: 16,
      fontWeight: "900",
      marginTop: 1,
    },

    searchSuggestionMeta: {
      color:
        colors.ink40,
      fontSize: 9,
      lineHeight: 12,
      fontWeight: "700",
      marginTop: 2,
    },

    searchSuggestionPriceArea: {
      alignItems:
        "flex-end",
      justifyContent:
        "center",
      minWidth: 64,
      flexShrink: 0,
    },

    searchSuggestionFrom: {
      color:
        colors.ink40,
      fontSize: 7,
      lineHeight: 9,
      fontWeight: "900",
      textTransform:
        "uppercase",
    },

    searchSuggestionPrice: {
      color:
        colors.blue,
      fontSize: 13,
      lineHeight: 16,
      fontWeight: "900",
      marginTop: 1,
    },

    searchSuggestionUnavailable: {
      color:
        colors.ink40,
      fontSize: 16,
      fontWeight: "900",
    },

    searchSuggestionArrow: {
      color:
        colors.ink40,
      fontSize: 11,
      lineHeight: 13,
      fontWeight: "900",
      marginTop: 1,
    },

    searchSeeResultsButton: {
      minHeight: 40,
      marginTop: 6,
      borderRadius: 13,
      backgroundColor:
        colors.ink,
      paddingHorizontal: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
    },

    searchSeeResultsText: {
      color:
        colors.white,
      fontSize: 11,
      fontWeight: "900",
    },

    searchSeeResultsArrow: {
      color:
        colors.white,
      fontSize: 14,
      fontWeight: "900",
    },

    quickSearchGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
      paddingHorizontal: 4,
      paddingBottom: 2,
    },

    quickSearchChip: {
      minHeight: 36,
      paddingHorizontal: 10,
      borderRadius: 999,
      backgroundColor:
        colors.bg,
      borderWidth: 1,
      borderColor:
        colors.ink12,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },

    quickSearchIcon: {
      color:
        colors.blue,
      fontSize: 11,
      fontWeight: "900",
    },

    quickSearchText: {
      color:
        colors.ink,
      fontSize: 10,
      fontWeight: "900",
    },

    searchEmptyState: {
      paddingVertical: 18,
      paddingHorizontal: 14,
      alignItems: "center",
    },

    searchEmptyIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor:
        colors.bg,
      alignItems: "center",
      justifyContent:
        "center",
    },

    searchEmptyIconText: {
      color:
        colors.ink,
      fontSize: 20,
      fontWeight: "900",
    },

    searchEmptyTitle: {
      color:
        colors.ink,
      fontSize: 14,
      lineHeight: 18,
      fontWeight: "900",
      marginTop: 9,
      textAlign: "center",
    },

    searchEmptyDescription: {
      color:
        colors.ink40,
      fontSize: 10,
      lineHeight: 15,
      marginTop: 4,
      textAlign: "center",
    },

    searchEmptyButton: {
      minHeight: 36,
      marginTop: 10,
      paddingHorizontal: 14,
      borderRadius: 999,
      backgroundColor:
        colors.ink,
      alignItems: "center",
      justifyContent:
        "center",
    },

    searchEmptyButtonText: {
      color:
        colors.white,
      fontSize: 10,
      fontWeight: "900",
    },

    topActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
    },

    helpText: {
      color:
        colors.ink,
      fontWeight: "900",
    },

    cartButton: {
      backgroundColor:
        colors.white,
      borderWidth: 1,
      borderColor:
        colors.ink12,
      paddingHorizontal: 15,
      paddingVertical: 11,
      borderRadius: 999,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },

    cartButtonText: {
      color:
        colors.ink,
      fontWeight: "900",
    },

    cartBadge: {
      minWidth: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor:
        colors.blue,
      color:
        colors.white,
      textAlign: "center",
      lineHeight: 20,
      fontSize: 12,
      fontWeight: "900",
      overflow: "hidden",
    },

    combinedFilterSection: {
      paddingHorizontal: 24,
      paddingTop: 8,
      paddingBottom: 14,
      zIndex: 1,
    },

    combinedFilterSectionMobile: {
      paddingHorizontal: 16,
      paddingTop: 2,
      paddingBottom: 12,
    },

    combinedFilterRail: {
      alignItems: "center",
      gap: 8,
      paddingRight: 8,
    },

    combinedFilterLabel: {
      color:
        colors.ink40,
      fontSize: 10,
      lineHeight: 14,
      fontWeight: "900",
      letterSpacing: 1.2,
      paddingHorizontal: 2,
    },

    combinedFilterDivider: {
      width: 1,
      height: 26,
      backgroundColor:
        colors.ink12,
      marginHorizontal: 4,
    },

    brandNavigationPill: {
      minHeight: 40,
      paddingHorizontal: 16,
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

    brandNavigationPillAll: {
      backgroundColor:
        colors.ink,
      borderColor:
        colors.ink,
    },

    brandNavigationText: {
      color:
        colors.ink70,
      fontSize: 12,
      fontWeight: "900",
    },

    brandNavigationTextAll: {
      color:
        colors.white,
    },

    promoCarousel: {
      marginBottom: 0,
    },

    promoCarouselContent: {
      paddingHorizontal: 16,
      paddingTop: 6,
      paddingBottom: 26,
      gap: 12,
    },

    promoCarouselContentDesktop: {
      paddingHorizontal: 24,
      paddingTop: 12,
      paddingBottom: 30,
    },

    promoCard: {
      height: 238,
      borderRadius: 28,
      overflow: "hidden",
      position: "relative",
      padding: 20,
    },

    promoCardPurple: {
      backgroundColor:
        "#C8A8FF",
    },

    promoCardDark: {
      backgroundColor:
        colors.ink,
    },

    promoCardLime: {
      backgroundColor:
        "#DFF58A",
    },

    promoCardSamsung: {
      paddingRight: 18,
    },

    promoCopySamsung: {
      width: "62%",
    },

    promoTitleSamsung: {
      fontSize: 27,
      lineHeight: 28,
      letterSpacing: -1.1,
      maxWidth: 190,
    },

    promoBodySamsung: {
      maxWidth: 175,
    },

    promoBottomSamsung: {
      paddingRight: 2,
    },

    promoCopy: {
      width: "68%",
      height: "100%",
      zIndex: 2,
      justifyContent:
        "space-between",
    },

    promoKicker: {
      color:
        colors.ink,
      fontSize: 10,
      lineHeight: 14,
      fontWeight: "900",
      letterSpacing: 1.7,
    },

    promoTitle: {
      color:
        colors.ink,
      fontSize: 30,
      lineHeight: 30,
      fontWeight: "900",
      letterSpacing: -1.5,
      marginTop: 7,
    },

    promoBody: {
      color:
        colors.ink,
      opacity: 0.7,
      fontSize: 13,
      lineHeight: 18,
      marginTop: 8,
    },

    promoTextLight: {
      color:
        colors.white,
    },

    promoBodyLight: {
      color:
        "rgba(255,255,255,0.68)",
      fontSize: 13,
      lineHeight: 18,
      marginTop: 8,
    },

    promoBottom: {
      flexDirection: "row",
      alignItems:
        "flex-end",
      justifyContent:
        "space-between",
      gap: 8,
      marginTop: "auto",
    },

    promoPriceLabel: {
      color:
        colors.ink,
      opacity: 0.55,
      fontSize: 9,
      fontWeight: "900",
      textTransform:
        "uppercase",
    },

    promoPrice: {
      color:
        colors.ink,
      fontSize: 21,
      fontWeight: "900",
      letterSpacing: -0.8,
      marginTop: 1,
    },

    promoPriceLabelLight: {
      color:
        "rgba(255,255,255,0.5)",
      fontSize: 9,
      fontWeight: "900",
      textTransform:
        "uppercase",
    },

    promoPriceLight: {
      color:
        colors.white,
      fontSize: 21,
      fontWeight: "900",
      letterSpacing: -0.8,
      marginTop: 1,
    },

    promoActionDark: {
      minHeight: 36,
      paddingHorizontal: 12,
      borderRadius: 999,
      backgroundColor:
        colors.ink,
      alignItems: "center",
      justifyContent:
        "center",
    },

    promoActionDarkText: {
      color:
        colors.white,
      fontSize: 10,
      fontWeight: "900",
    },

    promoActionLight: {
      minHeight: 36,
      paddingHorizontal: 12,
      borderRadius: 999,
      backgroundColor:
        colors.white,
      alignItems: "center",
      justifyContent:
        "center",
    },

    promoActionLightText: {
      color:
        colors.ink,
      fontSize: 10,
      fontWeight: "900",
    },

    promoPhoneWrap: {
      position: "absolute",
      right: -42,
      bottom: -68,
      width: 190,
      height: 250,
      alignItems: "center",
      justifyContent:
        "center",
      transform: [
        {
          rotate:
            "4deg",
        },
        {
          scale:
            0.78,
        },
      ],
      opacity: 0.98,
    },

    promoPhoneWrapSamsung: {
      right: -48,
      bottom: -70,
      width: 210,
      height: 270,
      transform: [
        {
          rotate:
            "2deg",
        },
        {
          scale:
            0.92,
        },
      ],
    },

    samsungVisualHalo: {
      position: "absolute",
      width: 190,
      height: 190,
      borderRadius: 999,
      backgroundColor:
        "rgba(255,255,255,0.24)",
    },

    trustStrip: {
      marginHorizontal: 24,
      marginTop: 12,
      marginBottom: 46,
      backgroundColor:
        colors.white,
      borderRadius: 20,
      borderWidth: 1,
      borderColor:
        colors.ink12,
      padding: 14,
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
      justifyContent:
        "space-between",
      shadowColor: "#000",
      shadowOpacity: 0.08,
      shadowRadius: 24,
      shadowOffset: {
        width: 0,
        height: 14,
      },
    },

    trustItem: {
      flexGrow: 1,
      flexBasis: 220,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingHorizontal: 10,
      paddingVertical: 8,
    },

    trustIcon: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor:
        colors.bg,
      textAlign: "center",
      lineHeight: 30,
      color:
        colors.ink,
      fontWeight: "900",
      overflow: "hidden",
    },

    trustText: {
      color:
        colors.ink,
      fontWeight: "900",
    },

    statement: {
      paddingHorizontal: 24,
      alignItems: "center",
      marginBottom: 48,
    },

    statementTitle: {
      color:
        colors.ink,
      fontSize: 48,
      lineHeight: 54,
      fontWeight: "900",
      letterSpacing: -2,
      textAlign: "center",
      maxWidth: 900,
    },

    statementText: {
      color:
        colors.ink70,
      fontSize: 18,
      marginTop: 10,
      textAlign: "center",
    },

    sectionHeader: {
      paddingHorizontal: 24,
      marginBottom: 18,
      flexDirection: "row",
      alignItems:
        "flex-end",
      justifyContent:
        "space-between",
    },

    sectionEyebrow: {
      color:
        colors.blue,
      fontSize: 11,
      fontWeight: "900",
      letterSpacing: 1.8,
      marginBottom: 6,
    },

    sectionTitle: {
      fontSize: 34,
      fontWeight: "900",
      color:
        colors.ink,
      letterSpacing: -1.3,
    },

    sectionSubText: {
      color:
        colors.ink40,
      fontSize: 13,
      fontWeight: "800",
      marginTop: 4,
    },

    sectionLink: {
      color:
        colors.blue,
      fontWeight: "900",
    },

    emptyState: {
      marginHorizontal: 24,
      backgroundColor:
        colors.white,
      borderWidth: 1,
      borderColor:
        colors.ink12,
      borderRadius: 24,
      padding: 26,
    },

    emptyTitle: {
      color:
        colors.ink,
      fontSize: 22,
      fontWeight: "900",
    },

    emptyText: {
      color:
        colors.ink70,
      marginTop: 6,
    },

    mobileProductScroll: {
      marginTop: 0,
      marginBottom: 2,
    },

    mobileProductRail: {
      paddingHorizontal: 16,
      paddingBottom: 14,
      gap: 12,
    },

    cardMobileRail: {
      flexGrow: 0,
      flexBasis: "auto",
      maxWidth: undefined,
      minHeight: 0,
      height: 332,
      borderRadius: 24,
      padding: 14,
    },

    phoneStageRail: {
      height: 160,
      marginBottom: 6,
    },

    cardNameRail: {
      color:
        colors.ink,
      fontSize: 19,
      lineHeight: 22,
      fontWeight: "900",
      letterSpacing: -0.6,
      marginTop: 2,
    },

    cardSpecRail: {
      color:
        colors.ink40,
      fontSize: 11,
      lineHeight: 15,
      marginTop: 4,
    },

    cardBottomRail: {
      marginTop: "auto",
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor:
        colors.ink06,
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
      gap: 8,
    },

    mainFromPriceRail: {
      color:
        colors.blue,
      fontSize: 22,
      lineHeight: 25,
      fontWeight: "900",
      letterSpacing: -0.8,
      marginTop: 1,
    },

    mobileOpenPill: {
      minHeight: 38,
      paddingHorizontal: 14,
      borderRadius: 999,
      backgroundColor:
        colors.ink,
      alignItems: "center",
      justifyContent:
        "center",
    },

    mobileOpenPillText: {
      color:
        colors.white,
      fontSize: 11,
      fontWeight: "900",
    },

    mobileTrustRail: {
      paddingHorizontal: 16,
      paddingTop: 2,
      paddingBottom: 22,
      gap: 8,
    },

    mobileTrustChip: {
      minHeight: 38,
      paddingHorizontal: 12,
      borderRadius: 999,
      borderWidth: 1,
      borderColor:
        colors.ink12,
      backgroundColor:
        colors.white,
      flexDirection: "row",
      alignItems: "center",
      gap: 7,
    },

    mobileTrustChipIcon: {
      color:
        colors.ink,
      fontSize: 12,
      fontWeight: "900",
    },

    mobileTrustChipText: {
      color:
        colors.ink70,
      fontSize: 11,
      fontWeight: "800",
    },

    emptyStateMobile: {
      marginHorizontal: 16,
      borderRadius: 20,
      padding: 20,
    },

    grid: {
      paddingHorizontal: 24,
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 18,
    },

    card: {
      backgroundColor:
        colors.white,
      borderRadius: 30,
      padding: 18,
      borderWidth: 1,
      borderColor:
        colors.ink12,
      flexGrow: 1,
      flexBasis: 250,
      maxWidth: 370,
      minHeight: 420,
      shadowColor: "#000",
      shadowOpacity: 0.045,
      shadowRadius: 18,
      shadowOffset: {
        width: 0,
        height: 12,
      },
    },

    cardTop: {
      flexDirection: "row",
      justifyContent:
        "space-between",
      alignItems: "center",
      marginBottom: 8,
    },

    cardBrand: {
      fontSize: 11,
      fontWeight: "900",
      color:
        colors.ink40,
      letterSpacing: 2.2,
    },

    availabilityPills: {
      flexDirection: "row",
      gap: 5,
    },

    availabilityPill: {
      color: "#233300",
      backgroundColor:
        colors.limeLt,
      fontSize: 9,
      fontWeight: "900",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 999,
      overflow: "hidden",
      textTransform:
        "uppercase",
    },

    phoneStage: {
      height: 220,
      alignItems: "center",
      justifyContent:
        "center",
      marginBottom: 12,
    },

    cardName: {
      fontSize: 21,
      fontWeight: "900",
      color:
        colors.ink,
      marginBottom: 6,
      letterSpacing: -0.7,
    },

    cardSpec: {
      fontSize: 13,
      color:
        colors.ink40,
      minHeight: 38,
      lineHeight: 18,
    },

    cardBottom: {
      marginTop: "auto",
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor:
        colors.ink06,
      flexDirection: "row",
      alignItems:
        "flex-end",
      justifyContent:
        "space-between",
      gap: 14,
    },

    priceArea: {
      flex: 1,
    },

    fromLabel: {
      color:
        colors.ink40,
      fontSize: 10,
      fontWeight: "900",
      textTransform:
        "uppercase",
      letterSpacing: 0.7,
    },

    mainFromPrice: {
      color:
        colors.blue,
      fontSize: 27,
      fontWeight: "900",
      letterSpacing: -1,
      marginTop: 1,
    },

    priceSubText: {
      color:
        colors.ink40,
      fontSize: 11,
      fontWeight: "800",
      marginTop: 2,
      lineHeight: 15,
    },

    viewButton: {
      backgroundColor:
        colors.ink,
      paddingHorizontal: 20,
      paddingVertical: 13,
      borderRadius: 14,
      alignItems: "center",
      justifyContent:
        "center",
      minHeight: 48,
      minWidth: 88,
    },

    viewButtonText: {
      color:
        colors.white,
      fontWeight: "900",
      fontSize: 13,
    },

    mobileHeader: {
      backgroundColor:
        colors.bg,
      paddingHorizontal: 16,
      paddingTop: 10,
      paddingBottom: 12,
      gap: 12,
      zIndex: 200,
    },

    mobileHeaderTop: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
      gap: 12,
      zIndex: 10,
    },

    mobileHeaderActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },

    brandRowMobile: {
      flexShrink: 1,
      gap: 9,
    },

    markMobile: {
      width: 38,
      height: 38,
      borderRadius: 13,
    },

    markInnerMobile: {
      width: 15,
      height: 15,
      borderRadius: 5,
    },

    logoMobile: {
      fontSize: 20,
      letterSpacing: -1,
    },

    logoSubMobile: {
      fontSize: 7.5,
      letterSpacing: 1.8,
      marginTop: -2,
    },

    mobileLanguageSwitcher: {
      height: 40,
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 4,
      paddingVertical: 4,
      borderRadius: 999,
      backgroundColor:
        colors.white,
      borderWidth: 1,
      borderColor:
        colors.ink12,
    },

    mobileLanguageIcon: {
      color:
        colors.ink,
      fontSize: 12,
      lineHeight: 16,
      marginLeft: 5,
      marginRight: 3,
    },

    mobileLanguageOption: {
      height: 30,
      minWidth: 31,
      paddingHorizontal: 7,
      borderRadius: 999,
      alignItems: "center",
      justifyContent:
        "center",
    },

    mobileLanguageOptionActive: {
      backgroundColor:
        colors.ink,
    },

    mobileLanguageOptionText: {
      color:
        colors.ink40,
      fontSize: 11,
      fontWeight: "900",
    },

    mobileLanguageOptionTextActive: {
      color:
        colors.white,
    },

    mobileCartButton: {
      minHeight: 40,
      maxWidth: 96,
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "center",
      gap: 6,
      paddingHorizontal: 12,
      borderRadius: 999,
      backgroundColor:
        colors.white,
      borderWidth: 1,
      borderColor:
        colors.ink12,
    },

    mobileCartText: {
      color:
        colors.ink,
      fontSize: 12,
      fontWeight: "900",
    },

    mobileCartBadge: {
      minWidth: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor:
        colors.blue,
      color:
        colors.white,
      textAlign: "center",
      lineHeight: 18,
      fontSize: 10,
      fontWeight: "900",
      overflow: "hidden",
    },

    mobileHeaderBottom: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      position: "relative",
      zIndex: 1000,
    },

    searchBoxMobile: {
      minHeight: 46,
      height: 46,
      paddingHorizontal: 14,
    },

    searchIconMobile: {
      fontSize: 19,
    },

    searchInputMobile: {
      fontSize: 14,
      minWidth: 0,
    },

    sectionHeaderMobile: {
      paddingHorizontal: 16,
      marginTop: 0,
      marginBottom: 12,
    },

    mobileSectionTopRow: {
      minHeight: 38,
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
      gap: 12,
      marginBottom: 6,
    },

    mobileCatalogButton: {
      minHeight: 36,
      paddingHorizontal: 13,
      borderRadius: 999,
      backgroundColor:
        colors.ink,
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "center",
      gap: 7,
    },

    mobileCatalogButtonText: {
      color:
        colors.white,
      fontSize: 11,
      fontWeight: "900",
    },

    mobileCatalogArrow: {
      color:
        colors.white,
      fontSize: 14,
      lineHeight: 16,
      fontWeight: "900",
    },

    sectionTitleMobile: {
      fontSize: 24,
      lineHeight: 27,
      letterSpacing: -0.8,
    },

    sectionSubTextMobile: {
      color:
        colors.ink40,
      fontSize: 12,
      lineHeight: 17,
      fontWeight: "800",
      marginTop: 4,
    },
  });