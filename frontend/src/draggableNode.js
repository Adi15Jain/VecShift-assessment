// draggableNode.js
// A single node entry in the sidebar palette. Drag it onto the canvas to add it.

export const DraggableNode = ({ type, label, subtitle, icon, accent = "#6366f1" }) => {
    const Icon = icon;

    const onDragStart = (event) => {
        event.target.style.cursor = "grabbing";
        event.dataTransfer.setData(
            "application/reactflow",
            JSON.stringify({ nodeType: type }),
        );
        event.dataTransfer.effectAllowed = "move";
    };

    return (
        <div
            className="vs-palette-item"
            onDragStart={onDragStart}
            onDragEnd={(event) => (event.target.style.cursor = "grab")}
            draggable
            title={`Drag to add ${label}`}
        >
            <span
                className="vs-palette-item__icon"
                style={{
                    background: `${accent}14`,
                    color: accent,
                    borderColor: `${accent}33`,
                }}
            >
                {Icon ? <Icon size={16} /> : null}
            </span>
            <div className="vs-palette-item__text">
                <span className="vs-palette-item__label">{label}</span>
                {subtitle && (
                    <span className="vs-palette-item__sub">{subtitle}</span>
                )}
            </div>
        </div>
    );
};
