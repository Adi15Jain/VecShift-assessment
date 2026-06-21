// nodes/nodeFields.js
// Reusable, consistently-styled form controls used inside nodes.
// Adding a new field type here makes it instantly available to every node.

export const TextField = ({ label, value, onChange, placeholder }) => (
    <label className="vs-field">
        {label && <span className="vs-field__label">{label}</span>}
        <input
            className="vs-input"
            type="text"
            value={value}
            placeholder={placeholder}
            onChange={(e) => onChange(e.target.value)}
        />
    </label>
);

export const TextAreaField = ({ label, value, onChange, placeholder, ref }) => (
    <label className="vs-field">
        {label && <span className="vs-field__label">{label}</span>}
        <textarea
            ref={ref}
            className="vs-input vs-textarea"
            value={value}
            placeholder={placeholder}
            rows={1}
            onChange={(e) => onChange(e.target.value)}
        />
    </label>
);

export const SelectField = ({ label, value, onChange, options }) => (
    <label className="vs-field">
        {label && <span className="vs-field__label">{label}</span>}
        <select
            className="vs-input vs-select"
            value={value}
            onChange={(e) => onChange(e.target.value)}
        >
            {options.map((opt) => {
                const o = typeof opt === "string" ? { value: opt, label: opt } : opt;
                return (
                    <option key={o.value} value={o.value}>
                        {o.label}
                    </option>
                );
            })}
        </select>
    </label>
);

// Maps a field's declared `type` to its component.
export const FIELD_COMPONENTS = {
    text: TextField,
    textarea: TextAreaField,
    select: SelectField,
};
