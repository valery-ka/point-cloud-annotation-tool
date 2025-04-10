import { useState, useCallback } from "react";
import Slider from "rc-slider";

import { useEvent, useSettings } from "@contexts";

export const SettingsSlider = ({
    title,
    settingType,
    setting,
    settingKey,
    action,
    min,
    max,
    step,
    decimals,
}) => {
    const { publish } = useEvent();
    const { settings, updateSettings } = useSettings();

    const editorSettings = settings[setting];

    const [value, setValue] = useState(editorSettings[settingType][settingKey]);

    const handleChange = useCallback(
        (value) => {
            publish(action, { settingKey, value });
            updateSettings({
                editorSettings: {
                    ...editorSettings,
                    [settingType]: {
                        ...editorSettings[settingType],
                        [settingKey]: value,
                    },
                },
            });
            setValue(value);
        },
        [publish, updateSettings, editorSettings, action],
    );

    return (
        <div className="slider-container">
            <h4>{title}</h4>
            <div className="slider-wrapper">
                <Slider min={min} max={max} step={step} value={value} onChange={handleChange} />
                <span className="slider-value">{value.toFixed(decimals)}</span>
            </div>
        </div>
    );
};
