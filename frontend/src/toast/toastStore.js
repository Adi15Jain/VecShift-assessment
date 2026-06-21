// toast/toastStore.js
// A tiny global toast/notification system. Any module can fire a toast without
// prop-drilling: `toast.success(...)`, `toast.error(...)`, `toast.info(...)`.

import { create } from "zustand";

let counter = 0;

export const useToastStore = create((set, get) => ({
    toasts: [],
    push: ({ type = "info", title, message, duration = 4500 }) => {
        const id = ++counter;
        set({ toasts: [...get().toasts, { id, type, title, message }] });
        if (duration > 0) {
            setTimeout(() => get().dismiss(id), duration);
        }
        return id;
    },
    dismiss: (id) =>
        set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}));

const fire = (type) => (title, message, opts = {}) =>
    useToastStore.getState().push({ type, title, message, ...opts });

export const toast = {
    success: fire("success"),
    error: fire("error"),
    info: fire("info"),
    warning: fire("warning"),
};
