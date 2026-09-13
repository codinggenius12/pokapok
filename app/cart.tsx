import { Link } from "expo-router";
import { useEffect } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useCart } from "../src/context/CartContext";
import { colors } from "../src/theme/colors";
import { formatCurrency, formatMonthly } from "../src/utils/formatCurrency";

export default function CartScreen() {
  const { items, removeItem, totalBuyNow, totalMonthly } = useCart();

  useEffect(() => {
    console.log("CART PAGE ITEMS:", items);
  }, [items]);

  const firstItem = items[0];

  const checkoutHref = firstItem
    ? `/checkout?phone=${firstItem.phone.slug}&color=${encodeURIComponent(
        firstItem.colorName
      )}&storage=${encodeURIComponent(firstItem.storageLabel)}&payment=${
        firstItem.paymentMode
      }`
    : "/checkout";

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Link href={"/" as any} asChild>
          <Pressable>
            <Text style={styles.back}>← Back home</Text>
          </Pressable>
        </Link>

        <Text style={styles.logo}>LUMINA</Text>
      </View>

      <View style={styles.hero}>
        <Text style={styles.kicker}>YOUR CART</Text>
        <Text style={styles.title}>Review your selected phones.</Text>
        <Text style={styles.text}>
          You can keep items in your cart or use fast checkout directly from a
          product page.
        </Text>
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyTitle}>Your cart is empty.</Text>

          <Text style={styles.emptyText}>
            Browse phones and add models you want to compare or order later.
          </Text>

          <Link href={"/catalog" as any} asChild>
            <Pressable style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>Browse phones</Text>
            </Pressable>
          </Link>
        </View>
      ) : (
        <View style={styles.page}>
          <View style={styles.list}>
            {items.map((item) => {
              const isBuyNow = item.paymentMode === "buy";
              const isLease = item.paymentMode === "lease";

              return (
                <View key={item.id} style={styles.item}>
                  <View style={styles.phonePreview}>
                    <View style={styles.phoneScreen} />
                  </View>

                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item.phone.name}</Text>

                    <Text style={styles.itemMeta}>
                      {item.storageLabel || "Default storage"} ·{" "}
                      {item.colorName || "Default color"}
                    </Text>

                    <Text style={styles.itemMeta}>
                      {item.phone.condition === "new"
                        ? "New"
                        : "Refurbished"}
                    </Text>

                    <Text style={styles.itemPrice}>
                      {isBuyNow
                        ? `Buy now · ${formatCurrency(item.unitPrice)}`
                        : `${
                            isLease ? "Lease" : "Financing"
                          } · €${formatMonthly(item.monthlyPrice)}/month`}
                    </Text>

                    {item.insurance ? (
                      <Text style={styles.itemMeta}>Protection included</Text>
                    ) : null}

                    {item.quantity > 1 ? (
                      <Text style={styles.itemMeta}>
                        Quantity: {item.quantity}
                      </Text>
                    ) : null}
                  </View>

                  <Pressable
                    onPress={() => removeItem(item.id)}
                    style={styles.removeButton}
                  >
                    <Text style={styles.removeButtonText}>Remove</Text>
                  </Pressable>
                </View>
              );
            })}
          </View>

          <View style={styles.summary}>
            <Text style={styles.summaryTitle}>Summary</Text>

            <View style={styles.summaryLine}>
              <Text style={styles.summaryLabel}>Items</Text>
              <Text style={styles.summaryValue}>{items.length}</Text>
            </View>

            <View style={styles.summaryLine}>
              <Text style={styles.summaryLabel}>One-time total</Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(totalBuyNow)}
              </Text>
            </View>

            <View style={styles.summaryLine}>
              <Text style={styles.summaryLabel}>Monthly total</Text>
              <Text style={styles.summaryValue}>
                €{formatMonthly(totalMonthly)}/month
              </Text>
            </View>

            <Text style={styles.microcopy}>
              No payment today. Checkout submits a request first, then Lumina
              confirms availability and terms.
            </Text>

            <Link href={checkoutHref as any} asChild>
              <Pressable style={styles.checkoutButton}>
                <Text style={styles.checkoutButtonText}>Go to checkout</Text>
              </Pressable>
            </Link>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    width: "100%",
    maxWidth: 1180,
    alignSelf: "center",
    paddingHorizontal: 22,
    paddingBottom: 56,
  },
  header: {
    paddingTop: 22,
    paddingBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  back: {
    color: colors.ink70,
    fontWeight: "900",
  },
  logo: {
    color: colors.blue,
    fontWeight: "900",
    letterSpacing: 2,
  },
  hero: {
    backgroundColor: colors.white,
    borderRadius: 34,
    borderWidth: 1,
    borderColor: colors.ink12,
    padding: 30,
    marginBottom: 22,
  },
  kicker: {
    color: colors.blue,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 2,
    marginBottom: 12,
  },
  title: {
    color: colors.ink,
    fontSize: 48,
    lineHeight: 52,
    fontWeight: "900",
    letterSpacing: -1.8,
  },
  text: {
    marginTop: 12,
    color: colors.ink70,
    fontSize: 18,
    lineHeight: 28,
    maxWidth: 720,
  },
  emptyBox: {
    backgroundColor: colors.white,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: colors.ink12,
    padding: 28,
  },
  emptyTitle: {
    color: colors.ink,
    fontSize: 28,
    fontWeight: "900",
  },
  emptyText: {
    color: colors.ink70,
    fontSize: 16,
    lineHeight: 24,
    marginTop: 8,
    maxWidth: 620,
  },
  primaryButton: {
    backgroundColor: colors.ink,
    paddingHorizontal: 22,
    paddingVertical: 15,
    borderRadius: 18,
    alignSelf: "flex-start",
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
  list: {
    flexGrow: 1,
    flexBasis: 650,
    gap: 14,
  },
  item: {
    backgroundColor: colors.white,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.ink12,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  phonePreview: {
    width: 64,
    height: 116,
    borderRadius: 20,
    backgroundColor: "#dfe4ee",
    padding: 5,
  },
  phoneScreen: {
    flex: 1,
    borderRadius: 15,
    backgroundColor: colors.blue,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: "900",
  },
  itemMeta: {
    color: colors.ink70,
    marginTop: 4,
  },
  itemPrice: {
    color: colors.blue,
    marginTop: 6,
    fontWeight: "900",
  },
  removeButton: {
    backgroundColor: colors.bg,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 14,
  },
  removeButtonText: {
    color: colors.ink,
    fontWeight: "900",
  },
  summary: {
    flexGrow: 1,
    flexBasis: 300,
    backgroundColor: colors.ink,
    borderRadius: 30,
    padding: 24,
    alignSelf: "flex-start",
  },
  summaryTitle: {
    color: colors.white,
    fontSize: 24,
    fontWeight: "900",
    marginBottom: 18,
  },
  summaryLine: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.12)",
    paddingVertical: 14,
  },
  summaryLabel: {
    color: "rgba(255,255,255,0.55)",
    fontWeight: "800",
  },
  summaryValue: {
    color: colors.white,
    fontSize: 26,
    fontWeight: "900",
    marginTop: 4,
  },
  microcopy: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 12,
  },
  checkoutButton: {
    backgroundColor: colors.blue,
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 22,
  },
  checkoutButtonText: {
    color: colors.white,
    fontWeight: "900",
    fontSize: 16,
  },
});