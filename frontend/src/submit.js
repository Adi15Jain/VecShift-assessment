// submit.js
// Pipeline run logic, exposed as a hook so the TopBar's Run button (or anything
// else) can trigger it. Sends {nodes, edges} to the backend, fires a toast with
// the quick result, and surfaces the full breakdown via a modal.

import { useState, useCallback } from "react";
import { useStore } from "./store";
import { toast } from "./toast/toastStore";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

export const useRunPipeline = () => {
    const [result, setResult] = useState(null);
    const [running, setRunning] = useState(false);

    const run = useCallback(async () => {
        const { nodes, edges } = useStore.getState();

        if (nodes.length === 0) {
            toast.info(
                "Nothing to run",
                "Drag a few nodes onto the canvas first.",
            );
            return;
        }

        // "Shut off" nodes (data.disabled) are excluded from execution, along
        // with any edges touching them — so the analysis reflects what actually
        // runs.
        const activeNodes = nodes.filter((n) => !n.data?.disabled);
        const activeIds = new Set(activeNodes.map((n) => n.id));
        const activeEdges = edges.filter(
            (e) => activeIds.has(e.source) && activeIds.has(e.target),
        );

        if (activeNodes.length === 0) {
            toast.info(
                "All nodes are off",
                "Turn a node back on to run the pipeline.",
            );
            return;
        }

        setRunning(true);
        try {
            const response = await fetch(`${API_URL}/pipelines/parse`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nodes: activeNodes, edges: activeEdges }),
            });
            if (!response.ok) throw new Error(`Server ${response.status}`);

            const data = await response.json();
            setResult(data);

            if (data.is_dag) {
                toast.success(
                    "Pipeline is valid",
                    `${data.num_nodes} nodes · ${data.num_edges} edges · valid DAG`,
                );
            } else {
                toast.warning(
                    "Cycle detected",
                    `${data.num_nodes} nodes · ${data.num_edges} edges · not a DAG`,
                );
            }
        } catch (err) {
            toast.error(
                "Backend unreachable",
                `Start it with: uvicorn main:app --reload (${API_URL}).`,
                { duration: 7000 },
            );
        } finally {
            setRunning(false);
        }
    }, []);

    const clearResult = useCallback(() => setResult(null), []);

    return { run, running, result, clearResult };
};
