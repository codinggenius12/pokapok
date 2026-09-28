import {
    useCallback,
    useEffect,
    useSyncExternalStore,
} from "react";

export type StoreCurrency =
  | "CVE"
  | "EUR";

/*
 * The Cape Verde escudo is pegged to the euro.
 * Official conversion:
 *
 *   1 EUR = 110.265 CVE
 *
 * Supabase product prices remain authoritative in EUR.
 * This store only converts the amount shown to the customer.
 */
export const EUR_TO_CVE =
  110.265;

const STORAGE_KEY =
  "pokapok-display-currency";

let currentCurrency:
  StoreCurrency = "CVE";

const listeners =
  new Set<() => void>();

function emitChange() {
  listeners.forEach(
    (listener) =>
      listener()
  );
}

function subscribe(
  listener: () => void
) {
  listeners.add(
    listener
  );

  return () => {
    listeners.delete(
      listener
    );
  };
}

function getSnapshot() {
  return currentCurrency;
}

function getServerSnapshot():
  StoreCurrency {
  return "CVE";
}

function readStoredCurrency():
  StoreCurrency | null {
  if (
    typeof window ===
    "undefined"
  ) {
    return null;
  }

  try {
    const stored =
      window.localStorage.getItem(
        STORAGE_KEY
      );

    if (
      stored === "CVE" ||
      stored === "EUR"
    ) {
      return stored;
    }
  } catch {
    // Storage can be unavailable in private/restricted browsers.
  }

  return null;
}

function persistCurrency(
  currency: StoreCurrency
) {
  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }

  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      currency
    );
  } catch {
    // Keep the in-memory selection even if persistence is unavailable.
  }
}

export function setStoreCurrency(
  currency: StoreCurrency
) {
  if (
    currentCurrency ===
    currency
  ) {
    return;
  }

  currentCurrency =
    currency;

  persistCurrency(
    currency
  );

  emitChange();
}

export function convertFromEur(
  amount: number,
  currency: StoreCurrency
) {
  if (
    !Number.isFinite(
      amount
    )
  ) {
    return 0;
  }

  if (
    currency === "CVE"
  ) {
    return (
      amount *
      EUR_TO_CVE
    );
  }

  return amount;
}

function getLocale(
  language:
    | string
    | undefined
) {
  return language === "pt"
    ? "pt-PT"
    : "en-IE";
}

export function formatPriceFromEur(
  amount: number,
  currency: StoreCurrency,
  language?:
    | string
    | undefined
) {
  const converted =
    convertFromEur(
      amount,
      currency
    );

  const locale =
    getLocale(
      language
    );

  if (
    currency === "CVE"
  ) {
    /*
     * Retail prices in Cape Verde are easier to scan as
     * whole escudos. The underlying EUR amount is unchanged.
     */
    const rounded =
      Math.round(
        converted
      );

    return `${new Intl.NumberFormat(
      locale,
      {
        maximumFractionDigits:
          0,
      }
    ).format(
      rounded
    )} CVE`;
  }

  return new Intl.NumberFormat(
    locale,
    {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }
  ).format(
    converted
  );
}

export function useCurrency(
  language?:
    | string
    | undefined
) {
  const currency =
    useSyncExternalStore(
      subscribe,
      getSnapshot,
      getServerSnapshot
    );

  /*
   * CVE is the default.
   * If a web customer previously selected EUR,
   * restore that choice after the first render.
   */
  useEffect(
    () => {
      const stored =
        readStoredCurrency();

      if (
        stored &&
        stored !==
          currentCurrency
      ) {
        currentCurrency =
          stored;

        emitChange();
      }
    },
    []
  );

  const setCurrency =
    useCallback(
      (
        next:
          StoreCurrency
      ) => {
        setStoreCurrency(
          next
        );
      },
      []
    );

  const formatPrice =
    useCallback(
      (
        amount: number
      ) =>
        formatPriceFromEur(
          amount,
          currency,
          language
        ),
      [
        currency,
        language,
      ]
    );

  const convertPrice =
    useCallback(
      (
        amount: number
      ) =>
        convertFromEur(
          amount,
          currency
        ),
      [currency]
    );

  return {
    currency,
    setCurrency,
    formatPrice,
    convertPrice,
  };
}
