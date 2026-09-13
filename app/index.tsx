import { Link } from "expo-router";
import { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import PhoneVisual from "../src/components/phone/PhoneVisual";
import { useCart } from "../src/context/CartContext";
import { phones } from "../src/data/phones";
import { colors } from "../src/theme/colors";
import type { Phone } from "../src/types/phone";
import { formatCurrency } from "../src/utils/formatCurrency";

const categories = [
  "All",
  "iPhone",
  "Samsung",
  "New",
  "Refurbished",
  "Lease coming soon",
];

const budgetOptions = [
  { label: "Any budget", value: 1000 },
  { label: "Under €300", value: 300 },
  { label: "Under €400", value: 400 },
  { label: "Under €500", value: 500 },
  { label: "Under €700", value: 700 },
  { label: "€1000+", value: 1000 },
];

const refurbishedPriceMultiplier = 0.86;

function getNewPrice(phone: Phone) {
  if (phone.condition === "new") return phone.price;

  return Math.round(phone.price / refurbishedPriceMultiplier);
}

function getRefurbishedPrice(phone: Phone) {
  if (phone.condition === "refurbished") return phone.price;

  return Math.round(phone.price * refurbishedPriceMultiplier);
}

function getFromPrice(phone: Phone) {
  return Math.min(getNewPrice(phone), getRefurbishedPrice(phone));
}

export default function HomeScreen() {
  const { totalItems } = useCart();

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [showBudgetMenu, setShowBudgetMenu] = useState(false);
  const [maxBudget, setMaxBudget] = useState(1000);

  const heroPhone =
    phones.find((phone) => phone.slug === "iphone-13") ?? phones[0];

  const filteredPhones = useMemo(() => {
    const q = search.trim().toLowerCase();

    return [...phones]
      .filter((phone) => {
        if (!q) return true;

        const searchableText = [
          phone.name,
          phone.brand,
          phone.condition,
          phone.specs.screen,
          phone.specs.chip,
          phone.specs.camera,
          phone.storage.map((item) => item.label).join(" "),
          phone.colors.map((item) => item.name).join(" "),
        ]
          .join(" ")
          .toLowerCase();

        return searchableText.includes(q);
      })
      .filter((phone) => {
        if (activeCategory === "All") return true;
        if (activeCategory === "iPhone") return phone.brand === "apple";
        if (activeCategory === "Samsung") return phone.brand === "samsung";
        if (activeCategory === "New") return phone.condition === "new";
        if (activeCategory === "Refurbished") {
          return phone.condition === "refurbished";
        }
        if (activeCategory === "Lease coming soon") return true;

        return true;
      })
      .filter((phone) => {
        if (maxBudget >= 1000) return true;

        return getFromPrice(phone) <= maxBudget;
      })
      .sort((a, b) => b.featured - a.featured)
      .slice(0, 8);
  }, [search, activeCategory, maxBudget]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.utilityBar}>
        <Text style={styles.utilityText}>
          Premium smartphones · New & refurbished
        </Text>
        <Text style={styles.utilityText}>Português / English</Text>
      </View>

      <View style={styles.topbar}>
        <Link href={"/" as any} asChild>
          <Pressable style={styles.brandRow}>
            <View style={styles.mark}>
              <View style={styles.markInner} />
            </View>

            <View>
              <Text style={styles.logo}>LUMINA</Text>
              <Text style={styles.logoSub}>SMARTPHONES</Text>
            </View>
          </Pressable>
        </Link>

        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>⌕</Text>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search iPhone, Samsung, under €400..."
            placeholderTextColor={colors.ink40}
            style={styles.searchInput}
          />
        </View>

        <View style={styles.topActions}>
          <Link href={"/catalog" as any} asChild>
            <Pressable>
              <Text style={styles.helpText}>Catalog</Text>
            </Pressable>
          </Link>

          <Link href={"/cart" as any} asChild>
            <Pressable style={styles.cartButton}>
              <Text style={styles.cartButtonText}>Cart</Text>
              {totalItems > 0 && (
                <Text style={styles.cartBadge}>{totalItems}</Text>
              )}
            </Pressable>
          </Link>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryNav}
      >
        {categories.map((category) => (
          <Pressable
            key={category}
            onPress={() => {
              setActiveCategory(category);
              setShowBudgetMenu(false);
            }}
            style={[
              styles.categoryPill,
              activeCategory === category && styles.categoryPillActive,
            ]}
          >
            <Text
              style={[
                styles.categoryText,
                activeCategory === category && styles.categoryTextActive,
              ]}
            >
              {category}
            </Text>
          </Pressable>
        ))}

        <Pressable
          onPress={() => setShowBudgetMenu((current) => !current)}
          style={[
            styles.categoryPill,
            maxBudget < 1000 && styles.categoryPillActive,
          ]}
        >
          <Text
            style={[
              styles.categoryText,
              maxBudget < 1000 && styles.categoryTextActive,
            ]}
          >
            {maxBudget >= 1000 ? "Budget" : `Under €${maxBudget}`}
          </Text>
        </Pressable>
      </ScrollView>

      {showBudgetMenu && (
        <View style={styles.budgetMenu}>
          {budgetOptions.map((option) => {
            const active = maxBudget === option.value;

            return (
              <Pressable
                key={option.label}
                onPress={() => {
                  setMaxBudget(option.value);
                  setShowBudgetMenu(false);
                }}
                style={[
                  styles.budgetOption,
                  active && styles.budgetOptionActive,
                ]}
              >
                <Text
                  style={[
                    styles.budgetOptionText,
                    active && styles.budgetOptionTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}

      <View style={styles.hero}>
        <View style={styles.heroCopy}>
          <Text style={styles.kicker}>REFURBISHED IPHONES · FROM €329</Text>

          <Text style={styles.title}>Premium phones for less.</Text>

          <Text style={styles.text}>
            Start with affordable refurbished iPhones, then choose colour,
            storage, protection and payment options on the product page.
          </Text>

          <View style={styles.actions}>
            <Pressable
              style={styles.primaryButton}
              onPress={() => {
                setActiveCategory("iPhone");
                setMaxBudget(500);
                setShowBudgetMenu(false);
              }}
            >
              <Text style={styles.primaryButtonText}>Shop iPhones</Text>
            </Pressable>

            <Pressable
              style={styles.secondaryButton}
              onPress={() => {
                setActiveCategory("Refurbished");
                setMaxBudget(1000);
                setShowBudgetMenu(false);
              }}
            >
              <Text style={styles.secondaryButtonText}>Refurbished deals</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.heroVisual}>
          <View style={styles.heroGlowOne} />
          <View style={styles.heroGlowTwo} />

          <View style={styles.heroImageWrap}>
            <PhoneVisual phone={heroPhone} colorName="Blue" variant="hero" />
          </View>

          <View style={styles.floatCard}>
            <Text style={styles.floatLabel}>From</Text>
            <Text style={styles.floatPrice}>
              {formatCurrency(getFromPrice(heroPhone))}
            </Text>
            <Text style={styles.floatSubText}>
              Refurbished iPhone · checked device
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.trustStrip}>
        <View style={styles.trustItem}>
          <Text style={styles.trustIcon}>✓</Text>
          <Text style={styles.trustText}>Verified devices</Text>
        </View>

        <View style={styles.trustItem}>
          <Text style={styles.trustIcon}>★</Text>
          <Text style={styles.trustText}>2-year warranty</Text>
        </View>

        <View style={styles.trustItem}>
          <Text style={styles.trustIcon}>↺</Text>
          <Text style={styles.trustText}>New or refurbished</Text>
        </View>

        <View style={styles.trustItem}>
          <Text style={styles.trustIcon}>▣</Text>
          <Text style={styles.trustText}>Pickup or delivery</Text>
        </View>
      </View>

      <View style={styles.statement}>
        <Text style={styles.statementTitle}>Simple choice. Less noise.</Text>
        <Text style={styles.statementText}>
          See the starting price first. Configure only when you open the phone.
        </Text>
      </View>

      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionEyebrow}>CURATED SELECTION</Text>
          <Text style={styles.sectionTitle}>
            {activeCategory === "All" ? "Featured phones" : activeCategory}
          </Text>
          <Text style={styles.sectionSubText}>
            {maxBudget >= 1000
              ? "Showing lowest available prices"
              : `Showing phones up to €${maxBudget}`}
          </Text>
        </View>

        <Link href={"/catalog" as any} asChild>
          <Pressable>
            <Text style={styles.sectionLink}>See full catalog</Text>
          </Pressable>
        </Link>
      </View>

      {filteredPhones.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No phones found.</Text>
          <Text style={styles.emptyText}>
            Try increasing your budget or searching for iPhone, Samsung, new, or
            refurbished.
          </Text>
        </View>
      ) : (
        <View style={styles.grid}>
          {filteredPhones.map((phone) => (
            <View key={phone.id} style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.cardBrand}>
                  {phone.brand.toUpperCase()}
                </Text>

                <View style={styles.availabilityPills}>
                  <Text style={styles.availabilityPill}>New</Text>
                  <Text style={styles.availabilityPill}>Refurb.</Text>
                </View>
              </View>

              <View style={styles.phoneStage}>
                <PhoneVisual phone={phone} variant="card" />
              </View>

              <Text style={styles.cardName}>{phone.name}</Text>

              <Text style={styles.cardSpec}>
                {phone.specs.screen} · {phone.specs.chip}
              </Text>

              <View style={styles.cardBottom}>
                <View style={styles.priceArea}>
                  <Text style={styles.fromLabel}>From</Text>

                  <Text style={styles.mainFromPrice}>
                    {formatCurrency(getFromPrice(phone))}
                  </Text>

                  <Text style={styles.priceSubText}>
                    New or refurbished available
                  </Text>
                </View>

                <Link href={`/product/${phone.slug}` as any} asChild>
                  <Pressable style={styles.viewButton}>
                    <Text style={styles.viewButtonText}>View</Text>
                  </Pressable>
                </Link>
              </View>
            </View>
          ))}
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
    maxWidth: 1280,
    alignSelf: "center",
    paddingBottom: 56,
  },

  utilityBar: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 6,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  utilityText: {
    color: colors.ink40,
    fontSize: 12,
    fontWeight: "800",
  },

  topbar: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
    backgroundColor: colors.bg,
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
    backgroundColor: colors.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  markInner: {
    width: 14,
    height: 14,
    borderRadius: 5,
    backgroundColor: colors.blue,
  },
  logo: {
    fontSize: 22,
    fontWeight: "900",
    color: colors.ink,
    letterSpacing: -1.2,
  },
  logoSub: {
    fontSize: 9,
    fontWeight: "900",
    color: colors.ink40,
    letterSpacing: 2.4,
    marginTop: -3,
  },

  searchBox: {
    flex: 1,
    minHeight: 52,
    backgroundColor: colors.white,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.ink12,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  searchIcon: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: "900",
  },
  searchInput: {
    flex: 1,
    color: colors.ink,
    fontSize: 15,
    outlineStyle: "none" as any,
  },
  topActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  helpText: {
    color: colors.ink,
    fontWeight: "900",
  },
  cartButton: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.ink12,
    paddingHorizontal: 15,
    paddingVertical: 11,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cartButtonText: {
    color: colors.ink,
    fontWeight: "900",
  },
  cartBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.blue,
    color: colors.white,
    textAlign: "center",
    lineHeight: 20,
    fontSize: 12,
    fontWeight: "900",
    overflow: "hidden",
  },

  categoryNav: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    gap: 10,
  },
  categoryPill: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.ink12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
  },
  categoryPillActive: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  categoryText: {
    color: colors.ink70,
    fontWeight: "900",
    fontSize: 13,
  },
  categoryTextActive: {
    color: colors.white,
  },

  budgetMenu: {
    marginHorizontal: 24,
    marginBottom: 18,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.ink12,
    borderRadius: 22,
    padding: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  budgetOption: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.ink12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
  },
  budgetOptionActive: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  budgetOptionText: {
    color: colors.ink70,
    fontSize: 13,
    fontWeight: "900",
  },
  budgetOptionTextActive: {
    color: colors.white,
  },

  hero: {
    minHeight: 410,
    backgroundColor: "#C8A8FF",
    marginBottom: 0,
    paddingHorizontal: 64,
    paddingVertical: 46,
    flexDirection: "row",
    overflow: "hidden",
  },
  heroCopy: {
    flex: 1.1,
    justifyContent: "center",
    minWidth: 320,
    zIndex: 2,
  },
  kicker: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 2.2,
    marginBottom: 16,
  },
  title: {
    color: colors.ink,
    fontSize: 72,
    lineHeight: 70,
    fontWeight: "900",
    letterSpacing: -3.5,
    maxWidth: 760,
  },
  text: {
    color: colors.ink,
    opacity: 0.78,
    fontSize: 20,
    lineHeight: 31,
    maxWidth: 620,
    marginTop: 18,
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 28,
  },
  primaryButton: {
    backgroundColor: colors.ink,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 16,
  },
  primaryButtonText: {
    color: colors.white,
    fontWeight: "900",
    fontSize: 15,
  },
  secondaryButton: {
    backgroundColor: "rgba(255,255,255,0.55)",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 16,
  },
  secondaryButtonText: {
    color: colors.ink,
    fontWeight: "900",
    fontSize: 15,
  },

  heroVisual: {
    flex: 0.9,
    minWidth: 340,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  heroGlowOne: {
    position: "absolute",
    width: 380,
    height: 380,
    borderRadius: 190,
    backgroundColor: "rgba(234,255,157,0.55)",
    top: -80,
    right: 30,
  },
  heroGlowTwo: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "rgba(255,255,255,0.35)",
    bottom: -60,
    left: 20,
  },
  heroImageWrap: {
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
    transform: [{ rotate: "3deg" }],
  },
  floatCard: {
    position: "absolute",
    bottom: 54,
    right: 30,
    backgroundColor: colors.ink,
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 15,
    shadowColor: "#000",
    shadowOpacity: 0.22,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 14 },
    zIndex: 4,
    maxWidth: 240,
  },
  floatLabel: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  floatPrice: {
    color: colors.white,
    fontSize: 22,
    fontWeight: "900",
    marginTop: 2,
  },
  floatSubText: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 11,
    fontWeight: "800",
    marginTop: 3,
    lineHeight: 15,
  },

  trustStrip: {
    marginHorizontal: 24,
    marginTop: -28,
    marginBottom: 46,
    backgroundColor: colors.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.ink12,
    padding: 14,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
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
    backgroundColor: colors.bg,
    textAlign: "center",
    lineHeight: 30,
    color: colors.ink,
    fontWeight: "900",
    overflow: "hidden",
  },
  trustText: {
    color: colors.ink,
    fontWeight: "900",
  },

  statement: {
    paddingHorizontal: 24,
    alignItems: "center",
    marginBottom: 48,
  },
  statementTitle: {
    color: colors.ink,
    fontSize: 48,
    lineHeight: 54,
    fontWeight: "900",
    letterSpacing: -2,
    textAlign: "center",
    maxWidth: 900,
  },
  statementText: {
    color: colors.ink70,
    fontSize: 18,
    marginTop: 10,
    textAlign: "center",
  },

  sectionHeader: {
    paddingHorizontal: 24,
    marginBottom: 18,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  sectionEyebrow: {
    color: colors.blue,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.8,
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 34,
    fontWeight: "900",
    color: colors.ink,
    letterSpacing: -1.3,
  },
  sectionSubText: {
    color: colors.ink40,
    fontSize: 13,
    fontWeight: "800",
    marginTop: 4,
  },
  sectionLink: {
    color: colors.blue,
    fontWeight: "900",
  },

  emptyState: {
    marginHorizontal: 24,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.ink12,
    borderRadius: 24,
    padding: 26,
  },
  emptyTitle: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: "900",
  },
  emptyText: {
    color: colors.ink70,
    marginTop: 6,
  },

  grid: {
    paddingHorizontal: 24,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 18,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 30,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.ink12,
    flexGrow: 1,
    flexBasis: 250,
    maxWidth: 370,
    minHeight: 420,
    shadowColor: "#000",
    shadowOpacity: 0.045,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  cardBrand: {
    fontSize: 11,
    fontWeight: "900",
    color: colors.ink40,
    letterSpacing: 2.2,
  },
  availabilityPills: {
    flexDirection: "row",
    gap: 5,
  },
  availabilityPill: {
    color: "#233300",
    backgroundColor: colors.limeLt,
    fontSize: 9,
    fontWeight: "900",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: "hidden",
    textTransform: "uppercase",
  },
  phoneStage: {
    height: 220,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  cardName: {
    fontSize: 21,
    fontWeight: "900",
    color: colors.ink,
    marginBottom: 6,
    letterSpacing: -0.7,
  },
  cardSpec: {
    fontSize: 13,
    color: colors.ink40,
    minHeight: 38,
    lineHeight: 18,
  },
  cardBottom: {
    marginTop: "auto",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.ink06,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 14,
  },
  priceArea: {
    flex: 1,
  },
  fromLabel: {
    color: colors.ink40,
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  mainFromPrice: {
    color: colors.blue,
    fontSize: 27,
    fontWeight: "900",
    letterSpacing: -1,
    marginTop: 1,
  },
  priceSubText: {
    color: colors.ink40,
    fontSize: 11,
    fontWeight: "800",
    marginTop: 2,
    lineHeight: 15,
  },
  viewButton: {
    backgroundColor: colors.ink,
    paddingHorizontal: 20,
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
    minWidth: 88,
  },
  viewButtonText: {
    color: colors.white,
    fontWeight: "900",
    fontSize: 13,
  },
});