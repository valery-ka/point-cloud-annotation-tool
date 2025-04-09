import { useEffect } from "react";
import { useTranslation } from "react-i18next";

export const useLanguage = (settings) => {
    const { i18n } = useTranslation();

    useEffect(() => {
        const language = settings.general.language;
        if (language && language !== i18n.language) {
            i18n.changeLanguage(language);
        }
    }, [i18n, settings.general.language]);

    useEffect(() => {
        const language = settings.general.language;
        document.documentElement.setAttribute("lang", language);
    }, [settings.general.language]);
};
