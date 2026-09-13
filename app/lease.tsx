import { Link } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { colors } from "../src/theme/colors";

export default function LeaseScreen() {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Link href={"/" as any} asChild>
          <Pressable>
            <Text style={styles.back}>← Back</Text>
          </Pressable>
        </Link>

        <Text style={styles.logo}>LUMINA</Text>
      </View>

      <View style={styles.hero}>
        <Text style={styles.kicker}>PHONE LEASING</Text>
        <Text style={styles.title}>
          Use the phone without paying everything upfront.
        </Text>
        <Text style={styles.text}>
          Leasing lets customers access a smartphone through a monthly contract.
          At the end, they can return it, upgrade, or buy it for a residual
          price.
        </Text>
      </View>

      <View style={styles.grid}>
        <View style={styles.card}>
          <Text style={styles.step}>01</Text>
          <Text style={styles.cardTitle}>Choose your phone</Text>
          <Text style={styles.cardText}>
            Select the model, color and storage that fits your budget and needs.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.step}>02</Text>
          <Text style={styles.cardTitle}>Pay monthly</Text>
          <Text style={styles.cardText}>
            Instead of paying the full amount upfront, you pay a fixed monthly
            amount during the contract.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.step}>03</Text>
          <Text style={styles.cardTitle}>Return, upgrade or buy</Text>
          <Text style={styles.cardText}>
            At the end of the contract, return the phone, upgrade to a new one,
            or buy it for a lower residual price.
          </Text>
        </View>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>For launch</Text>
        <Text style={styles.infoText}>
          Lease requests should be reviewed manually first. The website collects
          the customer request, then Lumina confirms eligibility, availability
          and contract terms.
        </Text>

        <Link href={"/catalog" as any} asChild>
          <Pressable style={styles.button}>
            <Text style={styles.buttonText}>Browse phones</Text>
          </Pressable>
        </Link>
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
    paddingHorizontal: 20,
    paddingBottom: 42,
  },
  header: {
    paddingVertical: 18,
    flexDirection: "row",
    alignItems: "center",
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
    borderRadius: 32,
    borderWidth: 1,
    borderColor: colors.ink12,
    padding: 28,
    marginBottom: 20,
  },
  kicker: {
    color: colors.blue,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.8,
    marginBottom: 12,
  },
  title: {
    fontSize: 48,
    lineHeight: 52,
    fontWeight: "900",
    color: colors.ink,
    letterSpacing: -1.7,
    maxWidth: 820,
  },
  text: {
    color: colors.ink70,
    fontSize: 18,
    lineHeight: 28,
    maxWidth: 720,
    marginTop: 16,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    marginBottom: 20,
  },
  card: {
    flexGrow: 1,
    flexBasis: 260,
    backgroundColor: colors.white,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.ink12,
    padding: 24,
  },
  step: {
    color: colors.blue,
    fontWeight: "900",
    fontSize: 14,
    marginBottom: 18,
  },
  cardTitle: {
    color: colors.ink,
    fontSize: 24,
    fontWeight: "900",
    marginBottom: 10,
  },
  cardText: {
    color: colors.ink70,
    fontSize: 16,
    lineHeight: 24,
  },
  infoBox: {
    backgroundColor: colors.ink,
    borderRadius: 32,
    padding: 28,
  },
  infoTitle: {
    color: colors.white,
    fontSize: 26,
    fontWeight: "900",
    marginBottom: 10,
  },
  infoText: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 17,
    lineHeight: 26,
    maxWidth: 720,
  },
  button: {
    backgroundColor: colors.blue,
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 16,
    alignSelf: "flex-start",
    marginTop: 22,
  },
  buttonText: {
    color: colors.white,
    fontWeight: "900",
  },
});