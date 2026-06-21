// toast/toastStore.js
// A tiny global toast/notification system. Any module can fire a toast without
// prop-drilling: `toast.success(...)`, `toast.error(...)`, `toast.info(...)`.

import { create } from "zustand";

let counter = 0;

// Never show more than this many toasts at once — older ones drop off so the
// stack can't pile up endlessly (e.g. clicking Run repeatedly).
const MAX_TOASTS = 3;

export const useToastStore = create((set, get) => ({
    toasts: [],
    push: ({ type = "info", title, message, duration = 4500 }) => {
        const id = ++counter;
        const next = { id, type, title, message };
        set((state) => {
            // Collapse an identical existing toast (same title + message) so
            // repeated identical alerts refresh in place instead of stacking,
            // then keep only the most recent MAX_TOASTS.
            const deduped = state.toasts.filter(
                (t) => !(t.title === title && t.message === message),
            );
            return { toasts: [...deduped, next].slice(-MAX_TOASTS) };
        });
        if (duration > 0) {
            setTimeout(() => get().dismiss(id), duration);
        }
        return id;
    },
    dismiss: (id) =>
        set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));

const fire = (type) => (title, message, opts = {}) =>
    useToastStore.getState().push({ type, title, message, ...opts });

export const toast = {
    success: fire("success"),
    error: fire("error"),
    info: fire("info"),
    warning: fire("warning"),
};
