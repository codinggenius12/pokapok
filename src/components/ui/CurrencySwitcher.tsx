import {
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";

import {
    type StoreCurrency,
    useCurrency,
} from "../../context/CurrencyStore";

import { colors } from "../../theme/colors";

type CurrencySwitcherProps = {
  compact?: boolean;
};

const options:
  StoreCurrency[] = [
    "CVE",
    "EUR",
  ];

export default function CurrencySwitcher({
  compact = false,
}: CurrencySwitcherProps) {
  const {
    currency,
    setCurrency,
  } = useCurrency();

  return (
    <View
      style={[
        styles.container,
        compact &&
          styles.containerCompact,
      ]}
      accessibilityLabel="Display currency"
    >
      {options.map(
        (option) => {
          const active =
            currency ===
            option;

          return (
            <Pressable
              key={
                option
              }
              onPress={() =>
                setCurrency(
                  option
                )
              }
              style={[
                styles.option,
                compact &&
                  styles.optionCompact,
                active &&
                  styles.optionActive,
              ]}
              accessibilityRole="button"
              accessibilityState={{
                selected:
                  active,
              }}
            >
              <Text
                style={[
                  styles.text,
                  compact &&
                    styles.textCompact,
                  active &&
                    styles.textActive,
                ]}
              >
                {
                  option
                }
              </Text>
            </Pressable>
          );
        }
      )}
    </View>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",

      padding: 3,

      borderWidth: 1,
      borderColor:
        colors.ink12,
      borderRadius: 999,

      backgroundColor:
        colors.white,
    },

    containerCompact: {
      minHeight: 36,
    },

    option: {
      minWidth: 48,

      paddingHorizontal: 11,
      paddingVertical: 7,

      alignItems: "center",
      justifyContent:
        "center",

      borderRadius: 999,
    },

    optionCompact: {
      minWidth: 42,
      paddingHorizontal: 8,
      paddingVertical: 6,
    },

    optionActive: {
      backgroundColor:
        colors.ink,
    },

    text: {
      color: colors.ink40,

      fontSize: 11,
      fontWeight: "900",
      letterSpacing: 0.2,
    },

    textCompact: {
      fontSize: 10,
    },

    textActive: {
      color: colors.white,
    },
  });
