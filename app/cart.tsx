import { Link } from "expo-router";
import { useEffect, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import PhoneVisual from "../src/components/phone/PhoneVisual";
import { useCart } from "../src/context/CartContext";
import { useLanguage } from "../src/context/LanguageContext";
import {
  getColorImage,
  getPublicProductBySlug,
  getPublicProductVariants,
} from "../src/services/productService";
import { colors } from "../src/theme/colors";
import {
  formatCurrency,
  formatMonthly,
} from "../src/utils/formatCurrency";

export default function CartScreen() {
  const {
    items,
    removeItem,
    totalBuyNow,
    totalMonthly,
  } = useCart();

  const { language } = useLanguage();

  const {
    width,
  } = useWindowDimensions();

  const isMobile =
    width < 720;

  /* =======================================================
     LOCALIZED TEXT
  ======================================================= */

  const text =
    language === "pt"
      ? {
          backHome: "Voltar ao início",

          kicker: "O SEU CARRINHO",

          title:
            "Reveja os equipamentos selecionados.",

          description:
            "Pode manter equipamentos no carrinho ou avançar diretamente para a finalização da compra.",

          emptyTitle:
            "O seu carrinho está vazio.",

          emptyText:
            "Explore os equipamentos disponíveis e adicione os modelos que pretende comparar ou encomendar.",

          browsePhones:
            "Ver equipamentos",

          defaultStorage:
            "Armazenamento padrão",

          defaultColor:
            "Cor padrão",

          new:
            "Novo",

          refurbished:
            "Recondicionado",

          buyNow:
            "Comprar",

          lease:
            "Leasing",

          financing:
            "Financiamento",

          perMonth:
            "/mês",

          protectionIncluded:
            "Proteção incluída",

          quantity:
            "Quantidade",

          remove:
            "Remover",

          summary:
            "Resumo",

          items:
            "Artigos",

          oneTimeTotal:
            "Total a pagar uma vez",

          monthlyTotal:
            "Total mensal",

          checkoutInfo:
            "Não é efetuado qualquer pagamento nesta fase. Ao finalizar, envia primeiro o pedido à Lumina para confirmação da disponibilidade e das condições.",

          goToCheckout:
            "Finalizar compra",
        }
      : {
          backHome:
            "Back home",

          kicker:
            "YOUR CART",

          title:
            "Review your selected phones.",

          description:
            "You can keep items in your cart or proceed directly to checkout.",

          emptyTitle:
            "Your cart is empty.",

          emptyText:
            "Browse the available devices and add the models you want to compare or order.",

          browsePhones:
            "Browse phones",

          defaultStorage:
            "Default storage",

          defaultColor:
            "Default color",

          new:
            "New",

          refurbished:
            "Refurbished",

          buyNow:
            "Buy now",

          lease:
            "Lease",

          financing:
            "Financing",

          perMonth:
            "/month",

          protectionIncluded:
            "Protection included",

          quantity:
            "Quantity",

          remove:
            "Remove",

          summary:
            "Summary",

          items:
            "Items",

          oneTimeTotal:
            "One-time total",

          monthlyTotal:
            "Monthly total",

          checkoutInfo:
            "No payment is made at this stage. Checkout first submits your request to Lumina for confirmation of availability and terms.",

          goToCheckout:
            "Go to checkout",
        };

  /* =======================================================
     CART IMAGES

     Resolve the current image from Supabase so images also
     work for older cart items already stored in localStorage.

     Priority:
       1. exact variant image
       2. selected colour image
       3. product image
       4. PhoneVisual fallback
  ======================================================= */

  const [
    cartImageUrls,
    setCartImageUrls,
  ] = useState<
    Record<
      string,
      string | null
    >
  >({});

  const [
    failedCartImages,
    setFailedCartImages,
  ] = useState<
    Record<
      string,
      boolean
    >
  >({});

  useEffect(
    () => {
      let active =
        true;

      async function loadCartImages() {
        if (
          items.length === 0
        ) {
          if (active) {
            setCartImageUrls(
              {}
            );
          }

          return;
        }

        const imageEntries =
          await Promise.all(
            items.map(
              async (item) => {
                try {
                  const product =
                    await getPublicProductBySlug(
                      item.phone.slug
                    );

                  if (!product) {
                    return [
                      item.id,
                      null,
                    ] as const;
                  }

                  const variants =
                    await getPublicProductVariants(
                      product.id
                    );

                  const exactVariant =
                    item.variantId
                      ? variants.find(
                          (
                            variant
                          ) =>
                            variant.id ===
                            item.variantId
                        ) ??
                        null
                      : null;

                  const imageUrl =
                    exactVariant?.image_url ??
                    getColorImage(
                      product,
                      variants,
                      item.colorName
                    ) ??
                    product.image_url ??
                    null;

                  return [
                    item.id,
                    imageUrl,
                  ] as const;
                } catch (
                  error
                ) {
                  console.error(
                    "Failed to load cart image:",
                    {
                      itemId:
                        item.id,
                      product:
                        item.phone
                          .name,
                      error,
                    }
                  );

                  return [
                    item.id,
                    null,
                  ] as const;
                }
              }
            )
          );

        if (!active) {
          return;
        }

        setCartImageUrls(
          Object.fromEntries(
            imageEntries
          )
        );

        setFailedCartImages(
          {}
        );
      }

      void loadCartImages();

      return () => {
        active =
          false;
      };
    },
    [items]
  );

  function markCartImageFailed(
    itemId: string
  ) {
    setFailedCartImages(
      (current) => ({
        ...current,
        [itemId]: true,
      })
    );
  }

  /* =======================================================
     DEBUG
  ======================================================= */

  useEffect(() => {
    console.log(
      "CART PAGE ITEMS:",
      items
    );
  }, [items]);

  /* =======================================================
     CHECKOUT LINK
  ======================================================= */

  const firstItem =
    items[0];

  const checkoutHref =
    firstItem
      ? `/checkout?phone=${encodeURIComponent(
          firstItem.phone.slug
        )}&color=${encodeURIComponent(
          firstItem.colorName
        )}&storage=${encodeURIComponent(
          firstItem.storageLabel
        )}&payment=${encodeURIComponent(
          firstItem.paymentMode
        )}`
      : "/checkout";

  /* =======================================================
     UI
  ======================================================= */

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
          href={"/" as any}
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
          LUMINA
        </Text>
      </View>

      {/* COMPACT CART HEADING */}

      <View
        style={[
          styles.hero,
          isMobile &&
            styles.heroMobile,
        ]}
      >
        <View
          style={
            styles.heroTopRow
          }
        >
          <View>
            <Text
              style={[
                styles.kicker,
                isMobile &&
                  styles.kickerMobile,
              ]}
            >
              {text.kicker}
            </Text>

            <Text
              style={[
                styles.title,
                isMobile &&
                  styles.titleMobile,
              ]}
            >
              {language === "pt"
                ? `Carrinho${
                    items.length > 0
                      ? ` · ${items.length}`
                      : ""
                  }`
                : `Cart${
                    items.length > 0
                      ? ` · ${items.length}`
                      : ""
                  }`}
            </Text>
          </View>

          {items.length > 0 ? (
            <Link
              href={"/catalog" as any}
              asChild
            >
              <Pressable
                style={
                  styles.continueShoppingButton
                }
              >
                <Text
                  style={
                    styles.continueShoppingText
                  }
                >
                  {language === "pt"
                    ? "Adicionar"
                    : "Add more"}
                </Text>
              </Pressable>
            </Link>
          ) : null}
        </View>

        {!isMobile ? (
          <Text
            style={
              styles.text
            }
          >
            {
              text.description
            }
          </Text>
        ) : null}
      </View>

      {/* EMPTY CART */}

      {items.length === 0 ? (
        <View
          style={[
            styles.emptyBox,
            isMobile &&
              styles.emptyBoxMobile,
          ]}
        >
          <Text
            style={[
              styles.emptyTitle,
              isMobile &&
                styles.emptyTitleMobile,
            ]}
          >
            {text.emptyTitle}
          </Text>

          <Text
            style={
              styles.emptyText
            }
          >
            {text.emptyText}
          </Text>

          <Link
            href={
              "/catalog" as any
            }
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
      ) : (
        <View
          style={[
            styles.page,
            isMobile &&
              styles.pageMobile,
          ]}
        >
          {/* CART ITEMS */}

          <View
            style={
              styles.list
            }
          >
            {items.map(
              (item) => {
                const isBuyNow =
                  item.paymentMode ===
                  "buy";

                const isLease =
                  item.paymentMode ===
                  "lease";

                const selectedColor =
                  item.phone.colors.find(
                    (color) =>
                      color.name
                        .trim()
                        .toLowerCase() ===
                      item.colorName
                        .trim()
                        .toLowerCase()
                  );

                const embeddedImageSource =
                  selectedColor?.image;

                const liveImageUrl =
                  cartImageUrls[
                    item.id
                  ] ?? null;

                const imageFailed =
                  Boolean(
                    failedCartImages[
                      item.id
                    ]
                  );

                return (
                  <View
                    key={item.id}
                    style={[
                      styles.item,
                      isMobile &&
                        styles.itemMobile,
                    ]}
                  >
                    {/* PHONE PREVIEW */}

                    <View
                      style={[
                        styles.phonePreview,
                        isMobile &&
                          styles.phonePreviewMobile,
                      ]}
                    >
                      {!imageFailed &&
                      (
                        liveImageUrl ||
                        embeddedImageSource
                      ) ? (
                        <Image
                          source={
                            liveImageUrl
                              ? {
                                  uri:
                                    liveImageUrl,
                                }
                              : embeddedImageSource!
                          }
                          style={
                            styles.cartProductImage
                          }
                          resizeMode="contain"
                          accessibilityLabel={`${item.phone.name} ${item.colorName}`}
                          onError={(
                            event
                          ) => {
                            console.error(
                              "Cart product image failed:",
                              {
                                product:
                                  item.phone
                                    .name,
                                color:
                                  item.colorName,
                                image:
                                  liveImageUrl,
                                error:
                                  event
                                    .nativeEvent
                                    .error,
                              }
                            );

                            markCartImageFailed(
                              item.id
                            );
                          }}
                        />
                      ) : (
                        <PhoneVisual
                          phone={
                            item.phone
                          }
                          variant="card"
                        />
                      )}
                    </View>

                    {/* INFORMATION */}

                    <View
                      style={
                        styles.itemInfo
                      }
                    >
                      <Text
                        numberOfLines={
                          isMobile
                            ? 2
                            : undefined
                        }
                        style={[
                          styles.itemName,
                          isMobile &&
                            styles.itemNameMobile,
                        ]}
                      >
                        {
                          item.phone
                            .name
                        }
                      </Text>

                      <Text
                        numberOfLines={
                          1
                        }
                        style={[
                          styles.itemMeta,
                          isMobile &&
                            styles.itemMetaMobile,
                        ]}
                      >
                        {item.storageLabel ||
                          text.defaultStorage}
                        {" · "}
                        {item.colorName ||
                          text.defaultColor}
                      </Text>

                      <View
                        style={
                          styles.itemBadgeRow
                        }
                      >
                        <View
                          style={
                            styles.conditionBadge
                          }
                        >
                          <Text
                            style={
                              styles.conditionBadgeText
                            }
                          >
                            {item.phone
                              .condition ===
                            "new"
                              ? text.new
                              : text.refurbished}
                          </Text>
                        </View>

                        {item.insurance ? (
                          <View
                            style={
                              styles.insuranceBadge
                            }
                          >
                            <Text
                              style={
                                styles.insuranceBadgeText
                              }
                            >
                              {
                                text.protectionIncluded
                              }
                            </Text>
                          </View>
                        ) : null}
                      </View>

                      <Text
                        style={[
                          styles.itemPrice,
                          isMobile &&
                            styles.itemPriceMobile,
                        ]}
                      >
                        {isBuyNow
                          ? `${formatCurrency(
                              item.unitPrice
                            )}`
                          : `${formatMonthly(
                              item.monthlyPrice
                            )}${text.perMonth}`}
                      </Text>

                      <Text
                        style={
                          styles.paymentModeText
                        }
                      >
                        {isBuyNow
                          ? text.buyNow
                          : isLease
                            ? text.lease
                            : text.financing}
                        {item.quantity > 1
                          ? ` · ${text.quantity}: ${item.quantity}`
                          : ""}
                      </Text>
                    </View>

                    {/* REMOVE */}

                    <Pressable
                      onPress={() =>
                        removeItem(
                          item.id
                        )
                      }
                      style={[
                        styles.removeButton,
                        isMobile &&
                          styles.removeButtonMobile,
                      ]}
                    >
                      <Text
                        style={
                          styles.removeButtonText
                        }
                      >
                        {isMobile
                          ? "×"
                          : text.remove}
                      </Text>
                    </Pressable>
                  </View>
                );
              }
            )}
          </View>

          {/* SUMMARY */}

          <View
            style={[
              styles.summary,
              isMobile &&
                styles.summaryMobile,
            ]}
          >
            <View
              style={
                styles.summaryHeader
              }
            >
              <Text
                style={[
                  styles.summaryTitle,
                  isMobile &&
                    styles.summaryTitleMobile,
                ]}
              >
                {text.summary}
              </Text>

              <Text
                style={
                  styles.summaryCount
                }
              >
                {items.length}{" "}
                {items.length === 1
                  ? language === "pt"
                    ? "artigo"
                    : "item"
                  : language === "pt"
                    ? "artigos"
                    : "items"}
              </Text>
            </View>

            <View
              style={
                styles.summaryTotals
              }
            >
              {totalBuyNow > 0 ? (
                <View
                  style={
                    styles.summaryCompactLine
                  }
                >
                  <Text
                    style={
                      styles.summaryLabel
                    }
                  >
                    {
                      text.oneTimeTotal
                    }
                  </Text>

                  <Text
                    style={[
                      styles.summaryValue,
                      isMobile &&
                        styles.summaryValueMobile,
                    ]}
                  >
                    {formatCurrency(
                      totalBuyNow
                    )}
                  </Text>
                </View>
              ) : null}

              {totalMonthly > 0 ? (
                <View
                  style={
                    styles.summaryCompactLine
                  }
                >
                  <Text
                    style={
                      styles.summaryLabel
                    }
                  >
                    {
                      text.monthlyTotal
                    }
                  </Text>

                  <Text
                    style={[
                      styles.summaryValue,
                      isMobile &&
                        styles.summaryValueMobile,
                    ]}
                  >
                    €
                    {formatMonthly(
                      totalMonthly
                    )}
                    {text.perMonth}
                  </Text>
                </View>
              ) : null}
            </View>

            {!isMobile ? (
              <Text
                style={
                  styles.microcopy
                }
              >
                {text.checkoutInfo}
              </Text>
            ) : null}

            <Link
              href={
                checkoutHref as any
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
                  {
                    text.goToCheckout
                  }
                </Text>
              </Pressable>
            </Link>

            {isMobile ? (
              <Text
                style={
                  styles.mobileMicrocopy
                }
              >
                {text.checkoutInfo}
              </Text>
            ) : null}
          </View>
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
      paddingHorizontal: 22,
      paddingBottom: 56,
    },

    contentMobile: {
      paddingHorizontal: 12,
      paddingBottom: 34,
    },

    header: {
      paddingTop: 22,
      paddingBottom: 20,
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
    },

    headerMobile: {
      paddingTop: 54,
      paddingBottom: 10,
      paddingHorizontal: 4,
    },

    backButton: {
      paddingVertical: 7,
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

    hero: {
      backgroundColor:
        colors.white,
      borderRadius: 34,
      borderWidth: 1,
      borderColor:
        colors.ink12,
      padding: 30,
      marginBottom: 22,
    },

    heroMobile: {
      padding: 16,
      borderRadius: 22,
      marginBottom: 12,
    },

    heroTopRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
      gap: 12,
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
      letterSpacing: 1.5,
      marginBottom: 4,
    },

    title: {
      color: colors.ink,
      fontSize: 48,
      lineHeight: 52,
      fontWeight: "900",
      letterSpacing: -1.8,
    },

    titleMobile: {
      fontSize: 28,
      lineHeight: 31,
      letterSpacing: -1,
    },

    text: {
      marginTop: 12,
      color: colors.ink70,
      fontSize: 18,
      lineHeight: 28,
      maxWidth: 720,
    },

    continueShoppingButton: {
      minHeight: 38,
      paddingHorizontal: 14,
      borderRadius: 999,
      backgroundColor:
        colors.bg,
      borderWidth: 1,
      borderColor:
        colors.ink12,
      alignItems: "center",
      justifyContent: "center",
    },

    continueShoppingText: {
      color: colors.ink,
      fontSize: 11,
      fontWeight: "900",
    },

    emptyBox: {
      backgroundColor:
        colors.white,
      borderRadius: 30,
      borderWidth: 1,
      borderColor:
        colors.ink12,
      padding: 28,
    },

    emptyBoxMobile: {
      borderRadius: 22,
      padding: 20,
    },

    emptyTitle: {
      color: colors.ink,
      fontSize: 28,
      fontWeight: "900",
    },

    emptyTitleMobile: {
      fontSize: 22,
    },

    emptyText: {
      color: colors.ink70,
      fontSize: 16,
      lineHeight: 24,
      marginTop: 8,
      maxWidth: 620,
    },

    primaryButton: {
      backgroundColor:
        colors.ink,
      paddingHorizontal: 22,
      paddingVertical: 15,
      borderRadius: 18,
      alignSelf:
        "flex-start",
      marginTop: 22,
    },

    primaryButtonText: {
      color: colors.white,
      fontWeight: "900",
    },

    page: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 22,
    },

    pageMobile: {
      flexDirection: "column",
      flexWrap: "nowrap",
      gap: 12,
    },

    list: {
      flexGrow: 1,
      flexBasis: 650,
      gap: 10,
      minWidth: 0,
    },

    item: {
      backgroundColor:
        colors.white,
      borderRadius: 28,
      borderWidth: 1,
      borderColor:
        colors.ink12,
      padding: 18,
      flexDirection: "row",
      alignItems: "center",
      gap: 16,
    },

    itemMobile: {
      borderRadius: 20,
      padding: 12,
      gap: 10,
      minHeight: 124,
    },

    phonePreview: {
      width: 88,
      height: 122,
      borderRadius: 20,
      backgroundColor:
        "#F3F5FA",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },

    phonePreviewMobile: {
      width: 82,
      height: 104,
      borderRadius: 17,
    },

    cartProductImage: {
      width: "92%",
      height: "92%",
      alignSelf: "center",
    },

    itemInfo: {
      flex: 1,
      minWidth: 0,
    },

    itemName: {
      color: colors.ink,
      fontSize: 20,
      fontWeight: "900",
    },

    itemNameMobile: {
      fontSize: 17,
      lineHeight: 20,
    },

    itemMeta: {
      color: colors.ink70,
      marginTop: 4,
    },

    itemMetaMobile: {
      fontSize: 12,
      marginTop: 3,
    },

    itemBadgeRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 5,
      marginTop: 6,
    },

    conditionBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 999,
      backgroundColor:
        colors.bg,
    },

    conditionBadgeText: {
      color: colors.ink70,
      fontSize: 9,
      fontWeight: "900",
    },

    insuranceBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 999,
      backgroundColor:
        colors.blueLt,
    },

    insuranceBadgeText: {
      color: colors.blue,
      fontSize: 9,
      fontWeight: "900",
    },

    itemPrice: {
      color: colors.blue,
      marginTop: 8,
      fontWeight: "900",
      fontSize: 17,
    },

    itemPriceMobile: {
      fontSize: 16,
      marginTop: 7,
    },

    paymentModeText: {
      color: colors.ink40,
      marginTop: 2,
      fontSize: 10,
      fontWeight: "800",
    },

    removeButton: {
      backgroundColor:
        colors.bg,
      paddingHorizontal: 14,
      paddingVertical: 11,
      borderRadius: 14,
    },

    removeButtonMobile: {
      alignSelf: "flex-start",
      width: 30,
      height: 30,
      paddingHorizontal: 0,
      paddingVertical: 0,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 999,
    },

    removeButtonText: {
      color: colors.ink,
      fontWeight: "900",
      fontSize: 16,
    },

    summary: {
      flexGrow: 1,
      flexBasis: 300,
      backgroundColor:
        colors.ink,
      borderRadius: 30,
      padding: 24,
      alignSelf:
        "flex-start",
    },

    summaryMobile: {
      width: "100%",
      flexGrow: 0,
      flexBasis: "auto",
      borderRadius: 22,
      padding: 18,
      alignSelf: "stretch",
    },

    summaryHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
      gap: 12,
      marginBottom: 10,
    },

    summaryTitle: {
      color: colors.white,
      fontSize: 24,
      fontWeight: "900",
    },

    summaryTitleMobile: {
      fontSize: 21,
    },

    summaryCount: {
      color:
        "rgba(255,255,255,0.55)",
      fontSize: 11,
      fontWeight: "800",
    },

    summaryTotals: {
      borderTopWidth: 1,
      borderTopColor:
        "rgba(255,255,255,0.12)",
    },

    summaryCompactLine: {
      paddingVertical: 11,
      flexDirection: "row",
      alignItems: "flex-end",
      justifyContent:
        "space-between",
      gap: 12,
      borderBottomWidth: 1,
      borderBottomColor:
        "rgba(255,255,255,0.08)",
    },

    summaryLabel: {
      color:
        "rgba(255,255,255,0.55)",
      fontWeight: "800",
      fontSize: 12,
      flex: 1,
    },

    summaryValue: {
      color: colors.white,
      fontSize: 26,
      fontWeight: "900",
      textAlign: "right",
    },

    summaryValueMobile: {
      fontSize: 22,
    },

    microcopy: {
      color:
        "rgba(255,255,255,0.55)",
      fontSize: 13,
      lineHeight: 19,
      marginTop: 12,
    },

    mobileMicrocopy: {
      color:
        "rgba(255,255,255,0.5)",
      fontSize: 10,
      lineHeight: 15,
      marginTop: 10,
      textAlign: "center",
    },

    checkoutButton: {
      backgroundColor:
        colors.blue,
      borderRadius: 16,
      paddingVertical: 15,
      alignItems: "center",
      marginTop: 16,
    },

    checkoutButtonText: {
      color: colors.white,
      fontWeight: "900",
      fontSize: 15,
    },
  });
