// components/ToastHost.js
// Renders the stack of active toasts in the top-right corner.

import { useToastStore } from "../toast/toastStore";
import { UI } from "../icons";

const ICONS = {
    success: UI.success,
    error: UI.warning,
    warning: UI.warning,
    info: UI.info,
};

export const ToastHost = () => {
    const toasts = useToastStore((s) => s.toasts);
    const dismiss = useToastStore((s) => s.dismiss);

    return (
        <div className="vs-toasts">
            {toasts.map((t) => {
                const Icon = ICONS[t.type] || UI.info;
                return (
                    <div key={t.id} className={`vs-toast vs-toast--${t.type}`}>
                        <span className="vs-toast__icon">
                            <Icon size={18} />
                        </span>
                        <div className="vs-toast__body">
                            {t.title && (
                                <span className="vs-toast__title">
                                    {t.title}
                                </span>
                            )}
                            {t.message && (
                                <span className="vs-toast__msg">
                                    {t.message}
                                </span>
                            )}
                        </div>
                        <button
                            className="vs-toast__close"
                            onClick={() => dismiss(t.id)}
                            aria-label="Dismiss"
                        >
                            <UI.close size={15} />
                        </button>
                    </div>
                );
            })}
        </div>
    );
};
