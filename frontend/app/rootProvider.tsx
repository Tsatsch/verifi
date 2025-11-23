"use client";
import { ReactNode, useEffect } from "react";
import { CDPReactProvider, type Config, type Theme } from "@coinbase/cdp-react";

const config: Config = {
  projectId: process.env.NEXT_PUBLIC_CDP_PROJECT_ID || "",
  ethereum: {
    createOnLogin: "eoa", // Use EOA (Externally Owned Account) instead of smart wallet
  },
  appName: "Wifi-Radar",
  appLogoUrl: `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/logo_verifi-removebg.png`,
  authMethods: ["email", "sms", "oauth:google", "oauth:apple"],
  // We render our own wallet button in the top nav, so hide the default Coinbase footer widget
  showCoinbaseFooter: false,
};

// Debug logging
if (typeof window !== 'undefined') {
  console.log('🔧 CDP Config:', {
    projectId: config.projectId,
    appName: config.appName,
    authMethods: config.authMethods,
    url: process.env.NEXT_PUBLIC_URL,
  });
}

const theme: Partial<Theme> = {
  "colors-bg-default": "#0a0b0d",
  "colors-bg-alternate": "#1a1b1e",
  "colors-bg-primary": "#24d3ef", // Cyan for Wifi-Radar branding
  "colors-bg-secondary": "#1a1b1e",
  "colors-fg-default": "#ffffff",
  "colors-fg-muted": "#8a919e",
  "colors-fg-primary": "#24d3ef", // Cyan for primary text/buttons
  "colors-fg-onPrimary": "#0a0b0d",
  "colors-fg-onSecondary": "#ffffff",
  "colors-fg-positive": "#27ad75",
  "colors-fg-negative": "#f0616d",
  "colors-fg-warning": "#ed702f",
  "colors-line-default": "#252629",
  "colors-line-heavy": "#5a5d6a",
  "borderRadius-cta": "var(--cdp-web-borderRadius-md)",
  "borderRadius-link": "var(--cdp-web-borderRadius-md)",
  "borderRadius-input": "var(--cdp-web-borderRadius-sm)",
  "borderRadius-select-trigger": "var(--cdp-web-borderRadius-sm)",
  "borderRadius-select-list": "var(--cdp-web-borderRadius-sm)",
  "borderRadius-modal": "var(--cdp-web-borderRadius-md)",
  "font-family-sans": "'Space Grotesk', system-ui, sans-serif",
};

export function RootProvider({ children }: { children: ReactNode }) {
  return (
    <CDPReactProvider config={config} theme={theme}>
      {children}
    </CDPReactProvider>
  );
}

