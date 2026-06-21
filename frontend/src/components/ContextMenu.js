// components/ContextMenu.js
// Renders the right-click / "⋯" menu from menuStore. Closes on outside click,
// scroll, or Escape, and clamps itself to the viewport so it never overflows.

import { useEffect, useRef, useState } from "react";
import { useMenuStore } from "../menu/menuStore";

export const ContextMenu = () => {
    const { open, x, y, items, closeMenu } = useMenuStore();
    const ref = useRef(null);
    const [pos, setPos] = useState({ x, y });

    // Clamp to viewport once the menu has measured itself.
    useEffect(() => {
        if (!open) return;
        const el = ref.current;
        if (!el) return;
        const { width, height } = el.getBoundingClientRect();
        setPos({
            x: Math.min(x, window.innerWidth - width - 8),
            y: Math.min(y, window.innerHeight - height - 8),
        });
    }, [open, x, y]);

    useEffect(() => {
        if (!open) return;
        const onDown = (e) => {
            if (ref.current && !ref.current.contains(e.target)) closeMenu();
        };
        const onKey = (e) => e.key === "Escape" && closeMenu();
        window.addEventListener("mousedown", onDown);
        window.addEventListener("keydown", onKey);
        window.addEventListener("scroll", closeMenu, true);
        return () => {
            window.removeEventListener("mousedown", onDown);
            window.removeEventListener("keydown", onKey);
            window.removeEventListener("scroll", closeMenu, true);
        };
    }, [open, closeMenu]);

    if (!open) return null;

    return (
        <div
            ref={ref}
            className="vs-ctxmenu"
            style={{ left: pos.x, top: pos.y }}
            onContextMenu={(e) => e.preventDefault()}
        >
            {items.map((item, i) =>
                item.divider ? (
                    <div key={`d${i}`} className="vs-ctxmenu__divider" />
                ) : (
                    <button
                        key={item.label}
                        className={`vs-ctxmenu__item ${
                            item.danger ? "vs-ctxmenu__item--danger" : ""
                        }`}
                        onClick={() => {
                            item.onClick?.();
                            closeMenu();
                        }}
                    >
                        {item.icon && (
                            <span className="vs-ctxmenu__icon">
                                <item.icon size={15} />
                            </span>
                        )}
                        <span className="vs-ctxmenu__label">{item.label}</span>
                        {item.shortcut && (
                            <span className="vs-ctxmenu__shortcut">
                                {item.shortcut}
                            </span>
                        )}
                    </button>
                ),
            )}
        </div>
    );
};
