import { useEffect } from "react";
import { useStore } from "./store";
import { TopBar } from "./components/TopBar";
import { Sidebar } from "./components/Sidebar";
import { PipelineUI } from "./ui";
import { TemplateGallery } from "./components/TemplateGallery";
import { ToastHost } from "./components/ToastHost";
import { ContextMenu } from "./components/ContextMenu";
import { Onboarding } from "./components/Onboarding";

// True while the user is typing in a field — so canvas shortcuts don't hijack
// the browser's native behaviour inside node inputs.
const isEditingText = (el) =>
    el &&
    (el.tagName === "INPUT" ||
        el.tagName === "TEXTAREA" ||
        el.isContentEditable);

function App() {
    const view = useStore((s) => s.view);

    // Canvas keyboard shortcuts (undo/redo, select-all, duplicate).
    useEffect(() => {
        const onKeyDown = (e) => {
            const mod = e.metaKey || e.ctrlKey;
            if (!mod || isEditingText(e.target)) return;
            const key = e.key.toLowerCase();
            const s = useStore.getState();

            if (key === "z") {
                e.preventDefault();
                e.shiftKey ? s.redo() : s.undo();
            } else if (key === "y") {
                e.preventDefault();
                s.redo();
            } else if (key === "a") {
                e.preventDefault();
                s.selectAllNodes();
            } else if (key === "d") {
                e.preventDefault();
                s.nodes
                    .filter((n) => n.selected)
                    .forEach((n) => s.duplicateNode(n.id));
            }
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, []);

    return (
        <div className="vs-app">
            <TopBar />
            {view === "gallery" ? (
                <TemplateGallery />
            ) : (
                <div className="vs-body">
                    <Sidebar />
                    <main className="vs-stage" data-tour="canvas">
                        <PipelineUI />
                    </main>
                </div>
            )}
            <ToastHost />
            <ContextMenu />
            <Onboarding />
        </div>
    );
}

export default App;
