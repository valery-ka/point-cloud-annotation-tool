import React from "react";
import { useTranslation } from "react-i18next";

import { useFileManager, useFrames } from "contexts";

export const LoadingOverlay = ({ message }) => {
    const { pcdFiles } = useFileManager();
    const { loadingProgress } = useFrames();

    const { t, i18n } = useTranslation();

    const mainLanguage = i18n.language;
    const alternateLanguage = mainLanguage === "en" ? "ru" : "en";

    const mainLanguageText = t(message, { lng: mainLanguage });
    const alternateLanguageText = t(message, { lng: alternateLanguage });

    const PROGRESS_STATE = Math.round(loadingProgress * 100);

    const isFileLoading = pcdFiles.length > 0;

    return (
        <div className="loading-overlay">
            <h3 className="glitch" data-text={t(alternateLanguageText)}>
                {t(mainLanguageText)}
                <span className="loading-dots">
                    <span>.</span>
                    <span>.</span>
                    <span>.</span>
                </span>
            </h3>
            {isFileLoading && (
                <div className="loading-overlay__progress-bar">
                    <div
                        className="loading-overlay__progress-bar-fill"
                        style={{ width: `${PROGRESS_STATE}%` }}
                    ></div>
                </div>
            )}
            {isFileLoading && <p>{`${PROGRESS_STATE}%`}</p>}
        </div>
    );
};
