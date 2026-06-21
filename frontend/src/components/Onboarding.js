// components/Onboarding.js
// Two complementary onboarding surfaces:
//   1. A first-load "welcome" carousel that explains the product (gated by
//      localStorage so it only auto-shows once).
//   2. An interactive spotlight tour that highlights real UI elements by their
//      data-tour attribute.
// Both are launchable on demand from the TopBar help menu.

import { useEffect, useLayoutEffect, useState } from "react";
import { useGuideStore } from "../onboarding/guideStore";
import { useStore } from "../store";
import { UI } from "../icons";

// ---- Welcome carousel content -----------------------------------------
const SLIDES = [
    {
        emoji: "✦",
        title: "Welcome to VectorShift",
        body: "Build AI workflows visually — no code required. Drag blocks onto the canvas, wire them together, and ship them as an API or chatbot.",
    },
    {
        emoji: "▤",
        title: "30+ AI blocks & integrations",
        body: "LLMs (OpenAI, Anthropic, Gemini), RAG knowledge bases, and live integrations — Slack, Gmail, Notion, Google Drive, HubSpot, Salesforce and more.",
    },
    {
        emoji: "⇆",
        title: "Typed, type-checked data flow",
        body: "Every handle carries a data type and is colour-coded. VectorShift catches mismatched connections before your pipeline ever runs.",
    },
    {
        emoji: "✎",
        title: "Edit freely",
        body: "Reconnect or drag a handle off to disconnect it, delete nodes/edges, and undo or redo any change. Toggle light/dark mode anytime.",
    },
    {
        emoji: "▶",
        title: "Run, validate & deploy",
        body: "Hit Run to validate your pipeline (we check it's a valid DAG), then Deploy it as an endpoint your apps can call.",
    },
];

// ---- Spotlight tour steps ---------------------------------------------
const STEPS = [
    {
        target: "sidebar",
        title: "Your node library",
        body: "Search and drag any of the 30+ blocks — LLMs, knowledge bases and integrations — onto the canvas.",
        placement: "right",
    },
    {
        target: "canvas",
        title: "The canvas",
        body: "Drop nodes here and connect their typed handles to define how data flows through your pipeline.",
        placement: "center",
    },
    {
        target: "history",
        title: "Undo & redo",
        body: "Made a mistake? Undo and redo any change — add, delete, connect, move — with these or Ctrl/Cmd+Z.",
        placement: "bottom",
    },
    {
        target: "run",
        title: "Run your pipeline",
        body: "Sends the pipeline to the backend, validates it's a DAG, and reports the node & edge counts.",
        placement: "bottom",
    },
    {
        target: "theme",
        title: "Light or dark",
        body: "Switch between light and dark themes here — your choice is remembered.",
        placement: "bottom",
    },
    {
        target: "help",
        title: "Need a refresher?",
        body: "Replay this tour or the tutorial anytime from here. Happy building!",
        placement: "bottom",
    },
];

const PAD = 8;

