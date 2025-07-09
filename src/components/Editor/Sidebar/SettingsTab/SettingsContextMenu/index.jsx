import { memo, useCallback } from "react";

import { useEvent, useSettings } from "contexts";

export const SettingsContextMenu = memo(
    ({ title, select = [], options = [], setting, settingType, settingKey }) => {
        const { publish } = useEvent();
        const { settings, updateSettings } = useSettings();

        const editorSettings = settings[setting];
        const selectedOption = editorSettings[settingType][settingKey];

        const setSelectedOption = useCallback(
            (value) => {
                publish(settingKey, value);
                updateSettings({
                    editorSettings: {
                        ...editorSettings,
                        [settingType]: {
                            ...editorSettings[settingType],
                            [settingKey]: value,
                        },
                    },
                });
            },
            [publish, settings[setting]],
        );

        return (
            <div className="settings-context-menu-container">
                <h4>{title}</h4>
                <select
                    id="settings-select"
                    value={selectedOption}
                    onChange={(e) => setSelectedOption(e.target.value)}
                >
                    {options.map((option, index) => (
                        <option key={option} value={option}>
                            {select[index]}
                        </option>
                    ))}
                </select>
            </div>
        );
    },
);
