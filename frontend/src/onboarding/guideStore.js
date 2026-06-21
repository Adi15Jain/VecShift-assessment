// onboarding/guideStore.js
// Cross-component state for the onboarding experience: the first-load welcome
// carousel and the interactive spotlight tour. Kept global so the TopBar's help
// button can launch either from anywhere.

import { create } from "zustand";

const SEEN_KEY = "vs_onboarding_seen_v1";

export const hasOnboarded = () => {
    try {
        return localStorage.getItem(SEEN_KEY) === "1";
    } catch {
        return false;
    }
};

const markSeen = () => {
    try {
        localStorage.setItem(SEEN_KEY, "1");
    } catch {
        /* ignore (private mode) */
    }
};

export const useGuideStore = create((set) => ({
    // "welcome" carousel | "tour" spotlight | null
    mode: hasOnboarded() ? null : "welcome",
    tourStep: 0,

    openWelcome: () => set({ mode: "welcome", tourStep: 0 }),
    startTour: () => set({ mode: "tour", tourStep: 0 }),
    nextStep: () => set((s) => ({ tourStep: s.tourStep + 1 })),
    prevStep: () => set((s) => ({ tourStep: Math.max(0, s.tourStep - 1) })),
    finish: () => {
        markSeen();
        set({ mode: null, tourStep: 0 });
    },
}));
