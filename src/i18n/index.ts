import en from "./en";
import pt from "./pt";

export type Language = "pt" | "en";

export const DEFAULT_LANGUAGE: Language = "pt";

/* =========================================================
   TRANSLATION SCHEMA

   Portuguese is the structural source of truth.

   Example:
   pt.catalog.title -> string
   pt.checkout.total -> string

   The actual translated text is widened to `string`,
   so English does not need to contain the same literal text.
========================================================= */

export type WidenTranslation<T> = {
  [K in keyof T]: T[K] extends string
    ? string
    : T[K] extends Record<string, unknown>
      ? WidenTranslation<T[K]>
      : T[K];
};

export type Translation = WidenTranslation<typeof pt>;

/* =========================================================
   LANGUAGE DICTIONARIES

   `satisfies` verifies that both dictionaries have the
   translation structure required by the application.
========================================================= */

export const translations = {
  pt,
  en,
} satisfies Record<Language, Translation>;

export { en, pt };
