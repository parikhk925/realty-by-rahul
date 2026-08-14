"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  collections as seedCollections,
  isPropertyCollection,
  PropertyCollection,
} from "@/lib/property-data";

const collectionStorageKey = "realty-by-rahul:collections:v2";
/** Pre-v2 there was a single collection under this key; carry it forward. */
const legacyStorageKey = "realty-by-rahul:collection:v1";

export interface StoredCollection extends PropertyCollection {
  ownerName?: string | null;
  createdBy?: string | null;
  updatedAt?: string;
}

/**
 * Minted once per collection and then kept. The slug is the published file
 * name, so without it two curators naming a shortlist the same thing would
 * publish to the same path and replace each other's buyer link.
 */
export function createPublicId() {
  return Math.random().toString(36).slice(2, 8);
}

export function collectionSlug(name: string, publicId: string) {
  const base =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 72) || "dubai-collection";
  return publicId ? `${base}-${publicId}` : base;
}

function withIdentity(collection: PropertyCollection): StoredCollection {
  const publicId = collection.publicId ?? createPublicId();
  return {
    ...collection,
    publicId,
    slug: collection.slug || collectionSlug(collection.name, publicId),
  };
}

function readLocal(): StoredCollection[] {
  try {
    const stored = window.localStorage.getItem(collectionStorageKey);
    if (stored) {
      const parsed = JSON.parse(stored) as unknown;
      if (Array.isArray(parsed) && parsed.every(isPropertyCollection)) {
        return parsed.map(withIdentity);
      }
    }
    const legacy = window.localStorage.getItem(legacyStorageKey);
    if (legacy) {
      const parsed = JSON.parse(legacy) as unknown;
      if (isPropertyCollection(parsed)) return [withIdentity(parsed)];
    }
    return seedCollections.map(withIdentity);
  } catch {
    return seedCollections.map(withIdentity);
  }
}

function writeLocal(collections: StoredCollection[]) {
  try {
    window.localStorage.setItem(collectionStorageKey, JSON.stringify(collections));
  } catch {
    // A full quota only costs the offline cache, not the session.
  }
}

export function useCollectionStore() {
  const [collections, setCollectionsState] = useState<StoredCollection[]>([]);
  const collectionsRef = useRef<StoredCollection[]>([]);
  const [hydrated, setHydrated] = useState(false);

  const apply = useCallback((next: StoredCollection[]) => {
    collectionsRef.current = next;
    setCollectionsState(next);
    writeLocal(next);
  }, []);

  useEffect(() => {
    const local = readLocal();
    collectionsRef.current = local;
    setCollectionsState(local);
    setHydrated(true);

    // The cached copy paints immediately; the shared set then replaces it so
    // the whole team sees the same shortlists on any device.
    let cancelled = false;
    void fetch("/api/collections/list")
      .then((response) => (response.ok ? response.json() : undefined))
      .then((payload: { collections?: StoredCollection[] } | undefined) => {
        if (cancelled || !payload?.collections) return;
        if (payload.collections.length === 0) return;
        const remote = payload.collections.map(withIdentity);
        collectionsRef.current = remote;
        setCollectionsState(remote);
        writeLocal(remote);
      })
      .catch(() => {
        // Offline is expected; the cached shortlists stay usable.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const saveCollection = useCallback(
    (next: StoredCollection) => {
      const ready = withIdentity(next);
      const existing = collectionsRef.current;
      const index = existing.findIndex(
        (item) => item.publicId === ready.publicId,
      );
      apply(
        index >= 0
          ? existing.map((item, i) => (i === index ? ready : item))
          : [ready, ...existing],
      );

      void fetch("/api/collections/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: ready.id?.startsWith("local-") ? "" : ready.id,
          publicId: ready.publicId,
          slug: ready.slug,
          name: ready.name,
          description: ready.description,
          status: ready.status,
          propertyIds: ready.propertyIds,
        }),
      })
        .then(async (response) => {
          if (!response.ok) return;
          const result = (await response.json()) as { id?: string };
          if (!result.id) return;
          // Adopt the server id so later edits update rather than re-insert.
          apply(
            collectionsRef.current.map((item) =>
              item.publicId === ready.publicId ? { ...item, id: result.id! } : item,
            ),
          );
        })
        .catch(() => {
          // Saved locally; the next successful load reconciles.
        });
      return ready;
    },
    [apply],
  );

  const createCollection = useCallback(() => {
    const publicId = createPublicId();
    return {
      id: `local-${publicId}`,
      publicId,
      slug: collectionSlug("Curated Dubai collection", publicId),
      name: "",
      description: "",
      propertyIds: [],
      status: "Draft" as const,
    };
  }, []);

  const removeCollection = useCallback(
    (publicId: string) => {
      const target = collectionsRef.current.find(
        (item) => item.publicId === publicId,
      );
      apply(collectionsRef.current.filter((item) => item.publicId !== publicId));
      if (!target || target.id.startsWith("local-")) return;
      void fetch("/api/collections/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: target.id }),
      }).catch(() => {
        // Removed locally; a reload will restore it if the server refused.
      });
    },
    [apply],
  );

  return {
    collections,
    saveCollection,
    createCollection,
    removeCollection,
    hydrated,
  };
}
