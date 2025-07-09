import { useState, useCallback } from "react";
import Slider from "rc-slider";

import { useEvent, useSettings } from "contexts";

export const SettingsSlider = ({
    title,
    settingType,
    setting,
    settingKey,
    action,
    min,
    max,
    inf = false,
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

    const getValue = useCallback((value) => {
        const renderInf = inf && value === max;
        return renderInf ? "∞" : value.toFixed(decimals);
    }, []);

    return (
        <div className="slider-container">
            <h4>{title}</h4>
            <div className="slider-wrapper">
                <Slider min={min} max={max} step={step} value={value} onChange={handleChange} />
                <span className="slider-value">{getValue(value)}</span>
            </div>
        </div>
    );
};
