// src/features/photos/useImagePrefetch.ts
import { useCallback } from "react";

type CacheEntry = { url: string; img: HTMLImageElement; ready: boolean; error?: unknown };
const cache = new Map<string, CacheEntry>();

export function useImagePrefetch() {
    const prefetch = useCallback(async (id: string, url?: string | null) => {
        if (!url) return;
        const hit = cache.get(id);
        if (hit?.ready) return;

        const entry: CacheEntry = hit ?? { url, img: new Image(), ready: false };
        entry.img.src = url;

        try {
            await (entry.img.decode?.() ?? Promise.resolve());
            entry.ready = true;
            cache.set(id, entry);
        } catch (e) {
            entry.error = e;
            cache.set(id, entry);
        }
    }, []);

    const getReadyUrl = useCallback((id: string) => {
        const e = cache.get(id);
        return e?.ready ? e.url : null;
    }, []);

    return { prefetch, getReadyUrl };
}
