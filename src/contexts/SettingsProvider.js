import { createContext, useContext } from "react";
import {
    useTheme,
    useLanguage,
    useUpdateHotkeys,
    useSettingsStorage,
    useGlobalEventListeners,
    useCustomClassesSettings,
} from "hooks";
import {
    defaultHotkeys,
    defaultActiveButtons,
    defaultEditorSettings,
    defaultGeneralSettings,
} from "utils/settings";

const defaultSettings = {
    general: defaultGeneralSettings,
    hotkeys: defaultHotkeys,
    editorSettings: defaultEditorSettings,
    activeButtons: defaultActiveButtons,
};

const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
    const { settings, updateSettings } = useSettingsStorage(defaultSettings);
    const { updateHotkeys } = useUpdateHotkeys(settings, updateSettings);

    useTheme(settings);
    useLanguage(settings);
    useCustomClassesSettings(settings, updateSettings);
    useGlobalEventListeners(settings);

    return (
        <SettingsContext.Provider
            value={{
                settings,
                updateSettings,
                updateHotkeys,
            }}
        >
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => useContext(SettingsContext);
