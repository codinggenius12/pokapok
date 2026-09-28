import type { Language } from "../i18n";
import type { Phone, PhoneSpecs } from "../types/phone";

/* =========================================================
   PRODUCT TAGLINES — PORTUGUESE
========================================================= */

const PORTUGUESE_TAGLINES: Record<string, string> = {
  "iphone-16-pro-max":
    "O iPhone mais avançado da Apple, com design premium em titânio, um poderoso sistema de câmaras e excelente autonomia.",

  "iphone-16-pro":
    "Um iPhone Pro compacto com A18 Pro, design em titânio, câmaras avançadas e desempenho premium.",

  "iphone-16":
    "Um iPhone moderno com processador A18, Controlo da Câmara, excelente autonomia e um ecrã OLED luminoso.",

  "iphone-15-pro-max":
    "Um iPhone Pro de grandes dimensões com estrutura em titânio, A17 Pro, USB-C, excelente autonomia e um sistema de câmaras profissional.",

  "iphone-15-pro":
    "Um iPhone premium com design leve em titânio, processador A17 Pro, USB-C, excelente autonomia e um sistema de câmaras profissional.",

  "iphone-15":
    "Um iPhone moderno com Dynamic Island, USB-C, ecrã OLED luminoso, excelente autonomia e um poderoso sistema de câmaras de 48 MP.",

  "iphone-14-pro-max":
    "Um iPhone Pro de grandes dimensões com Dynamic Island, ecrã ProMotion, excelente autonomia e um poderoso sistema de câmaras de 48 MP.",

  "iphone-14-pro":
    "Um iPhone Pro premium com Dynamic Island, ecrã de 120 Hz, processador A16 Bionic e um sistema de câmaras profissional.",

  "iphone-14":
    "Um iPhone fiável com ecrã OLED luminoso, boa autonomia e uma experiência iOS fluida.",

  "iphone-13-pro-max":
    "Um poderoso iPhone Pro Max com um grande ecrã OLED ProMotion, excelente autonomia, sistema de câmaras premium e ótimo desempenho no dia a dia.",

  "iphone-13-pro":
    "Um iPhone Pro premium recondicionado com ecrã ProMotion, um sistema de câmaras avançado e desempenho fiável.",

  "iphone-13":
    "Um iPhone fiável com ecrã OLED nítido, boa autonomia, sistema de câmara dupla e desempenho iOS fluido.",

  "galaxy-s25":
    "Um smartphone Samsung topo de gama moderno com Galaxy AI, desempenho premium, ecrã AMOLED luminoso e um sistema de câmaras aperfeiçoado.",

  "galaxy-s24-ultra":
    "Um poderoso topo de gama Android com ecrã premium, sistema de câmaras avançado e funcionalidades Galaxy AI integradas.",

  "galaxy-s23":
    "Um smartphone Samsung premium e compacto, com excelente desempenho, ecrã AMOLED luminoso e um fiável sistema de câmara tripla.",

  "galaxy-a36":
    "Um smartphone Samsung prático com ecrã AMOLED fluido, bom desempenho no dia a dia e opções mensais acessíveis.",

  "galaxy-a26":
    "Um smartphone Samsung acessível com ecrã de grandes dimensões, boa autonomia e desempenho fiável para o dia a dia.",

  "xiaomi-14-ultra":
    "Um topo de gama Android focado em fotografia, com óticas Leica, ecrã AMOLED premium, desempenho rápido e design de alta qualidade.",

  "poco-x7-pro":
    "Um smartphone Xiaomi focado no desempenho, com ecrã AMOLED fluido, bateria de grande capacidade e excelente relação qualidade-preço.",

  "redmi-note-14-pro-plus":
    "Um smartphone com excelente relação qualidade-preço, ecrã curvo premium, poderoso sistema de câmaras, bateria de grande capacidade e opções mensais acessíveis.",

  "nothing-phone-3a-pro":
    "Um smartphone Nothing premium com design transparente, iluminação Glyph, ecrã AMOLED fluido, boa autonomia e um sistema de câmaras melhorado.",

  "nothing-phone-3a":
    "Um smartphone de gama média elegante, com o design transparente da Nothing, iluminação Glyph, ecrã AMOLED fluido e excelente desempenho no dia a dia.",

  "nothing-phone-2a-plus":
    "Um elegante smartphone Nothing com design transparente, iluminação Glyph, ecrã AMOLED fluido, boa autonomia e desempenho melhorado para o dia a dia.",

  "nothing-phone-2":
    "Um smartphone único com design transparente, interface Glyph, experiência Nothing OS simples e desempenho fluido no dia a dia.",
};

/* =========================================================
   COLOR NAMES — PORTUGUESE

   IMPORTANT:
   These are DISPLAY names only.

   The original English color name must continue being used
   internally for:
   - cart
   - checkout
   - URLs
   - matching
   - variants
========================================================= */

