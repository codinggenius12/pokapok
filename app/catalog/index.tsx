import { Link } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import PhoneVisual from "../../src/components/phone/PhoneVisual";
import { phones } from "../../src/data/phones";

import {
  getActiveProductPrice,
  getPublicProducts,
  productHasPromotion,
  productIsPurchasable,
  type PublicProduct,
} from "../../src/services/productService";

import { colors } from "../../src/theme/colors";
import { formatCurrency } from "../../src/utils/formatCurrency";

type ConditionFilter =
  | "all"
  | "new"
  | "refurbished"
  | "used";

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

export default function CatalogScreen() {
  const [
    brand,
    setBrand,
  ] = useState(
    "all"
  );

  const [
    condition,
    setCondition,
  ] =
    useState<ConditionFilter>(
      "all"
    );

  const [
    query,
    setQuery,
  ] = useState("");

  const [
    supabaseProducts,
    setSupabaseProducts,
  ] =
    useState<
      PublicProduct[]
    >([]);

  const [
    loadingProducts,
    setLoadingProducts,
  ] =
    useState(true);

  const [
    productsError,
    setProductsError,
  ] =
    useState<
      string | null
    >(null);

  const [
    failedImages,
    setFailedImages,
  ] =
    useState<
      Record<
        string,
        boolean
      >
    >({});

  /* =========================================================
     LOAD LIVE PRODUCTS
  ========================================================= */

  useEffect(() => {
    let active =
      true;

    async function loadProducts() {
      try {
        setLoadingProducts(
          true
        );

        setProductsError(
          null
        );

        const data =
          await getPublicProducts();

        if (!active) {
          return;
        }

        setSupabaseProducts(
          data
        );

        /*
         * Useful while connecting the
         * dashboard image system.
         */
        console.log(
          "SUPABASE PRODUCTS:",
          data
        );

        console.log(
          "PRODUCT IMAGES:",
          data.map(
            (
              product
            ) => ({
              name:
                product.name,

              image_url:
                product.image_url,

              published:
                product.published,

              available:
                product.available,

              stock:
                product.stock,
            })
          )
        );
      } catch (
        error
      ) {
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
          setLoadingProducts(
            false
          );
        }
      }
    }

    loadProducts();

    return () => {
      active =
        false;
    };
  }, []);

  /* =========================================================
     CATALOG ITEMS

     Supabase is the source of truth.

     phones.ts only enriches older products
     with legacy visuals/specifications.
  ========================================================= */

  const catalogItems =
    useMemo<
      CatalogItem[]
    >(() => {
      const legacyMap =
        new Map(
          phones.map(
            (
              phone
            ) => [
              phone.slug,
              phone,
            ]
          )
        );

      return supabaseProducts
        .filter(
          (
            product
          ) =>
            product.published
        )
        .map(
          (
            product
          ) => {
            const legacyPhone =
              legacyMap.get(
                product.slug
              );

            return {
              id:
                product.id,

              slug:
                product.slug,

              name:
                product.name,

              brand:
                product.brand,

              condition:
                product.condition,

              live:
                product,

              legacyPhone,
            };
          }
        )
        .sort(
          (
            a,
            b
          ) =>
            Number(
              b.live.featured
            ) -
            Number(
              a.live.featured
            )
        );
    }, [
      supabaseProducts,
    ]);

  /* =========================================================
     DYNAMIC BRANDS
  ========================================================= */

  const brands =
    useMemo(
      () => {
        const uniqueBrands =
          Array.from(
            new Set(
              catalogItems.map(
                (
                  item
                ) =>
                  item.brand.toLowerCase()
              )
            )
          ).sort();

        return [
          "all",
          ...uniqueBrands,
        ];
      },
      [
        catalogItems,
      ]
    );

  /* =========================================================
     FILTER PRODUCTS
  ========================================================= */

  const filteredPhones =
    useMemo(
      () => {
        const q =
          query
            .trim()
            .toLowerCase();

        return catalogItems.filter(
          (
            item
          ) => {
            const brandMatches =
              brand ===
                "all" ||
              item.brand.toLowerCase() ===
                brand;

            const conditionMatches =
              condition ===
                "all" ||
              item.condition ===
                condition;

            const queryMatches =
              !q ||
              item.name
                .toLowerCase()
                .includes(
                  q
                ) ||
              item.brand
                .toLowerCase()
                .includes(
                  q
                ) ||
              item.live.model
                ?.toLowerCase()
                .includes(
                  q
                ) ||
              item.live.storage
                ?.toLowerCase()
                .includes(
                  q
                ) ||
              item.live.color
                ?.toLowerCase()
                .includes(
                  q
                );

            return (
              brandMatches &&
              conditionMatches &&
              queryMatches
            );
          }
        );
      },
      [
        catalogItems,
        brand,
        condition,
        query,
      ]
    );

  /* =========================================================
     IMAGE FAILURE HANDLER
  ========================================================= */

  function markImageFailed(
    productId: string
  ) {
    setFailedImages(
      (
        current
      ) => ({
        ...current,

        [productId]:
          true,
      })
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
      contentContainerStyle={
        styles.content
      }
    >
      <View
        style={
          styles.header
        }
      >
        <Link
          href={
            "/" as any
          }
          asChild
        >
          <Pressable>
            <Text
              style={
                styles.back
              }
            >
              ← Back
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
          styles.hero
        }
      >
        <Text
          style={
            styles.kicker
          }
        >
          CATALOG
        </Text>

        <Text
          style={
            styles.title
          }
        >
          Choose your phone.
        </Text>

        <Text
          style={
            styles.text
          }
        >
          Browse new and refurbished smartphones.
          Filter by brand, condition, or search by
          model.
        </Text>

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
              Updating prices and availability...
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
        ) : (
          <Text
            style={
              styles.syncText
            }
          >
            Live prices and stock updated
          </Text>
        )}
      </View>

      {/* =====================================================
          CONTROLS
      ===================================================== */}

      <View
        style={
          styles.controls
        }
      >
        <TextInput
          value={
            query
          }
          onChangeText={
            setQuery
          }
          placeholder="Search model..."
          placeholderTextColor={
            colors.ink40
          }
          style={
            styles.input
          }
        />

        <View
          style={
            styles.filterGroup
          }
        >
          {brands.map(
            (
              item
            ) => {
              const active =
                brand ===
                item;

              return (
                <Pressable
                  key={
                    item
                  }
                  onPress={() =>
                    setBrand(
                      item
                    )
                  }
                  style={[
                    styles.chip,

                    active &&
                      styles.chipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,

                      active &&
                        styles.chipTextActive,
                    ]}
                  >
                    {item ===
                    "all"
                      ? "All"
                      : formatBrandLabel(
                          item
                        )}
                  </Text>
                </Pressable>
              );
            }
          )}
        </View>

        <View
          style={
            styles.filterGroup
          }
        >
          {(
            [
              "all",
              "new",
              "refurbished",
              "used",
            ] as ConditionFilter[]
          ).map(
            (
              item
            ) => {
              const active =
                condition ===
                item;

              return (
                <Pressable
                  key={
                    item
                  }
                  onPress={() =>
                    setCondition(
                      item
                    )
                  }
                  style={[
                    styles.chip,

                    active &&
                      styles.chipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,

                      active &&
                        styles.chipTextActive,
                    ]}
                  >
                    {item ===
                    "all"
                      ? "All"
                      : item ===
                          "new"
                        ? "New"
                        : item ===
                            "refurbished"
                          ? "Refurbished"
                          : "Used"}
                  </Text>
                </Pressable>
              );
            }
          )}
        </View>
      </View>

      {/* =====================================================
          CATALOG
      ===================================================== */}

      {loadingProducts ? (
        <View
          style={
            styles.empty
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
            Loading catalogue...
          </Text>
        </View>
      ) : filteredPhones.length ===
        0 ? (
        <View
          style={
            styles.empty
          }
        >
          <Text
            style={
              styles.emptyTitle
            }
          >
            No phones found.
          </Text>

          <Text
            style={
              styles.emptyText
            }
          >
            Try another brand, condition,
            or search term.
          </Text>
        </View>
      ) : (
        <View
          style={
            styles.grid
          }
        >
          {filteredPhones.map(
            (
              item
            ) => {
              const live =
                item.live;

              const legacy =
                item.legacyPhone;

              const hasPromotion =
                productHasPromotion(
                  live
                );

              const purchasable =
                productIsPurchasable(
                  live
                );

              const activePrice =
                getActiveProductPrice(
                  live
                );

              /*
               * Use uploaded dashboard image
               * unless loading it previously failed.
               */
              const hasWorkingLiveImage =
                Boolean(
                  live.image_url
                ) &&
                !failedImages[
                  item.id
                ];

              return (
                <Link
                  key={
                    item.id
                  }
                  href={
                    `/product/${item.slug}` as any
                  }
                  asChild
                >
                  <Pressable
                    style={
                      styles.card
                    }
                  >
                    {/* =================================================
                        HEADER
                    ================================================= */}

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
                        {item.brand.toUpperCase()}
                      </Text>

                      <View
                        style={
                          styles.badges
                        }
                      >
                        {hasPromotion ? (
                          <Text
                            style={
                              styles.promotionBadge
                            }
                          >
                            SALE
                          </Text>
                        ) : null}

                        <Text
                          style={[
                            styles.condition,

                            item.condition ===
                            "new"
                              ? styles.new
                              : item.condition ===
                                  "used"
                                ? styles.used
                                : styles.refurbished,
                          ]}
                        >
                          {item.condition ===
                          "new"
                            ? "NEW"
                            : item.condition ===
                                "used"
                              ? "USED"
                              : "REFURB."}
                        </Text>
                      </View>
                    </View>

                    {/* =================================================
                        IMAGE
                    ================================================= */}

                    <View
                      style={
                        styles.phoneStage
                      }
                    >
                      {hasWorkingLiveImage ? (
                        <Image
                          source={{
                            uri:
                              live.image_url!,
                          }}
                          style={
                            styles.productImage
                          }
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
                          phone={
                            legacy
                          }
                          variant="card"
                        />
                      ) : (
                        <View
                          style={
                            styles.imagePlaceholder
                          }
                        >
                          <Text
                            style={
                              styles.imagePlaceholderBrand
                            }
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
                            Product image coming soon
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* =================================================
                        PRODUCT INFO
                    ================================================= */}

                    <Text
                      style={
                        styles.cardName
                      }
                    >
                      {
                        item.name
                      }
                    </Text>

                    <Text
                      style={
                        styles.cardSpec
                      }
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
                          "Smartphone"}
                    </Text>

                    {/* =================================================
                        COLORS
                    ================================================= */}

                    {legacy &&
                    legacy.colors.length >
                      0 ? (
                      <View
                        style={
                          styles.colorRow
                        }
                      >
                        {legacy.colors
                          .slice(
                            0,
                            4
                          )
                          .map(
                            (
                              color
                            ) => (
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
                        {
                          live.color
                        }
                      </Text>
                    ) : (
                      <View
                        style={
                          styles.colorSpacer
                        }
                      />
                    )}

                    {/* =================================================
                        STOCK
                    ================================================= */}

                    <View
                      style={
                        styles.statusRow
                      }
                    >
                      {!live.available ? (
                        <Text
                          style={
                            styles.unavailableText
                          }
                        >
                          Currently unavailable
                        </Text>
                      ) : live.stock >
                        0 ? (
                        <Text
                          style={[
                            styles.stockText,

                            live.stock <=
                              2 &&
                              styles.lowStockText,
                          ]}
                        >
                          {live.stock <=
                          2
                            ? `Only ${live.stock} left`
                            : `${live.stock} in stock`}
                        </Text>
                      ) : (
                        <Text
                          style={
                            styles.outOfStockText
                          }
                        >
                          Out of stock
                        </Text>
                      )}
                    </View>

                    {/* =================================================
                        PURCHASE METHODS
                    ================================================= */}

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
                            Lease
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
                            Financing
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
                            Insurance
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    {/* =================================================
                        PRICE
                    ================================================= */}

                    <View
                      style={
                        styles.cardFooter
                      }
                    >
                      <View
                        style={
                          styles.priceBlock
                        }
                      >
                        <Text
                          style={
                            styles.buyLabel
                          }
                        >
                          Buy now
                        </Text>

                        {hasPromotion ? (
                          <Text
                            style={
                              styles.oldPrice
                            }
                          >
                            {formatCurrency(
                              live.sale_price
                            )}
                          </Text>
                        ) : null}

                        <Text
                          style={
                            styles.buyMainPrice
                          }
                        >
                          {formatCurrency(
                            activePrice
                          )}
                        </Text>

                        {live.lease_enabled &&
                        live.lease_monthly_price !==
                          null ? (
                          <Text
                            style={
                              styles.optionPriceText
                            }
                          >
                            Lease from{" "}
                            {formatCurrency(
                              live.lease_monthly_price
                            )}
                            /mo
                          </Text>
                        ) : null}

                        {live.financing_enabled &&
                        live.financing_monthly_price !==
                          null ? (
                          <Text
                            style={
                              styles.optionPriceText
                            }
                          >
                            Financing from{" "}
                            {formatCurrency(
                              live.financing_monthly_price
                            )}
                            /mo
                          </Text>
                        ) : null}

                        {live.insurance_enabled &&
                        live.insurance_monthly_price !==
                          null ? (
                          <Text
                            style={
                              styles.optionPriceText
                            }
                          >
                            Insurance from{" "}
                            {formatCurrency(
                              live.insurance_monthly_price
                            )}
                            /mo
                          </Text>
                        ) : null}
                      </View>

                      <Text
                        style={[
                          styles.viewButton,

                          !purchasable &&
                            styles.viewButtonDisabled,
                        ]}
                      >
                        View
                      </Text>
                    </View>
                  </Pressable>
                </Link>
              );
            }
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
      alignSelf:
        "center",
      paddingHorizontal:
        20,
      paddingBottom:
        42,
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

    hero: {
      marginBottom:
        20,
    },

    kicker: {
      color:
        colors.blue,
      fontSize:
        12,
      fontWeight:
        "900",
      letterSpacing:
        1.8,
      marginBottom:
        10,
    },

    title: {
      fontSize:
        46,
      lineHeight:
        50,
      fontWeight:
        "900",
      color:
        colors.ink,
      letterSpacing:
        -1.5,
    },

    text: {
      marginTop:
        10,
      color:
        colors.ink70,
      fontSize:
        17,
      lineHeight:
        25,
      maxWidth:
        680,
    },

    connectionRow: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap:
        8,
      marginTop:
        10,
    },

    syncText: {
      marginTop:
        10,
      color:
        colors.good,
      fontSize:
        12,
      fontWeight:
        "800",
    },

    errorText: {
      marginTop:
        10,
      color:
        "#B42318",
      fontSize:
        12,
      fontWeight:
        "800",
    },

    controls: {
      backgroundColor:
        colors.white,
      borderRadius:
        24,
      borderWidth:
        1,
      borderColor:
        colors.ink12,
      padding:
        16,
      gap:
        12,
      marginBottom:
        20,
    },

    input: {
      minHeight:
        50,
      backgroundColor:
        colors.bg,
      borderRadius:
        14,
      paddingHorizontal:
        14,
      color:
        colors.ink,
      fontSize:
        16,
      outlineStyle:
        "none" as any,
    },

    filterGroup: {
      flexDirection:
        "row",
      flexWrap:
        "wrap",
      gap:
        8,
    },

    chip: {
      paddingHorizontal:
        15,
      paddingVertical:
        10,
      borderRadius:
        999,
      backgroundColor:
        colors.bg,
      borderWidth:
        1,
      borderColor:
        colors.ink12,
    },

    chipActive: {
      backgroundColor:
        colors.ink,
      borderColor:
        colors.ink,
    },

    chipText: {
      color:
        colors.ink70,
      fontWeight:
        "900",
    },

    chipTextActive: {
      color:
        colors.white,
    },

    grid: {
      flexDirection:
        "row",
      flexWrap:
        "wrap",
      gap:
        16,
    },

    card: {
      backgroundColor:
        colors.white,
      borderRadius:
        24,
      padding:
        18,
      borderWidth:
        1,
      borderColor:
        colors.ink12,
      flexGrow:
        1,
      flexBasis:
        260,
      maxWidth:
        370,
      minHeight:
        500,

      shadowColor:
        "#000",

      shadowOpacity:
        0.045,

      shadowRadius:
        14,

      shadowOffset: {
        width:
          0,

        height:
          10,
      },
    },

    cardTop: {
      flexDirection:
        "row",
      justifyContent:
        "space-between",
      alignItems:
        "center",
      marginBottom:
        12,
    },

    badges: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap:
        6,
    },

    cardBrand: {
      fontSize:
        11,
      fontWeight:
        "900",
      color:
        colors.ink40,
      letterSpacing:
        1.5,
    },

    promotionBadge: {
      fontSize:
        10,
      fontWeight:
        "900",
      color:
        "#B42318",
      backgroundColor:
        "#FEE4E2",
      paddingHorizontal:
        9,
      paddingVertical:
        4,
      borderRadius:
        999,
      overflow:
        "hidden",
    },

    condition: {
      fontSize:
        10,
      fontWeight:
        "900",
      paddingHorizontal:
        9,
      paddingVertical:
        4,
      borderRadius:
        999,
      overflow:
        "hidden",
    },

    new: {
      color:
        colors.good,

      backgroundColor:
        "rgba(31,164,99,0.10)",
    },

    refurbished: {
      color:
        "#233300",

      backgroundColor:
        colors.limeLt,
    },

    used: {
      color:
        "#6941C6",

      backgroundColor:
        "#F4F3FF",
    },

    phoneStage: {
      height:
        220,

      alignItems:
        "center",

      justifyContent:
        "center",

      marginBottom:
        16,

      overflow:
        "hidden",
    },

    /*
     * Important:
     * width and height are explicit,
     * so React Native Web has a real
     * box in which to render the image.
     */
    productImage: {
      width:
        "100%",

      height:
        210,
    },

    imagePlaceholder: {
      width:
        150,

      height:
        180,

      borderRadius:
        22,

      backgroundColor:
        colors.bg,

      borderWidth:
        1,

      borderColor:
        colors.ink12,

      alignItems:
        "center",

      justifyContent:
        "center",

      padding:
        15,
    },

    imagePlaceholderBrand: {
      fontSize:
        42,

      fontWeight:
        "900",

      color:
        colors.blue,
    },

    imagePlaceholderText: {
      color:
        colors.ink40,

      fontSize:
        10,

      fontWeight:
        "700",

      textAlign:
        "center",

      marginTop:
        8,
    },

    cardName: {
      fontSize:
        19,

      fontWeight:
        "900",

      color:
        colors.ink,

      marginBottom:
        6,
    },

    cardSpec: {
      fontSize:
        13,

      color:
        colors.ink40,

      minHeight:
        36,
    },

    colorRow: {
      flexDirection:
        "row",

      gap:
        6,

      marginVertical:
        14,
    },

    colorDot: {
      width:
        16,

      height:
        16,

      borderRadius:
        8,

      borderWidth:
        1,

      borderColor:
        colors.ink12,
    },

    singleColor: {
      color:
        colors.ink40,

      fontSize:
        11,

      fontWeight:
        "700",

      marginVertical:
        14,
    },

    colorSpacer: {
      height:
        44,
    },

    statusRow: {
      minHeight:
        20,

      marginBottom:
        8,
    },

    stockText: {
      color:
        colors.good,

      fontSize:
        11,

      fontWeight:
        "800",
    },

    lowStockText: {
      color:
        "#B54708",
    },

    outOfStockText: {
      color:
        "#B42318",

      fontSize:
        11,

      fontWeight:
        "800",
    },

    unavailableText: {
      color:
        colors.ink40,

      fontSize:
        11,

      fontWeight:
        "800",
    },

    purchaseMethods: {
      flexDirection:
        "row",

      flexWrap:
        "wrap",

      gap:
        6,

      marginBottom:
        12,

      minHeight:
        24,
    },

    methodBadge: {
      backgroundColor:
        colors.bg,

      borderWidth:
        1,

      borderColor:
        colors.ink12,

      borderRadius:
        999,

      paddingHorizontal:
        8,

      paddingVertical:
        4,
    },

    methodBadgeText: {
      color:
        colors.ink70,

      fontSize:
        9,

      fontWeight:
        "800",
    },

    cardFooter: {
      flexDirection:
        "row",

      justifyContent:
        "space-between",

      alignItems:
        "flex-end",

      marginTop:
        "auto",

      borderTopWidth:
        1,

      borderTopColor:
        colors.ink06,

      paddingTop:
        14,

      gap:
        12,
    },

    priceBlock: {
      flex:
        1,
    },

    buyLabel: {
      color:
        colors.ink40,

      fontSize:
        11,

      fontWeight:
        "900",

      textTransform:
        "uppercase",

      letterSpacing:
        0.6,
    },

    oldPrice: {
      color:
        colors.ink40,

      fontSize:
        13,

      fontWeight:
        "700",

      textDecorationLine:
        "line-through",

      marginTop:
        4,
    },

    buyMainPrice: {
      color:
        colors.blue,

      fontSize:
        24,

      fontWeight:
        "900",

      letterSpacing:
        -0.8,

      marginTop:
        2,
    },

    optionPriceText: {
      color:
        colors.ink40,

      fontSize:
        10,

      fontWeight:
        "800",

      marginTop:
        3,

      lineHeight:
        14,
    },

    viewButton: {
      backgroundColor:
        colors.ink,

      color:
        colors.white,

      paddingHorizontal:
        14,

      paddingVertical:
        10,

      borderRadius:
        14,

      overflow:
        "hidden",

      fontWeight:
        "900",
    },

    viewButtonDisabled: {
      opacity:
        0.55,
    },

    empty: {
      backgroundColor:
        colors.white,

      borderRadius:
        24,

      borderWidth:
        1,

      borderColor:
        colors.ink12,

      padding:
        28,

      alignItems:
        "center",

      justifyContent:
        "center",

      minHeight:
        180,
    },

    loadingTitle: {
      color:
        colors.ink70,

      fontSize:
        14,

      fontWeight:
        "800",

      marginTop:
        12,
    },

    emptyTitle: {
      color:
        colors.ink,

      fontSize:
        22,

      fontWeight:
        "900",
    },

    emptyText: {
      color:
        colors.ink70,

      marginTop:
        8,
    },
  });