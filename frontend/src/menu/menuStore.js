// menu/menuStore.js
// Tiny global store for the right-click / "⋯" context menu, so it can be opened
// from anywhere (the canvas right-click handler, or a node's More button).

import { create } from "zustand";

export const useMenuStore = create((set) => ({
    open: false,
    x: 0,
    y: 0,
    items: [], // [{ label, icon, shortcut, danger, divider, onClick }]
    openMenu: ({ x, y, items }) => set({ open: true, x, y, items }),
    closeMenu: () => set({ open: false, items: [] }),
}));
