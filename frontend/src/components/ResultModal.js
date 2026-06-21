// components/ResultModal.js
// The detailed pipeline-analysis result shown after a run (node/edge counts,
// DAG validity). Toasts give the quick signal; this gives the breakdown.

import { UI } from "../icons";

export const ResultModal = ({ result, onClose }) => {
    if (!result) return null;
    const ok = result.is_dag;

    return (
        <div className="vs-modal__overlay" onClick={onClose}>
            <div className="vs-modal" onClick={(e) => e.stopPropagation()}>
                <button className="vs-modal__x" onClick={onClose}>
                    <UI.close size={18} />
                </button>

                <div
                    className={`vs-modal__icon ${
                        ok ? "vs-modal__icon--good" : "vs-modal__icon--warn"
                    }`}
                >
                    {ok ? <UI.success size={26} /> : <UI.warning size={26} />}
                </div>

                <h2 className="vs-modal__title">Pipeline analyzed</h2>

                <div className="vs-modal__stats">
                    <div className="vs-stat">
                        <span className="vs-stat__value">
                            {result.num_nodes}
                        </span>
                        <span className="vs-stat__label">Nodes</span>
                    </div>
                    <div className="vs-stat">
                        <span className="vs-stat__value">
                            {result.num_edges}
                        </span>
                        <span className="vs-stat__label">Edges</span>
                    </div>
                    <div className="vs-stat">
                        <span
                            className={`vs-stat__value ${
                                ok ? "vs-stat__value--good" : "vs-stat__value--warn"
                            }`}
                        >
                            {ok ? "Yes" : "No"}
                        </span>
                        <span className="vs-stat__label">Valid DAG</span>
                    </div>
                </div>

                <p className="vs-modal__text">
                    {ok
                        ? "No cycles detected — this pipeline is a valid DAG and is ready to run."
                        : "This pipeline contains a cycle, so it isn't a valid DAG. Remove the loop to run it."}
                </p>

                <button className="vs-modal__close" onClick={onClose}>
                    Done
                </button>
            </div>
        </div>
    );
};
