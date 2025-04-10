import { useState, useCallback } from "react";

const SETTINGS_KEY = "point-cloud-annotation-tool-settings";

export const useSettingsStorage = (defaultSettings) => {
    const [settings, setSettings] = useState(() => {
        const savedSettings = localStorage.getItem(SETTINGS_KEY);
        return savedSettings ? JSON.parse(savedSettings) : defaultSettings;
    });

    const updateSettings = useCallback((newSettings) => {
        setSettings((prevSettings) => {
            const updatedSettings = { ...prevSettings, ...newSettings };
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(updatedSettings));
            return updatedSettings;
        });
    }, []);

    return { settings, updateSettings };
};
