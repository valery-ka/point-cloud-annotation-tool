import React, { useCallback } from "react";

import { useSettings } from "contexts";

export const RadioButtonGroup = ({ title, settingType, options, alias, name }) => {
    const { settings, updateSettings } = useSettings();
    const selectedOption = settings[settingType][name];

    const handleRadioButtonChange = useCallback(
        (key, value) => {
            updateSettings({
                [settingType]: {
                    ...settings[settingType],
                    [key]: value,
                },
            });
        },
        [settings[settingType]],
    );

    return (
        <div className="radio-group">
            <h4>{title}</h4>
            <div className="radio-options">
                <div
                    className="slider"
                    style={{ left: `${options.indexOf(selectedOption) * 50}%` }}
                />

                {options.map((option, index) => (
                    <label key={index} className="radio-button">
                        <input
                            type="radio"
                            name={name}
                            value={option}
                            checked={selectedOption === option}
                            onChange={() => handleRadioButtonChange(name, option)}
                        />
                        <span>{alias[index]}</span>
                    </label>
                ))}
            </div>
        </div>
    );
};
