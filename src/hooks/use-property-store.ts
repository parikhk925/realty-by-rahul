"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  isProperty,
  normalizePropertyAvailability,
  properties as seedProperties,
  Property,
} from "@/lib/property-data";

const propertyStorageKey = "realty-by-rahul:properties:v1";
const propertyStoreEvent = "realty-by-rahul:properties-updated";
const smartCollectionSeedIds = new Set([
  "bayview-residences",
  "azure-creek",
]);

function readProperties() {
  try {
    const stored = window.localStorage.getItem(propertyStorageKey);
    if (!stored) return seedProperties;
    const parsed = JSON.parse(stored) as unknown;
    if (!Array.isArray(parsed) || !parsed.every(isProperty)) {
      return seedProperties;
    }
    const storedProperties = parsed.map(normalizePropertyAvailability);
    const missingSmartCollectionSeeds = seedProperties.filter(
      (property) =>
        smartCollectionSeedIds.has(property.id) &&
        !storedProperties.some((storedProperty) => storedProperty.id === property.id),
    );
    return [...missingSmartCollectionSeeds, ...storedProperties];
  } catch {
    return seedProperties;
  }
}

function writeProperties(properties: Property[]) {
  window.localStorage.setItem(propertyStorageKey, JSON.stringify(properties));
  window.dispatchEvent(
    new CustomEvent<Property[]>(propertyStoreEvent, { detail: properties }),
  );
}

export function usePropertyStore() {
  const [properties, setPropertiesState] =
    useState<Property[]>(seedProperties);
  const propertiesRef = useRef<Property[]>(seedProperties);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const storedProperties = readProperties();
    propertiesRef.current = storedProperties;
    setPropertiesState(storedProperties);
    setHydrated(true);

    // The cached copy paints immediately; the shared inventory then replaces it
    // so every agent sees the same projects on any device. Cloud silence — no
    // database, offline, signed out — simply leaves the local copy in place.
    let cancelled = false;
    void fetch("/api/projects/list")
      .then((response) => (response.ok ? response.json() : undefined))
      .then((payload: { properties?: unknown; skipped?: boolean } | undefined) => {
        if (cancelled || !payload || payload.skipped) return;
        const remote = payload.properties;
        if (!Array.isArray(remote)) return;
        // Filter rather than reject wholesale. Requiring every row to validate
        // meant one unrecognised field hid the entire portfolio behind a stale
        // cache, and an empty result used to be ignored — so deleted listings
        // lingered in the studio forever.
        const cloudProperties = remote
          .filter(isProperty)
          .map(normalizePropertyAvailability);
        propertiesRef.current = cloudProperties;
        setPropertiesState(cloudProperties);
        try {
          window.localStorage.setItem(
            propertyStorageKey,
            JSON.stringify(cloudProperties),
          );
        } catch {
          // A full storage quota must not break the session.
        }
      })
      .catch(() => {
        // Offline is expected; the cached inventory stays usable.
      });

    const handleStoreUpdate = (event: Event) => {
      const properties = (event as CustomEvent<Property[]>).detail;
      if (properties) {
        propertiesRef.current = properties;
        setPropertiesState(properties);
      }
    };
    const handleStorage = (event: StorageEvent) => {
      if (event.key === propertyStorageKey) {
        const storedProperties = readProperties();
        propertiesRef.current = storedProperties;
        setPropertiesState(storedProperties);
      }
    };

    window.addEventListener(propertyStoreEvent, handleStoreUpdate);
    window.addEventListener("storage", handleStorage);
    return () => {
      cancelled = true;
      window.removeEventListener(propertyStoreEvent, handleStoreUpdate);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const setProperties = useCallback(
    (
      update:
        | Property[]
        | ((currentProperties: Property[]) => Property[]),
    ) => {
      const nextProperties =
        typeof update === "function"
          ? update(propertiesRef.current)
          : update;
      propertiesRef.current = nextProperties;
      setPropertiesState(nextProperties);
      writeProperties(nextProperties);
    },
    [],
  );

  return { properties, setProperties, hydrated };
}
