"use client";

import Script, { type ScriptProps } from "next/script";
import { useAnalyticsConsent, useMarketingConsent } from "@/features/cookie-consent/use-consent";

type AnalyticsScriptProps = Omit<ScriptProps, "children"> & {
  /** Script URL (e.g. Google Analytics). Not rendered until analytics consent is granted. */
  src: string;
};

/** Loads a third-party analytics script only after opt-in analytics consent. Safe default: renders nothing. */
export function ConsentGatedAnalyticsScript(props: AnalyticsScriptProps) {
  const allowed = useAnalyticsConsent();
  if (!allowed) return null;
  return <Script {...props} />;
}

type MarketingScriptProps = Omit<ScriptProps, "children"> & {
  src: string;
};

/** Loads marketing / ads scripts only after opt-in marketing consent. */
export function ConsentGatedMarketingScript(props: MarketingScriptProps) {
  const allowed = useMarketingConsent();
  if (!allowed) return null;
  return <Script {...props} />;
}
