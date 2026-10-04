import {
    usePathname,
} from "expo-router";

import {
    useEffect,
    useRef,
} from "react";

import {
    Platform,
} from "react-native";

import {
    getAnalyticsConsent,
    trackAnalyticsEvent,
} from "../../services/analyticsService";

export default function AnalyticsTracker() {
  const pathname =
    usePathname();

  const enteredAtRef =
    useRef(
      Date.now()
    );

  const pathRef =
    useRef(
      pathname
    );

  useEffect(
    () => {
      if (
        !getAnalyticsConsent()
      ) {
        pathRef.current =
          pathname;

        enteredAtRef.current =
          Date.now();

        return;
      }

      const previousPath =
        pathRef.current;

      const now =
        Date.now();

      if (
        previousPath &&
        previousPath !==
          pathname
      ) {
        const duration =
          now -
          enteredAtRef.current;

        void trackAnalyticsEvent({
          eventName:
            "page_exit",

          pagePath:
            previousPath,

          durationMs:
            duration,
        });
      }

      pathRef.current =
        pathname;

      enteredAtRef.current =
        now;

      void trackAnalyticsEvent({
        eventName:
          "page_view",

        pagePath:
          pathname,
      });
    },
    [
      pathname,
    ]
  );

  useEffect(
    () => {
      if (
        Platform.OS !==
          "web" ||
        typeof document ===
          "undefined"
      ) {
        return;
      }

      function handleClick(
        event:
          MouseEvent
      ) {
        if (
          !getAnalyticsConsent()
        ) {
          return;
        }

        const target =
          event.target as
            HTMLElement |
            null;

        const anchor =
          target?.closest(
            "a"
          ) as
            HTMLAnchorElement |
            null;

        if (
          !anchor
        ) {
          return;
        }

        const href =
          anchor.getAttribute(
            "href"
          );

        if (
          !href
        ) {
          return;
        }

        void trackAnalyticsEvent({
          eventName:
            "click",

          pagePath:
            window.location.pathname,

          metadata: {
            target:
              href,

            source:
              "link",
          },
        });
      }

      document.addEventListener(
        "click",
        handleClick,
        true
      );

      return () => {
        document.removeEventListener(
          "click",
          handleClick,
          true
        );
      };
    },
    []
  );

  useEffect(
    () => {
      if (
        Platform.OS !==
          "web" ||
        typeof window ===
          "undefined"
      ) {
        return;
      }

      function finishPage() {
        if (
          !getAnalyticsConsent()
        ) {
          return;
        }

        const duration =
          Date.now() -
          enteredAtRef.current;

        void trackAnalyticsEvent({
          eventName:
            "page_exit",

          pagePath:
            pathRef.current,

          durationMs:
            duration,
        });
      }

      window.addEventListener(
        "pagehide",
        finishPage
      );

      return () => {
        window.removeEventListener(
          "pagehide",
          finishPage
        );
      };
    },
    []
  );

  return null;
}