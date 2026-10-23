"use client";

import { useEffect } from "react";

function collectPrecacheUrls(): string[] {
  const urls = new Set<string>();
  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList;
    try {
      rules = sheet.cssRules;
    } catch {
      continue;
    }
    for (const rule of Array.from(rules)) {
      const found = rule.cssText.matchAll(/url\((['"]?)([^'")]+)\1\)/g);
      for (const match of found) {
        if (!match[2].includes(".woff2")) continue;
        const absolute = new URL(match[2], window.location.href);
        if (absolute.origin === window.location.origin) {
          urls.add(`${absolute.pathname}${absolute.search}`);
        }
      }
    }
  }
  document.querySelectorAll("img").forEach((img) => {
    const src = img.currentSrc || img.src;
    if (!src) return;
    const absolute = new URL(src, window.location.href);
    if (absolute.origin === window.location.origin) {
      urls.add(`${absolute.pathname}${absolute.search}`);
    }
  });
  return Array.from(urls);
}

function postPrecache(urls: string[]) {
  const worker = navigator.serviceWorker.controller;
  if (!worker || urls.length === 0) return;
  worker.postMessage({ type: "PRECACHE_URLS", urls });
}

export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    const sendVisibleAssets = () => postPrecache(collectPrecacheUrls());

    navigator.serviceWorker.register("/sw.js").then(() => {
      if (navigator.serviceWorker.controller) {
        window.setTimeout(sendVisibleAssets, 800);
        return;
      }
      navigator.serviceWorker.addEventListener(
        "controllerchange",
        () => window.setTimeout(sendVisibleAssets, 800),
        { once: true }
      );
    }).catch(() => {
      // Ignore SW registration errors in restricted contexts
    });
  }, []);

  return null;
}
