import React from "react";
import { useTranslation } from "react-i18next";

import { useLoading } from "contexts";
import { useMousetrapPause } from "hooks";

export const LoadingOverlay = () => {
    const { loadingProgress, globalIsLoading } = useLoading();

    const { t, i18n } = useTranslation();

    const mainLanguage = i18n.language;
    const alternateLanguage = mainLanguage === "en" ? "ru" : "en";

    const message = loadingProgress.message;
    const progress = loadingProgress.progress * 100;

    const mainLanguageText = t(message, { lng: mainLanguage });
    const alternateLanguageText = t(message, { lng: alternateLanguage });

    useMousetrapPause(globalIsLoading);

    return (
        globalIsLoading && (
            <div className="loading-overlay">
                <h3 className="glitch" data-text={t(alternateLanguageText)}>
                    {t(mainLanguageText)}
                    <span className="loading-dots">
                        <span>.</span>
                        <span>.</span>
                        <span>.</span>
                    </span>
                </h3>
                <div className="loading-overlay__progress-bar">
                    <div
                        className="loading-overlay__progress-bar-fill"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
                <p>{`${progress.toFixed(0)}%`}</p>
            </div>
        )
    );
};
