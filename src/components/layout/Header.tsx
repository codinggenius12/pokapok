import { Link } from "expo-router";
import {
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { useLanguage } from "../../context/LanguageContext";
import { colors } from "../../theme/colors";
import CurrencySwitcher from "../ui/CurrencySwitcher";

type HeaderProps = {
  showBack?: boolean;
  backHref?: string;
  showCart?: boolean;
};

export default function Header({
  showBack = false,
  backHref = "/",
  showCart = true,
}: HeaderProps) {
  const {
    language,
    setLanguage,
  } = useLanguage();

  return (
    <View style={styles.header}>
      {/* LEFT */}
      <View style={styles.left}>
        {showBack ? (
          <Link
            href={backHref as any}
            asChild
          >
            <Pressable
              style={({ pressed }) => [
                styles.backButton,
                pressed &&
                  styles.pressed,
              ]}
            >
              <Text
                style={
                  styles.backText
                }
              >
                ←
              </Text>

              <Text
                style={
                  styles.backLabel
                }
              >
                {language === "pt"
                  ? "Voltar"
                  : "Back"}
              </Text>
            </Pressable>
          </Link>
        ) : (
          <View
            style={
              styles.sidePlaceholder
            }
          />
        )}
      </View>

      {/* LOGO */}
      <Link
        href={"/" as any}
        asChild
      >
        <Pressable
          style={({ pressed }) => [
            styles.logoButton,
            pressed &&
              styles.pressed,
          ]}
        >
          <Text style={styles.logo}>
            POKAPOK
          </Text>
        </Pressable>
      </Link>

      {/* RIGHT */}
      <View style={styles.right}>
        <CurrencySwitcher
          compact
        />

        <View
          style={
            styles.languageSwitcher
          }
        >
          <Pressable
            onPress={() =>
              void setLanguage("pt")
            }
            style={[
              styles.languageButton,
              language === "pt" &&
                styles.languageButtonActive,
            ]}
          >
            <Text
              style={[
                styles.languageText,
                language === "pt" &&
                  styles.languageTextActive,
              ]}
            >
              PT
            </Text>
          </Pressable>

          <Pressable
            onPress={() =>
              void setLanguage("en")
            }
            style={[
              styles.languageButton,
              language === "en" &&
                styles.languageButtonActive,
            ]}
          >
            <Text
              style={[
                styles.languageText,
                language === "en" &&
                  styles.languageTextActive,
              ]}
            >
              EN
            </Text>
          </Pressable>
        </View>

        {showCart ? (
          <Link
            href={"/cart" as any}
            asChild
          >
            <Pressable
              style={({ pressed }) => [
                styles.cartButton,
                pressed &&
                  styles.pressed,
              ]}
            >
              <Text
                style={
                  styles.cartText
                }
              >
                {language === "pt"
                  ? "Carrinho"
                  : "Cart"}
              </Text>
            </Pressable>
          </Link>
        ) : null}
      </View>
    </View>
  );
}

const styles =
  StyleSheet.create({
    header: {
      width: "100%",
      minHeight: 72,

      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",

      position: "relative",

      borderBottomWidth: 1,
      borderBottomColor:
        colors.ink06,
    },

    left: {
      flex: 1,
      alignItems:
        "flex-start",
      justifyContent:
        "center",
    },

    right: {
      flex: 1,

      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "flex-end",

      gap: 10,
    },

    sidePlaceholder: {
      width: 1,
      height: 1,
    },

    logoButton: {
      position: "absolute",
      left: "50%",

      transform: [
        {
          translateX: -48,
        },
      ],

      minHeight: 44,

      alignItems: "center",
      justifyContent:
        "center",

      paddingHorizontal: 8,
    },

    logo: {
      color: colors.blue,

      fontSize: 16,
      fontWeight: "900",

      letterSpacing: 2.4,
    },

    backButton: {
      minHeight: 42,

      flexDirection: "row",
      alignItems: "center",

      gap: 7,

      paddingRight: 10,
    },

    backText: {
      color: colors.ink,
      fontSize: 20,
      fontWeight: "700",
    },

    backLabel: {
      color: colors.ink70,
      fontSize: 13,
      fontWeight: "800",
    },

    languageSwitcher: {
      flexDirection: "row",
      alignItems: "center",

      backgroundColor:
        colors.white,

      borderRadius: 999,

      borderWidth: 1,
      borderColor:
        colors.ink12,

      padding: 3,
    },

    languageButton: {
      minWidth: 35,
      height: 32,

      paddingHorizontal: 9,

      alignItems: "center",
      justifyContent:
        "center",

      borderRadius: 999,
    },

    languageButtonActive: {
      backgroundColor:
        colors.ink,
    },

    languageText: {
      color: colors.ink40,

      fontSize: 11,
      fontWeight: "900",

      letterSpacing: 0.4,
    },

    languageTextActive: {
      color: colors.white,
    },

    cartButton: {
      minHeight: 38,

      alignItems: "center",
      justifyContent:
        "center",

      paddingHorizontal: 13,

      borderRadius: 999,

      backgroundColor:
        colors.blue,
    },

    cartText: {
      color: colors.white,

      fontSize: 11,
      fontWeight: "900",
    },

    pressed: {
      opacity: 0.65,
    },
  });
