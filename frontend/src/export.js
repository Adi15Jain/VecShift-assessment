// export.js
// Exports the current pipeline as a downloadable JSON file. The shape mirrors
// what the backend receives ({ nodes, edges }) plus the workflow name, so the
// file is a faithful, re-importable definition of the pipeline.

import { useStore } from "./store";
import { toast } from "./toast/toastStore";

const slug = (name) =>
    (name || "pipeline")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || "pipeline";

export const exportPipelineJSON = () => {
    const { nodes, edges, pipelineName } = useStore.getState();

    if (nodes.length === 0) {
        toast.info("Nothing to export", "Add some nodes to the canvas first.");
        return;
    }

    const payload = {
        name: pipelineName,
        exportedAt: new Date().toISOString(),
        nodes,
        edges,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const filename = `${slug(pipelineName)}.json`;

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    toast.success(
        "Pipeline exported",
        `${nodes.length} nodes · ${edges.length} edges → ${filename}`,
    );
};
