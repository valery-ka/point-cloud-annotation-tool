import { useEffect } from "react";

export const useTheme = (settings) => {
    useEffect(() => {
        document.documentElement.setAttribute("theme", settings.general.theme);
    }, [settings.general.theme]);
};
