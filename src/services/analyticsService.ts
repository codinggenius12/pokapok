import { Platform } from "react-native";

import { supabase } from "../lib/supabase";

export type AnalyticsEventName =
  | "page_view"
  | "page_exit"
  | "click"
  | "search"
  | "search_no_results"
  | "product_view"
  | "product_click"
  | "filter_used"
  | "add_to_cart"
  | "remove_from_cart"
  | "cart_view"
  | "checkout_started"
  | "checkout_completed"
  | "language_changed"
  | "currency_changed";

type AnalyticsMetadata =
  Record<
    string,
    string |
    number |
    boolean |
    null |
    undefined
  >;

type TrackEventInput = {
  eventName:
    AnalyticsEventName;

  pagePath?:
    string;

  productId?:
    string | null;

  productSlug?:
    string | null;

  searchQuery?:
    string | null;

  durationMs?:
    number | null;

  metadata?:
    AnalyticsMetadata;
};

const CONSENT_KEY =
  "pokapok_analytics_consent";

const SESSION_KEY =
  "pokapok_analytics_session";

function createSessionId() {
  try {
    return crypto.randomUUID();
  } catch {
    return [
      Date.now(),
      Math.random()
        .toString(36)
        .slice(2),
      Math.random()
        .toString(36)
        .slice(2),
    ].join("-");
  }
}

export function getAnalyticsConsent():
  boolean {
  if (
    Platform.OS !==
      "web" ||
    typeof window ===
      "undefined"
  ) {
    return false;
  }

  return (
    window.localStorage.getItem(
      CONSENT_KEY
    ) === "accepted"
  );
}

export function hasAnalyticsChoice():
  boolean {
  if (
    Platform.OS !==
      "web" ||
    typeof window ===
      "undefined"
  ) {
    return false;
  }

  const value =
    window.localStorage.getItem(
      CONSENT_KEY
    );

  return (
    value ===
      "accepted" ||
    value ===
      "rejected"
  );
}

export function setAnalyticsConsent(
  accepted:
    boolean
) {
  if (
    Platform.OS !==
      "web" ||
    typeof window ===
      "undefined"
  ) {
    return;
  }

  window.localStorage.setItem(
    CONSENT_KEY,
    accepted
      ? "accepted"
      : "rejected"
  );

  if (
    !accepted
  ) {
    window.sessionStorage.removeItem(
      SESSION_KEY
    );
  }
}

function getSessionId() {
  if (
    Platform.OS !==
      "web" ||
    typeof window ===
      "undefined"
  ) {
    return null;
  }

  let id =
    window.sessionStorage.getItem(
      SESSION_KEY
    );

  if (
    !id
  ) {
    id =
      createSessionId();

    window.sessionStorage.setItem(
      SESSION_KEY,
      id
    );
  }

  return id;
}

function getCurrentPath() {
  if (
    Platform.OS !==
      "web" ||
    typeof window ===
      "undefined"
  ) {
    return "/";
  }

  return (
    window.location.pathname +
    window.location.search
  );
}

export async function trackAnalyticsEvent({
  eventName,
  pagePath,
  productId,
  productSlug,
  searchQuery,
  durationMs,
  metadata = {},
}: TrackEventInput) {
  if (
    !getAnalyticsConsent()
  ) {
    return;
  }

  const sessionId =
    getSessionId();

  if (
    !sessionId
  ) {
    return;
  }

  try {
    await supabase
      .functions
      .invoke(
        "analytics-track",
        {
          body: {
            session_id:
              sessionId,

            event_name:
              eventName,

            page_path:
              pagePath ??
              getCurrentPath(),

            product_id:
              productId ??
              null,

            product_slug:
              productSlug ??
              null,

            search_query:
              searchQuery ??
              null,

            duration_ms:
              durationMs ??
              null,

            metadata,
          },
        }
      );
  } catch (
    error
  ) {
    /*
     * Analytics should never break the storefront.
     */
    console.warn(
      "Analytics event failed:",
      error
    );
  }
}

export function trackSearch(
  query:
    string,

  resultCount:
    number
) {
  const cleaned =
    query
      .trim()
      .slice(
        0,
        250
      );

  if (
    !cleaned
  ) {
    return;
  }

  void trackAnalyticsEvent({
    eventName:
      resultCount ===
        0
        ? "search_no_results"
        : "search",

    searchQuery:
      cleaned,

    metadata: {
      result_count:
        resultCount,
    },
  });
}

export function trackProductClick({
  productId,
  productSlug,
  source,
}: {
  productId?:
    string | null;

  productSlug:
    string;

  source:
    string;
}) {
  void trackAnalyticsEvent({
    eventName:
      "product_click",

    productId,

    productSlug,

    metadata: {
      source,
    },
  });
}