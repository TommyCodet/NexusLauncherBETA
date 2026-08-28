/**
 * Local cache layer. In the Electron main process, instance/user data lives in
 * JSON under userData. This module is a renderer-side cache helper (and a hook
 * point for better-sqlite3 if you expose a native binding later).
 */
const KEY = "nexus-cache";

export function cacheGet<T>(k: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(`${KEY}:${k}`);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function cacheSet(k: string, v: unknown) {
  localStorage.setItem(`${KEY}:${k}`, JSON.stringify(v));
}
