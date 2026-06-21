// theme/themeStore.js
// Light/dark theme state. The chosen theme is written to a `data-theme`
// attribute on <html>; index.css swaps every design token based on it. Choice
// is persisted to localStorage and falls back to the OS preference.

import { create } from "zustand";

const KEY = "vs_theme";

const readInitial = () => {
    try {
        const saved = localStorage.getItem(KEY);
        if (saved === "light" || saved === "dark") return saved;
    } catch {
        /* localStorage may be unavailable (private mode) */
    }
    try {
        if (
            window.matchMedia &&
            window.matchMedia("(prefers-color-scheme: dark)").matches
        ) {
            return "dark";
        }
    } catch {
        /* matchMedia may be unavailable */
    }
    return "light";
};

const apply = (theme) => {
    try {
        document.documentElement.setAttribute("data-theme", theme);
    } catch {
        /* no document (SSR/tests) */
    }
};

// Apply the initial theme synchronously at import so there's no flash.
const initial = readInitial();
apply(initial);

export const useThemeStore = create((set, get) => ({
    theme: initial,
    toggle: () => {
        const next = get().theme === "dark" ? "light" : "dark";
        apply(next);
        try {
            localStorage.setItem(KEY, next);
        } catch {
            /* ignore */
        }
        set({ theme: next });
    },
}));
