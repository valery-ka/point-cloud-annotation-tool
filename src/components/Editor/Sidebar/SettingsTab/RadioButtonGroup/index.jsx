import React, { useCallback } from "react";

import { useEvent, useSettings } from "contexts";

export const RadioButtonGroup = ({
    title,
    action,
    setting,
    settingType,
    settingKey,
    options,
    alias,
}) => {
    const { publish } = useEvent();
    const { settings, updateSettings } = useSettings();

    const editorSettings = settings[setting];
    const selectedOption = editorSettings[settingType];

    const selectedValue = action
        ? editorSettings?.[settingType]?.[settingKey]
        : editorSettings?.[settingType];

    const handleRadioButtonChange = useCallback(
        (key, value) => {
            const update = action
                ? {
                      editorSettings: {
                          ...editorSettings,
                          [settingType]: {
                              ...editorSettings[settingType],
                              [settingKey]: value,
                          },
                      },
                  }
                : {
                      [setting]: {
                          ...settings[setting],
                          [key]: value,
                      },
                  };
            if (action) publish(action, { settingKey, value });
            updateSettings(update);
        },
        [settings[setting]],
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
                            settingType={settingType}
                            value={option}
                            checked={selectedValue === option}
                            onChange={() => handleRadioButtonChange(settingType, option)}
                        />
                        <span>{alias[index]}</span>
                    </label>
                ))}
            </div>
        </div>
    );
};
