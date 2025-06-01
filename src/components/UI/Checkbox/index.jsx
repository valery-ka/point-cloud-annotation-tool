import { useState } from "react";

export const Checkbox = ({ label, checked: initialChecked = true, onChange, disabled = false }) => {
    const [checked, setChecked] = useState(initialChecked);

    const handleChange = (event) => {
        const newChecked = event.target.checked;
        setChecked(newChecked);
        onChange?.(newChecked);
    };

    return (
        <label className="ui-checkbox-label">
            <input
                type="checkbox"
                className="ui-checkbox-input"
                checked={checked}
                onChange={handleChange}
                disabled={disabled}
            />

            <span className="ui-checkbox-custom" />
            <div className="ui-checkbox-text">{label}</div>
        </label>
    );
};
