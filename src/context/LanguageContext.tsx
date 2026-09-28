import AsyncStorage from "@react-native-async-storage/async-storage";
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from "react";

import {
    DEFAULT_LANGUAGE,
    translations,
    type Language,
    type Translation,
} from "../i18n";

const LANGUAGE_STORAGE_KEY = "lumina-language";

/* =========================================================
   CONTEXT TYPE
========================================================= */

type LanguageContextValue = {
  language: Language;
  t: Translation;

  setLanguage: (
    language: Language
  ) => Promise<void>;

  toggleLanguage: () => Promise<void>;

  ready: boolean;
};

/* =========================================================
   CONTEXT
========================================================= */

const LanguageContext =
  createContext<
    LanguageContextValue | undefined
  >(undefined);

type LanguageProviderProps = {
  children: ReactNode;
};

/* =========================================================
   PROVIDER
========================================================= */

export function LanguageProvider({
  children,
}: LanguageProviderProps) {
  const [
    language,
    setLanguageState,
  ] = useState<Language>(
    DEFAULT_LANGUAGE
  );

  const [ready, setReady] =
    useState(false);

  /* =======================================================
     LOAD SAVED LANGUAGE

     First visit:
     Portuguese.

     Returning visitor:
     Use previously selected language.
  ======================================================= */

  useEffect(() => {
    let mounted = true;

    async function loadLanguage() {
      try {
        const savedLanguage =
          await AsyncStorage.getItem(
            LANGUAGE_STORAGE_KEY
          );

        if (!mounted) {
          return;
        }

        if (
          savedLanguage === "pt" ||
          savedLanguage === "en"
        ) {
          setLanguageState(
            savedLanguage
          );
        } else {
          setLanguageState(
            DEFAULT_LANGUAGE
          );
        }
      } catch (error) {
        console.error(
          "Failed to load language preference:",
          error
        );

        if (mounted) {
          setLanguageState(
            DEFAULT_LANGUAGE
          );
        }
      } finally {
        if (mounted) {
          setReady(true);
        }
      }
    }

    void loadLanguage();

    return () => {
      mounted = false;
    };
  }, []);

  /* =======================================================
     SET LANGUAGE
  ======================================================= */

  const setLanguage =
    useCallback(
      async (
        nextLanguage: Language
      ) => {
        /*
         * Change the interface immediately.
         */
        setLanguageState(
          nextLanguage
        );

        /*
         * Persist the preference for the
         * next visit.
         */
        try {
          await AsyncStorage.setItem(
            LANGUAGE_STORAGE_KEY,
            nextLanguage
          );
        } catch (error) {
          console.error(
            "Failed to save language preference:",
            error
          );
        }
      },
      []
    );

  /* =======================================================
     TOGGLE LANGUAGE
  ======================================================= */

  const toggleLanguage =
    useCallback(async () => {
      const nextLanguage: Language =
        language === "pt"
          ? "en"
          : "pt";

      await setLanguage(
        nextLanguage
      );
    }, [
      language,
      setLanguage,
    ]);

  /* =======================================================
     CURRENT TRANSLATIONS
  ======================================================= */

  const t: Translation =
    translations[language];

  /* =======================================================
     CONTEXT VALUE
  ======================================================= */

  const value =
    useMemo<LanguageContextValue>(
      () => ({
        language,
        t,
        setLanguage,
        toggleLanguage,
        ready,
      }),
      [
        language,
        t,
        setLanguage,
        toggleLanguage,
        ready,
      ]
    );

  /* =======================================================
     PROVIDER
  ======================================================= */

  return (
    <LanguageContext.Provider
      value={value}
    >
      {children}
    </LanguageContext.Provider>
  );
}

/* =========================================================
   HOOK
========================================================= */

export function useLanguage() {
  const context =
    useContext(
      LanguageContext
    );

  if (!context) {
    throw new Error(
      "useLanguage must be used inside LanguageProvider."
    );
  }

  return context;
}