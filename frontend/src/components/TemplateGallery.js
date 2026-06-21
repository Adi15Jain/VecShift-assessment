// components/TemplateGallery.js
// The "Create Pipeline" screen: a searchable, categorised gallery of prebuilt
// workflow templates (plus a start-from-scratch card), mirroring VectorShift's
// pipeline-creation UI. Selecting a card loads that pipeline onto the canvas.

import { useMemo, useState } from "react";
import { useStore } from "../store";
import { TEMPLATES, TEMPLATE_CATEGORIES } from "../templates";
import { getNodeIcon, UI } from "../icons";
import { toast } from "../toast/toastStore";

export const TemplateGallery = () => {
    const startBlank = useStore((s) => s.startBlank);
    const loadPipeline = useStore((s) => s.loadPipeline);
    const [query, setQuery] = useState("");
    const [category, setCategory] = useState(null);

    const q = query.trim().toLowerCase();

    const templates = useMemo(() => {
        return TEMPLATES.filter((t) => {
            const matchesText =
                !q ||
                t.name.toLowerCase().includes(q) ||
                t.description.toLowerCase().includes(q);
            const matchesCat =
                !category || t.categories.includes(category);
            return matchesText && matchesCat;
        });
    }, [q, category]);

    const openTemplate = (t) => {
        const { nodes, edges } = t.build();
        loadPipeline(nodes, edges, t.name);
        toast.success(
            "Template loaded",
            `${t.name} — ${nodes.length} nodes ready to customize.`,
        );
    };

    const CatButton = ({ label, IconComp }) => (
        <button
            className={`vs-cat ${category === label ? "vs-cat--on" : ""}`}
            onClick={() =>
                setCategory((c) => (c === label ? null : label))
            }
        >
            {IconComp && <IconComp size={15} />}
            <span>{label}</span>
        </button>
    );

    return (
        <div className="vs-gallery">
            {/* breadcrumb / header strip */}
            <div className="vs-gallery__bar">
                <span className="vs-gallery__crumb">
                    Pipelines <UI.chevronRight size={13} /> New
                </span>
            </div>

            <div className="vs-gallery__layout">
                {/* left: search + categories */}
                <aside className="vs-gallery__side">
                    <div className="vs-gallery__search">
                        <UI.search size={15} />
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search templates…"
                        />
                    </div>

                    {category && (
                        <button
                            className="vs-cat-clear"
                            onClick={() => setCategory(null)}
                        >
                            <UI.close size={13} /> Clear filter
                        </button>
                    )}

                    <p className="vs-gallery__grouplabel">Features</p>
                    {TEMPLATE_CATEGORIES.Features.map((c) => (
                        <CatButton
                            key={c.label}
                            label={c.label}
                            IconComp={UI[c.icon]}
                        />
                    ))}

                    <p className="vs-gallery__grouplabel">Integrations</p>
                    {TEMPLATE_CATEGORIES.Integrations.map((c) => (
                        <CatButton
                            key={c.label}
                            label={c.label}
                            IconComp={getNodeIcon(c.iconKey)}
                        />
                    ))}
                </aside>

                {/* right: cards */}
                <div className="vs-gallery__main">
                    <h1 className="vs-gallery__title">Create Pipeline</h1>

                    <div className="vs-cards">
                        <button
                            className="vs-card vs-card--new"
                            onClick={startBlank}
                        >
                            <span className="vs-card__plus">
                                <UI.plus size={22} />
                            </span>
                            <span className="vs-card__newtitle">
                                Create Pipeline
                            </span>
                            <span className="vs-card__newsub">
                                Start from scratch
                            </span>
                        </button>

                        {templates.map((t) => {
                            const Icon = UI[t.cardIcon] || UI.layers;
                            return (
                                <button
                                    key={t.id}
                                    className="vs-card"
                                    onClick={() => openTemplate(t)}
                                >
                                    <span
                                        className="vs-card__accent"
                                        style={{ background: t.accent }}
                                    />
                                    <span className="vs-card__name">
                                        {t.name}
                                    </span>
                                    <span className="vs-card__desc">
                                        {t.description}
                                    </span>
                                    <span className="vs-card__tags">
                                        {t.categories
                                            .slice(0, 2)
                                            .map((c) => (
                                                <span
                                                    key={c}
                                                    className="vs-card__tag"
                                                >
                                                    {c}
                                                </span>
                                            ))}
                                    </span>
                                    <span
                                        className="vs-card__icon"
                                        style={{ color: t.accent }}
                                    >
                                        <Icon size={16} />
                                    </span>
                                </button>
                            );
                        })}

                        {templates.length === 0 && (
                            <p className="vs-gallery__empty">
                                No templates match your search.
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