const PORTUGUESE_COLORS: Record<string, string> = {
  "Desert Titanium": "Titânio deserto",
  "Black Titanium": "Titânio preto",
  "Natural Titanium": "Titânio natural",
  "White Titanium": "Titânio branco",
  "Blue Titanium": "Titânio azul",

  "Titanium Grey": "Titânio cinzento",
  "Titanium Black": "Titânio preto",
  "Titanium Purple": "Titânio violeta",
  "Titanium Yellow": "Titânio amarelo",

  Black: "Preto",
  White: "Branco",
  Blue: "Azul",
  Green: "Verde",
  Yellow: "Amarelo",
  Pink: "Rosa",
  Purple: "Roxo",
  Red: "Vermelho",
  Grey: "Cinzento",
  Navy: "Azul-marinho",

  "Space Black": "Preto espacial",
  Silver: "Prateado",
  Gold: "Dourado",
  "Deep Purple": "Roxo profundo",

  Midnight: "Meia-noite",
  Starlight: "Luz das estrelas",

  Graphite: "Grafite",
  "Sierra Blue": "Azul Sierra",
  "Alpine Green": "Verde alpino",

  "Phantom Black": "Preto Phantom",
  Cream: "Creme",
  Lavender: "Lavanda",

  "Awesome Black": "Preto",
  "Awesome White": "Branco",
  "Awesome Green": "Verde",
  "Awesome Lavender": "Lavanda",

  "Midnight Black": "Preto meia-noite",
  "Lavender Purple": "Roxo lavanda",

  Ultramarine: "Ultramarino",
};

/* =========================================================
   CAMERA SPECIFICATIONS — PORTUGUESE
========================================================= */

const PORTUGUESE_CAMERAS: Record<string, string> = {
  "48MP Fusion camera system":
    "Sistema de câmaras Fusion de 48 MP",

  "48MP Pro camera system":
    "Sistema de câmaras Pro de 48 MP",

  "48MP dual camera system":
    "Sistema de câmara dupla de 48 MP",

  "12MP dual camera system":
    "Sistema de câmara dupla de 12 MP",

  "12MP Pro camera system":
    "Sistema de câmaras Pro de 12 MP",

  "50MP triple camera system":
    "Sistema de câmara tripla de 50 MP",

  "200MP quad camera system":
    "Sistema de quatro câmaras de 200 MP",

  "Leica quad camera system":
    "Sistema de quatro câmaras Leica",

  "50MP dual camera system":
    "Sistema de câmara dupla de 50 MP",

  "200MP main camera":
    "Câmara principal de 200 MP",

  "50MP dual camera":
    "Câmara dupla de 50 MP",
};

/* =========================================================
   TAGLINE
========================================================= */

export function localizePhoneTagline(
  phone: Phone,
  language: Language
) {
  if (language === "en") {
    return phone.tagline;
  }

  return (
    PORTUGUESE_TAGLINES[
      phone.slug
    ] ?? phone.tagline
  );
}

/* =========================================================
   COLOR
========================================================= */

export function localizePhoneColor(
  colorName: string,
  language: Language
) {
  if (language === "en") {
    return colorName;
  }

  return (
    PORTUGUESE_COLORS[
      colorName
    ] ?? colorName
  );
}

/* =========================================================
   BATTERY
========================================================= */

function localizeBattery(
  value: string,
  language: Language
) {
  if (language === "en") {
    return value;
  }

  /*
   * Example:
   *
   * "Up to 33 hours video playback"
   *
   * becomes:
   *
   * "Até 33 horas de reprodução de vídeo"
   */

  const videoPlaybackMatch =
    value.match(
      /^Up to (\d+) hours video playback$/i
    );

  if (videoPlaybackMatch) {
    return `Até ${videoPlaybackMatch[1]} horas de reprodução de vídeo`;
  }

  /*
   * Values such as:
   *
   * 5000mAh
   * 4700mAh
   *
   * don't require translation.
   */

  return value;
}

/* =========================================================
   CAMERA
========================================================= */

function localizeCamera(
  value: string,
  language: Language
) {
  if (language === "en") {
    return value;
  }

  return (
    PORTUGUESE_CAMERAS[
      value
    ] ?? value
  );
}

/* =========================================================
   SINGLE SPEC
========================================================= */

export function localizePhoneSpec(
  key: keyof PhoneSpecs,
  value: string,
  language: Language
) {
  if (language === "en") {
    return value;
  }

  switch (key) {
    case "camera":
      return localizeCamera(
        value,
        language
      );

    case "battery":
      return localizeBattery(
        value,
        language
      );

    /*
     * These values contain mainly technical/product names:
     *
     * OLED
     * AMOLED
     * A18 Pro
     * Snapdragon
     * iOS
     * Android
     * RAM
     *
     * They don't need translation.
     */
    case "screen":
    case "chip":
    case "ram":
    case "os":
    default:
      return value;
  }
}

/* =========================================================
   ALL SPECS
========================================================= */

export function getLocalizedPhoneSpecs(
  phone: Phone,
  language: Language
): PhoneSpecs {
  return {
    screen:
      localizePhoneSpec(
        "screen",
        phone.specs.screen,
        language
      ),

    chip:
      localizePhoneSpec(
        "chip",
        phone.specs.chip,
        language
      ),

    camera:
      localizePhoneSpec(
        "camera",
        phone.specs.camera,
        language
      ),

    battery:
      localizePhoneSpec(
        "battery",
        phone.specs.battery,
        language
      ),

    ram:
      localizePhoneSpec(
        "ram",
        phone.specs.ram,
        language
      ),

    os:
      localizePhoneSpec(
        "os",
        phone.specs.os,
        language
      ),
  };
}

/* =========================================================
   CONDITION
========================================================= */

export function localizePhoneCondition(
  condition: Phone["condition"],
  language: Language
) {
  if (language === "en") {
    return condition === "new"
      ? "New"
      : "Refurbished";
  }

  return condition === "new"
    ? "Novo"
    : "Recondicionado";
}