import { useCallback } from "react";
import "config/mousetrap";

export const useUpdateHotkeys = (settings, updateSettings) => {
    const updateHotkeys = useCallback(
        (newHotkeys) => {
            updateSettings({ hotkeys: newHotkeys });
        },
        [settings.hotkeys, updateSettings],
    );

    return { updateHotkeys };
};
