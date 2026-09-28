import { Link } from "expo-router";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useLanguage } from "../src/context/LanguageContext";
import { colors } from "../src/theme/colors";

export default function LeaseScreen() {
  const { language } = useLanguage();

  /* =======================================================
     TRANSLATIONS
  ======================================================= */

  const text =
    language === "pt"
      ? {
          back: "Voltar",

          kicker: "LEASING DE SMARTPHONES",

          title:
            "Use o seu smartphone sem pagar o valor total de uma só vez.",

          description:
            "O leasing permite-lhe utilizar um smartphone através de um contrato com pagamento mensal. No final do contrato, pode devolver o equipamento, trocar por um modelo mais recente ou comprá-lo pelo valor residual.",

          stepOneTitle:
            "Escolha o seu smartphone",

          stepOneText:
            "Selecione o modelo, a cor e o armazenamento que melhor se adaptam às suas necessidades e ao seu orçamento.",

          stepTwoTitle:
            "Pague mensalmente",

          stepTwoText:
            "Em vez de pagar o valor total de uma só vez, paga um valor mensal fixo durante o período do contrato.",

          stepThreeTitle:
            "Devolva, troque ou compre",

          stepThreeText:
            "No final do contrato, pode devolver o smartphone, trocar por um modelo mais recente ou comprá-lo pelo valor residual.",

          infoTitle:
            "Como funciona",

          infoText:
            "Os pedidos de leasing são analisados individualmente pela Lumina. Envie o seu pedido através do website e entraremos em contacto consigo para confirmar a elegibilidade, a disponibilidade do equipamento e as condições do contrato.",

          browsePhones:
            "Ver smartphones",
        }
      : {
          back: "Back",

          kicker: "PHONE LEASING",

          title:
            "Use the phone without paying everything upfront.",

          description:
            "Leasing lets you use a smartphone through a monthly contract. At the end of the contract, you can return it, upgrade to a newer model, or buy it for its residual value.",

          stepOneTitle:
            "Choose your phone",

          stepOneText:
            "Select the model, color and storage that best fit your needs and budget.",

          stepTwoTitle:
            "Pay monthly",

          stepTwoText:
            "Instead of paying the full amount upfront, you pay a fixed monthly amount during the contract.",

          stepThreeTitle:
            "Return, upgrade or buy",

          stepThreeText:
            "At the end of the contract, you can return the phone, upgrade to a newer model, or buy it for its residual value.",

          infoTitle:
            "How it works",

          infoText:
            "Lease requests are reviewed individually by Lumina. Submit your request through the website and we will contact you to confirm eligibility, device availability and contract terms.",

          browsePhones:
            "Browse phones",
        };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
    >
      {/* HEADER */}

      <View style={styles.header}>
        <Link href={"/" as any} asChild>
          <Pressable>
            <Text style={styles.back}>
              ← {text.back}
            </Text>
          </Pressable>
        </Link>

        <Text style={styles.logo}>
          LUMINA
        </Text>
      </View>

      {/* HERO */}

      <View style={styles.hero}>
        <Text style={styles.kicker}>
          {text.kicker}
        </Text>

        <Text style={styles.title}>
          {text.title}
        </Text>

        <Text style={styles.text}>
          {text.description}
        </Text>
      </View>

      {/* STEPS */}

      <View style={styles.grid}>
        {/* STEP 1 */}

        <View style={styles.card}>
          <Text style={styles.step}>
            01
          </Text>

          <Text style={styles.cardTitle}>
            {text.stepOneTitle}
          </Text>

          <Text style={styles.cardText}>
            {text.stepOneText}
          </Text>
        </View>

        {/* STEP 2 */}

        <View style={styles.card}>
          <Text style={styles.step}>
            02
          </Text>

          <Text style={styles.cardTitle}>
            {text.stepTwoTitle}
          </Text>

          <Text style={styles.cardText}>
            {text.stepTwoText}
          </Text>
        </View>

        {/* STEP 3 */}

        <View style={styles.card}>
          <Text style={styles.step}>
            03
          </Text>

          <Text style={styles.cardTitle}>
            {text.stepThreeTitle}
          </Text>

          <Text style={styles.cardText}>
            {text.stepThreeText}
          </Text>
        </View>
      </View>

      {/* INFORMATION */}

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>
          {text.infoTitle}
        </Text>

        <Text style={styles.infoText}>
          {text.infoText}
        </Text>

        <Link href={"/catalog" as any} asChild>
          <Pressable style={styles.button}>
            <Text style={styles.buttonText}>
              {text.browsePhones}
            </Text>
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