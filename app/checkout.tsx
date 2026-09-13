import { Link, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useCart } from "../src/context/CartContext";
import { phones } from "../src/data/phones";
import {
  calculateMonthlyPrice,
  calculateUnitPrice,
} from "../src/services/pricingService";
import { colors } from "../src/theme/colors";
import type { PaymentMode, Phone } from "../src/types/phone";
import { formatCurrency, formatMonthly } from "../src/utils/formatCurrency";

function getParamValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value;
}

function getValidPaymentMode(value: string | string[] | undefined): PaymentMode {
  const payment = getParamValue(value);

  if (payment === "buy") return "buy";
  if (payment === "installments") return "installments";
  if (payment === "lease") return "lease";

  return "buy";
}

function findIndexByName<T>(
  items: T[],
  getName: (item: T) => string,
  value: string | undefined
) {
  if (!value) return 0;

  const index = items.findIndex(
    (item) => getName(item).trim().toLowerCase() === value.trim().toLowerCase()
  );

  return index >= 0 ? index : 0;
}

export default function CheckoutScreen() {
  const params = useLocalSearchParams<{
    phone?: string | string[];
    color?: string | string[];
    storage?: string | string[];
    payment?: string | string[];
  }>();

  const { items, clearCart, totalBuyNow, totalMonthly } = useCart();

  const phoneSlug = getParamValue(params.phone);
  const colorParam = getParamValue(params.color);
  const storageParam = getParamValue(params.storage);
  const initialPaymentMode = getValidPaymentMode(params.payment);

  const selectedCartItem = useMemo(() => {
    if (items.length === 0) return undefined;

    if (!phoneSlug) {
      return items[0];
    }

    return items.find((item) => item.phone.slug === phoneSlug) ?? items[0];
  }, [items, phoneSlug]);

  const selectedPhone: Phone | undefined = useMemo(() => {
    if (selectedCartItem?.phone) {
      return selectedCartItem.phone;
    }

    if (!phoneSlug) {
      return undefined;
    }

    return phones.find((phone) => phone.slug === phoneSlug);
  }, [selectedCartItem, phoneSlug]);

  const [colorIndex, setColorIndex] = useState(0);
  const [storageIndex, setStorageIndex] = useState(0);

  const [paymentMode, setPaymentMode] =
    useState<PaymentMode>(initialPaymentMode);

  const [months, setMonths] = useState(36);
  const [insurance, setInsurance] = useState(false);

  const [customer, setCustomer] = useState({
    name: "",
    whatsapp: "",
    city: "",
    email: "",
    notes: "",
  });

  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!selectedPhone) return;

    const selectedColor =
      colorParam ?? selectedCartItem?.colorName ?? selectedPhone.colors[0]?.name;

    const selectedStorage =
      storageParam ??
      selectedCartItem?.storageLabel?.split(" · ")[0] ??
      selectedPhone.storage[0]?.label;

    setColorIndex(
      findIndexByName(selectedPhone.colors, (item) => item.name, selectedColor)
    );

    setStorageIndex(
      findIndexByName(
        selectedPhone.storage,
        (item) => item.label,
        selectedStorage
      )
    );

    setPaymentMode(selectedCartItem?.paymentMode ?? initialPaymentMode);
    setInsurance(selectedCartItem?.insurance ?? false);
  }, [
    selectedPhone,
    selectedCartItem,
    colorParam,
    storageParam,
    initialPaymentMode,
  ]);

  const selectedColor = selectedPhone?.colors[colorIndex] ?? selectedPhone?.colors[0];
  const selectedStorage =
    selectedPhone?.storage[storageIndex] ?? selectedPhone?.storage[0];

  const unitPrice = useMemo(() => {
    if (selectedCartItem) {
      return selectedCartItem.unitPrice;
    }

    if (!selectedPhone || !selectedStorage) {
      return 0;
    }

    return calculateUnitPrice(
      selectedPhone.price,
      selectedStorage.priceIncrease
    );
  }, [selectedCartItem, selectedPhone, selectedStorage]);

  const monthlyPrice = useMemo(() => {
    if (selectedCartItem && selectedCartItem.paymentMode !== "buy") {
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
      leaseFrom: selectedPhone.leaseFrom,
    });
  }, [
    selectedCartItem,
    selectedPhone,
    unitPrice,
    paymentMode,
    months,
    insurance,
  ]);

  const cartHasItems = items.length > 0;

  function updateCustomer(key: keyof typeof customer, value: string) {
    setCustomer((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function submitRequest() {
    if (!selectedPhone || !selectedColor || !selectedStorage) {
      alert("Please choose a product first.");
      return;
    }

    if (
      !customer.name.trim() ||
      !customer.whatsapp.trim() ||
      !customer.city.trim()
    ) {
      alert("Please fill in your name, WhatsApp and city.");
      return;
    }

    const checkoutItems =
      items.length > 0
        ? items.map((item) => ({
            id: item.id,
            phoneId: item.phone.id,
            phoneSlug: item.phone.slug,
            phoneName: item.phone.name,
            brand: item.phone.brand,
            condition: item.phone.condition,
            color: item.colorName,
            storage: item.storageLabel,
            paymentMode: item.paymentMode,
            months: item.paymentMode === "installments" ? item.months : null,
            insurance: item.insurance,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            monthlyPrice: item.paymentMode === "buy" ? 0 : item.monthlyPrice,
            lineBuyNowTotal:
              item.paymentMode === "buy"
                ? item.unitPrice * item.quantity
                : 0,
            lineMonthlyTotal:
              item.paymentMode !== "buy"
                ? item.monthlyPrice * item.quantity
                : 0,
          }))
        : [
            {
              id: `${selectedPhone.id}-${selectedColor.name}-${selectedStorage.label}`,
              phoneId: selectedPhone.id,
              phoneSlug: selectedPhone.slug,
              phoneName: selectedPhone.name,
              brand: selectedPhone.brand,
              condition: selectedPhone.condition,
              color: selectedColor.name,
              storage: selectedStorage.label,
              paymentMode,
              months: paymentMode === "installments" ? months : null,
              insurance,
              quantity: 1,
              unitPrice,
              monthlyPrice: paymentMode === "buy" ? 0 : monthlyPrice,
              lineBuyNowTotal: paymentMode === "buy" ? unitPrice : 0,
              lineMonthlyTotal: paymentMode !== "buy" ? monthlyPrice : 0,
            },
          ];

    const request = {
      type: cartHasItems ? "cart_checkout" : "single_product_checkout",
      customer,
      items: checkoutItems,
      totals: {
        oneTimeTotal:
          cartHasItems
            ? totalBuyNow
            : paymentMode === "buy"
              ? unitPrice
              : 0,
        monthlyTotal:
          cartHasItems
            ? totalMonthly
            : paymentMode !== "buy"
              ? monthlyPrice
              : 0,
      },
      status: "new_request",
      createdAt: new Date().toISOString(),
    };

    console.log("LUMINA CHECKOUT REQUEST", request);

    if (cartHasItems) {
      clearCart();
    }

    setSubmitted(true);
  }

  if (!selectedPhone || !selectedColor || !selectedStorage) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Link href={"/catalog" as any} asChild>
            <Pressable>
              <Text style={styles.back}>← Back to catalog</Text>
            </Pressable>
          </Link>

          <Text style={styles.logo}>LUMINA</Text>
        </View>

        <View style={styles.emptyBox}>
          <Text style={styles.emptyKicker}>NO PRODUCT SELECTED</Text>

          <Text style={styles.emptyTitle}>Your checkout is empty.</Text>

          <Text style={styles.emptyText}>
            Add a phone to your cart first, then return to checkout.
          </Text>

          <Link href={"/catalog" as any} asChild>
            <Pressable style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>Browse phones</Text>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    );
  }

  if (submitted) {
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

        <View style={styles.successBox}>
          <Text style={styles.successKicker}>REQUEST RECEIVED</Text>

          <Text style={styles.successTitle}>We received your request.</Text>

          <Text style={styles.successText}>
            Lumina will contact you on WhatsApp to confirm availability, payment
            option and delivery.
          </Text>

          <Link href={"/catalog" as any} asChild>
            <Pressable style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>Browse more phones</Text>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Link href={"/cart" as any} asChild>
          <Pressable>
            <Text style={styles.back}>← Back to cart</Text>
          </Pressable>
        </Link>

        <Text style={styles.logo}>LUMINA</Text>
      </View>

      <View style={styles.hero}>
        <Text style={styles.kicker}>FAST CHECKOUT</Text>

        <Text style={styles.title}>Complete your request.</Text>

        <Text style={styles.text}>
          No payment today. Submit your request and Lumina will confirm
          availability, payment terms and delivery.
        </Text>
      </View>

      <View style={styles.page}>
        <View style={styles.formBox}>
          <Text style={styles.sectionTitle}>Selected phone</Text>

          <View style={styles.selectedCard}>
            <View style={styles.phonePreview}>
              <View style={styles.phoneScreen} />
            </View>

            <View style={styles.selectedInfo}>
              <Text style={styles.brand}>{selectedPhone.brand.toUpperCase()}</Text>

              <Text style={styles.phoneName}>{selectedPhone.name}</Text>

              <Text style={styles.phoneMeta}>
                {selectedPhone.condition === "new" ? "New" : "Refurbished"} ·{" "}
                {selectedPhone.specs.screen}
              </Text>
            </View>
          </View>

          {!cartHasItems ? (
            <>
              <Text style={styles.label}>Color</Text>

              <View style={styles.row}>
                {selectedPhone.colors.map((item, index) => (
                  <Pressable
                    key={item.name}
                    onPress={() => setColorIndex(index)}
                    style={[
                      styles.colorChoice,
                      colorIndex === index && styles.choiceActive,
                    ]}
                  >
                    <View
                      style={[styles.colorDot, { backgroundColor: item.hex }]}
                    />
                    <Text style={styles.choiceText}>{item.name}</Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.label}>Storage</Text>

              <View style={styles.row}>
                {selectedPhone.storage.map((item, index) => (
                  <Pressable
                    key={item.label}
                    onPress={() => setStorageIndex(index)}
                    style={[
                      styles.choice,
                      storageIndex === index && styles.choiceActive,
                    ]}
                  >
                    <Text style={styles.choiceText}>
                      {item.label}
                      {item.priceIncrease > 0
                        ? ` +${formatCurrency(item.priceIncrease)}`
                        : ""}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.label}>Payment option</Text>

              <View style={styles.row}>
                {(["buy", "installments", "lease"] as PaymentMode[]).map(
                  (mode) => (
                    <Pressable
                      key={mode}
                      onPress={() => setPaymentMode(mode)}
                      style={[
                        styles.choice,
                        paymentMode === mode && styles.choiceActive,
                      ]}
                    >
                      <Text style={styles.choiceText}>
                        {mode === "lease"
                          ? "Lease"
                          : mode === "installments"
                            ? "Installments"
                            : "Buy now"}
                      </Text>
                    </Pressable>
                  )
                )}
              </View>

              {paymentMode === "installments" ? (
                <>
                  <Text style={styles.label}>Term</Text>

                  <View style={styles.row}>
                    {[12, 24, 36].map((item) => (
                      <Pressable
                        key={item}
                        onPress={() => setMonths(item)}
                        style={[
                          styles.choice,
                          months === item && styles.choiceActive,
                        ]}
                      >
                        <Text style={styles.choiceText}>{item} months</Text>
                      </Pressable>
                    ))}
                  </View>
                </>
              ) : null}

              {paymentMode !== "buy" ? (
                <Pressable
                  onPress={() => setInsurance((current) => !current)}
                  style={[
                    styles.insurance,
                    insurance && styles.insuranceActive,
                  ]}
                >
                  <Text style={styles.insuranceTitle}>
                    Add protection insurance
                  </Text>
                  <Text style={styles.insuranceText}>
                    Theft, damage and technical support
                  </Text>
                </Pressable>
              ) : null}
            </>
          ) : (
            <View style={styles.cartNotice}>
              <Text style={styles.cartNoticeTitle}>
                Checking out {items.length} cart item{items.length === 1 ? "" : "s"}.
              </Text>
              <Text style={styles.cartNoticeText}>
                Product choices are locked from your cart. Go back to cart to
                remove or change items.
              </Text>
            </View>
          )}

          <Text style={styles.sectionTitle}>Your details</Text>

          <TextInput
            value={customer.name}
            onChangeText={(value) => updateCustomer("name", value)}
            placeholder="Full name"
            placeholderTextColor={colors.ink40}
            style={styles.input}
          />

          <TextInput
            value={customer.whatsapp}
            onChangeText={(value) => updateCustomer("whatsapp", value)}
            placeholder="WhatsApp number"
            placeholderTextColor={colors.ink40}
            style={styles.input}
          />

          <TextInput
            value={customer.city}
            onChangeText={(value) => updateCustomer("city", value)}
            placeholder="City"
            placeholderTextColor={colors.ink40}
            style={styles.input}
          />

          <TextInput
            value={customer.email}
            onChangeText={(value) => updateCustomer("email", value)}
            placeholder="Email optional"
            placeholderTextColor={colors.ink40}
            style={styles.input}
          />

          <TextInput
            value={customer.notes}
            onChangeText={(value) => updateCustomer("notes", value)}
            placeholder="Notes optional"
            placeholderTextColor={colors.ink40}
            style={[styles.input, styles.notes]}
            multiline
          />
        </View>

        <View style={styles.summaryBox}>
          <Text style={styles.summaryTitle}>Request summary</Text>

          {cartHasItems ? (
            <>
              {items.map((item) => (
                <View key={item.id} style={styles.summaryItem}>
                  <Text style={styles.summaryName}>{item.phone.name}</Text>
                  <Text style={styles.summaryMeta}>
                    {item.storageLabel} · {item.colorName}
                  </Text>
                  <Text style={styles.summaryMeta}>
                    {item.paymentMode === "buy"
                      ? formatCurrency(item.unitPrice)
                      : `€${formatMonthly(item.monthlyPrice)}/month`}
                  </Text>
                </View>
              ))}

              <View style={styles.divider} />

              <Text style={styles.price}>{formatCurrency(totalBuyNow)}</Text>
              <Text style={styles.priceSub}>one-time total</Text>

              <Text style={styles.monthlyTotal}>
                €{formatMonthly(totalMonthly)}/month
              </Text>
              <Text style={styles.priceSub}>monthly total</Text>
            </>
          ) : (
            <>
              <Text style={styles.summaryName}>{selectedPhone.name}</Text>

              <Text style={styles.summaryMeta}>
                {selectedStorage.label} · {selectedColor.name}
              </Text>

              <View style={styles.divider} />

              {paymentMode === "buy" ? (
                <>
                  <Text style={styles.price}>{formatCurrency(unitPrice)}</Text>
                  <Text style={styles.priceSub}>one-time buy request</Text>
                </>
              ) : (
                <>
                  <Text style={styles.price}>
                    €{formatMonthly(monthlyPrice)}/month
                  </Text>

                  <Text style={styles.priceSub}>
                    {paymentMode === "lease"
                      ? "lease request"
                      : `${months} monthly payments`}
                  </Text>
                </>
              )}
            </>
          )}

          <Text style={styles.microcopy}>
            No payment today. We contact you first to confirm the details.
          </Text>

          <Pressable style={styles.submitButton} onPress={submitRequest}>
            <Text style={styles.submitButtonText}>Submit request</Text>
          </Pressable>
        </View>
      </View>
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
  page: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 22,
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
  summaryBox: {
    flexGrow: 1,
    flexBasis: 300,
    backgroundColor: colors.ink,
    borderRadius: 30,
    padding: 24,
    alignSelf: "flex-start",
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: "900",
    marginTop: 8,
    marginBottom: 8,
  },
  selectedCard: {
    backgroundColor: colors.bg,
    borderRadius: 24,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  phonePreview: {
    width: 72,
    height: 132,
    borderRadius: 22,
    backgroundColor: "#dfe4ee",
    padding: 6,
  },
  phoneScreen: {
    flex: 1,
    borderRadius: 17,
    backgroundColor: colors.blue,
  },
  selectedInfo: {
    flex: 1,
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
  },
  phoneMeta: {
    color: colors.ink70,
    marginTop: 4,
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
  cartNoticeTitle: {
    color: colors.ink,
    fontWeight: "900",
    fontSize: 16,
  },
  cartNoticeText: {
    color: colors.ink70,
    marginTop: 5,
    lineHeight: 20,
  },
  input: {
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: colors.bg,
    paddingHorizontal: 15,
    color: colors.ink,
    fontSize: 16,
    outlineStyle: "none" as any,
  },
  notes: {
    minHeight: 88,
    paddingTop: 14,
  },
  summaryTitle: {
    color: colors.white,
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 18,
  },
  summaryItem: {
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  summaryName: {
    color: colors.white,
    fontSize: 18,
    fontWeight: "900",
  },
  summaryMeta: {
    color: "rgba(255,255,255,0.6)",
    marginTop: 5,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.12)",
    marginVertical: 18,
  },
  price: {
    color: colors.white,
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: -1.2,
  },
  monthlyTotal: {
    color: colors.white,
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: -0.8,
    marginTop: 18,
  },
  priceSub: {
    color: "rgba(255,255,255,0.6)",
    marginTop: 4,
  },
  microcopy: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 18,
  },
  submitButton: {
    backgroundColor: colors.blue,
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 22,
  },
  submitButtonText: {
    color: colors.white,
    fontWeight: "900",
    fontSize: 16,
  },
  successBox: {
    backgroundColor: colors.white,
    borderRadius: 34,
    borderWidth: 1,
    borderColor: colors.ink12,
    padding: 34,
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
  successText: {
    color: colors.ink70,
    fontSize: 18,
    lineHeight: 28,
    marginTop: 12,
    maxWidth: 700,
  },
  primaryButton: {
    backgroundColor: colors.ink,
    paddingHorizontal: 22,
    paddingVertical: 15,
    borderRadius: 18,
    alignSelf: "flex-start",
    marginTop: 24,
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
  emptyText: {
    color: colors.ink70,
    fontSize: 18,
    lineHeight: 28,
    marginTop: 12,
    maxWidth: 700,
  },
});