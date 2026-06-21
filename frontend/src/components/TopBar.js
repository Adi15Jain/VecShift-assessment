// components/TopBar.js
// The application bar: brand, the live workflow name, undo/redo, the primary
// actions (Run / Deploy / Export), a theme toggle, and a help menu. It's
// context-aware — the gallery shows a minimal bar; the builder shows the lot.

import { useState } from "react";
import { useStore } from "../store";
import { useThemeStore } from "../theme/themeStore";
import { useRunPipeline } from "../submit";
import { exportPipelineJSON } from "../export";
import { ResultModal } from "./ResultModal";
import { useGuideStore } from "../onboarding/guideStore";
import { toast } from "../toast/toastStore";
import { UI } from "../icons";

export const TopBar = () => {
    const { run, running, result, clearResult } = useRunPipeline();
    const [helpOpen, setHelpOpen] = useState(false);

    const view = useStore((s) => s.view);
    const openGallery = useStore((s) => s.openGallery);
    const pipelineName = useStore((s) => s.pipelineName);
    const setPipelineName = useStore((s) => s.setPipelineName);
    const undo = useStore((s) => s.undo);
    const redo = useStore((s) => s.redo);
    const canUndo = useStore((s) => s.past.length > 0);
    const canRedo = useStore((s) => s.future.length > 0);
    const setAllCollapsed = useStore((s) => s.setAllCollapsed);
    const anyExpanded = useStore((s) =>
        s.nodes.some((n) => !n.data?.collapsed),
    );
    const hasNodes = useStore((s) => s.nodes.length > 0);

    const theme = useThemeStore((s) => s.theme);
    const toggleTheme = useThemeStore((s) => s.toggle);

    const openWelcome = useGuideStore((s) => s.openWelcome);
    const startTour = useGuideStore((s) => s.startTour);

    const inBuilder = view === "builder";
    const notReady = (label) =>
        toast.info(`${label} (demo)`, "This is a UI demo of the action.");

    const ThemeToggle = (
        <button
            className="vs-iconbtn"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            data-tour="theme"
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
            {theme === "dark" ? <UI.sun size={18} /> : <UI.moon size={18} />}
        </button>
    );

    return (
        <header className="vs-topbar">
            <div className="vs-topbar__left">
                <img src="https://vectorshift.ai/VS_logo.png" width={30} />
                <div className="vs-topbar__namewrap">
                    {inBuilder ? (
                        <input
                            className="vs-topbar__name"
                            value={pipelineName}
                            onChange={(e) => setPipelineName(e.target.value)}
                            aria-label="Pipeline name"
                        />
                    ) : (
                        <span className="vs-topbar__name vs-topbar__name--static">
                            Create Pipeline
                        </span>
                    )}
                    <span className="vs-topbar__crumb">
                        VectorShift · Pipelines
                        {inBuilder ? ` · ${pipelineName}` : ""}
                    </span>
                </div>
            </div>

            <div className="vs-topbar__right">
                {inBuilder && (
                    <>
                        <div className="vs-topbar__group" data-tour="history">
                            <button
                                className="vs-iconbtn"
                                onClick={undo}
                                disabled={!canUndo}
                                aria-label="Undo"
                                title="Undo (Ctrl/Cmd+Z)"
                            >
                                <UI.undo size={17} />
                            </button>
                            <button
                                className="vs-iconbtn"
                                onClick={redo}
                                disabled={!canRedo}
                                aria-label="Redo"
                                title="Redo (Ctrl/Cmd+Shift+Z)"
                            >
                                <UI.redo size={17} />
                            </button>
                        </div>

                        {hasNodes && (
                            <button
                                className="vs-iconbtn"
                                onClick={() => setAllCollapsed(anyExpanded)}
                                title={
                                    anyExpanded
                                        ? "Compact all nodes"
                                        : "Expand all nodes"
                                }
                                aria-label="Toggle compact view"
                            >
                                {anyExpanded ? (
                                    <UI.collapse size={17} />
                                ) : (
                                    <UI.expand size={17} />
                                )}
                            </button>
                        )}

                        <button
                            className="vs-btn vs-btn--ghost"
                            onClick={openGallery}
                        >
                            <UI.arrowLeft size={16} />
                            Templates
                        </button>
                        <button
                            className="vs-btn vs-btn--ghost"
                            onClick={exportPipelineJSON}
                            data-tour="export"
                        >
                            <UI.export size={16} />
                            Export
                        </button>
                        <button
                            className="vs-btn vs-btn--secondary"
                            onClick={() => notReady("Deploy Changes")}
                        >
                            <UI.deploy size={16} />
                            Deploy
                        </button>
                        <button
                            className="vs-btn vs-btn--primary"
                            onClick={run}
                            disabled={running}
                            data-tour="run"
                        >
                            <UI.play size={16} />
                            {running ? "Running…" : "Run"}
                        </button>
                    </>
                )}

                {ThemeToggle}

                <div className="vs-help">
                    <button
                        className="vs-iconbtn"
                        onClick={() => setHelpOpen((o) => !o)}
                        onBlur={() => setTimeout(() => setHelpOpen(false), 150)}
                        aria-label="Help"
                        data-tour="help"
                    >
                        <UI.help size={18} />
                    </button>
                    {helpOpen && (
                        <div className="vs-help__menu">
                            <button
                                onClick={() => {
                                    setHelpOpen(false);
                                    openWelcome();
                                }}
                            >
                                <UI.book size={15} /> Show tutorial
                            </button>
                            <button
                                onClick={() => {
                                    setHelpOpen(false);
                                    if (!inBuilder)
                                        useStore.getState().startBlank();
                                    startTour();
                                }}
                            >
                                <UI.info size={15} /> Take the tour
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <ResultModal result={result} onClose={clearResult} />
        </header>
    );
};