const WelcomeCarousel = () => {
    const [i, setI] = useState(0);
    const startTour = useGuideStore((s) => s.startTour);
    const finish = useGuideStore((s) => s.finish);
    const startBlank = useStore((s) => s.startBlank);
    const view = useStore((s) => s.view);
    const last = i === SLIDES.length - 1;
    const slide = SLIDES[i];

    // The tour highlights builder elements, so make sure we're in the builder.
    const takeTour = () => {
        if (view !== "builder") startBlank();
        startTour();
    };

    return (
        <div className="vs-modal__overlay">
            <div className="vs-welcome" onClick={(e) => e.stopPropagation()}>
                <button className="vs-modal__x" onClick={finish}>
                    <UI.close size={18} />
                </button>

                <div className="vs-welcome__art">{slide.emoji}</div>
                <h2 className="vs-welcome__title">{slide.title}</h2>
                <p className="vs-welcome__body">{slide.body}</p>

                <div className="vs-welcome__dots">
                    {SLIDES.map((_, d) => (
                        <span
                            key={d}
                            className={`vs-dot ${d === i ? "vs-dot--on" : ""}`}
                            onClick={() => setI(d)}
                        />
                    ))}
                </div>

                <div className="vs-welcome__actions">
                    <button className="vs-btn vs-btn--ghost" onClick={finish}>
                        Skip
                    </button>
                    {last ? (
                        <div className="vs-welcome__cta">
                            <button
                                className="vs-btn vs-btn--secondary"
                                onClick={finish}
                            >
                                Start building
                            </button>
                            <button
                                className="vs-btn vs-btn--primary"
                                onClick={takeTour}
                            >
                                Take the tour <UI.arrowRight size={15} />
                            </button>
                        </div>
                    ) : (
                        <button
                            className="vs-btn vs-btn--primary"
                            onClick={() => setI((n) => n + 1)}
                        >
                            Next
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

const SpotlightTour = () => {
    const step = useGuideStore((s) => s.tourStep);
    const next = useGuideStore((s) => s.nextStep);
    const prev = useGuideStore((s) => s.prevStep);
    const finish = useGuideStore((s) => s.finish);
    const [rect, setRect] = useState(null);

    const current = STEPS[step];

    useLayoutEffect(() => {
        if (!current) {
            finish();
            return;
        }
        const measure = () => {
            const el = document.querySelector(
                `[data-tour="${current.target}"]`,
            );
            if (el) {
                const r = el.getBoundingClientRect();
                setRect({
                    top: r.top - PAD,
                    left: r.left - PAD,
                    width: r.width + PAD * 2,
                    height: r.height + PAD * 2,
                });
            } else {
                setRect(null);
            }
        };
        measure();
        window.addEventListener("resize", measure);
        return () => window.removeEventListener("resize", measure);
    }, [current, finish]);

    if (!current) return null;

    // Position the tooltip relative to the highlighted rect.
    const tipStyle = {};
    if (rect && current.placement !== "center") {
        if (current.placement === "right") {
            tipStyle.top = rect.top;
            tipStyle.left = rect.left + rect.width + 14;
        } else if (current.placement === "bottom") {
            tipStyle.top = rect.top + rect.height + 14;
            tipStyle.left = Math.max(
                16,
                rect.left + rect.width - 320,
            );
        }
    } else {
        tipStyle.top = "50%";
        tipStyle.left = "50%";
        tipStyle.transform = "translate(-50%, -50%)";
    }

    return (
        <div className="vs-tour">
            {rect ? (
                <div
                    className="vs-tour__hole"
                    style={{
                        top: rect.top,
                        left: rect.left,
                        width: rect.width,
                        height: rect.height,
                    }}
                />
            ) : (
                <div className="vs-tour__dim" />
            )}

            <div className="vs-tour__tip" style={tipStyle}>
                <div className="vs-tour__step">
                    Step {step + 1} of {STEPS.length}
                </div>
                <h3 className="vs-tour__title">{current.title}</h3>
                <p className="vs-tour__body">{current.body}</p>
                <div className="vs-tour__actions">
                    <button className="vs-link" onClick={finish}>
                        Skip tour
                    </button>
                    <div className="vs-tour__nav">
                        {step > 0 && (
                            <button
                                className="vs-btn vs-btn--ghost vs-btn--sm"
                                onClick={prev}
                            >
                                Back
                            </button>
                        )}
                        <button
                            className="vs-btn vs-btn--primary vs-btn--sm"
                            onClick={
                                step === STEPS.length - 1 ? finish : next
                            }
                        >
                            {step === STEPS.length - 1 ? "Done" : "Next"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const Onboarding = () => {
    const mode = useGuideStore((s) => s.mode);

    // Lock background scroll while an overlay is open.
    useEffect(() => {
        document.body.style.overflow = mode ? "hidden" : "";
        return () => {
            document.body.style.overflow = "";
        };
    }, [mode]);

    if (mode === "welcome") return <WelcomeCarousel />;
    if (mode === "tour") return <SpotlightTour />;
    return null;
};
