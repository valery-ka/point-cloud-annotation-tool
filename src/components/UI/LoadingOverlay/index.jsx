import React from "react";
import { useTranslation } from "react-i18next";

import { useFileManager, useFrames } from "contexts";
import { useMousetrapPause } from "hooks";

export const LoadingOverlay = () => {
    const { pcdFiles } = useFileManager();
    const { loadingProgress, arePointCloudsLoading } = useFrames();

    const { t, i18n } = useTranslation();

    const mainLanguage = i18n.language;
    const alternateLanguage = mainLanguage === "en" ? "ru" : "en";

    const loadingMessages = [
        { state: arePointCloudsLoading, message: "loadingFrames" },
        // можно добавлять новые состояния и сообщения
    ];

    const activeState = loadingMessages.find((key) => key.state);

    const message = activeState ? activeState.message : "loading";

    const mainLanguageText = t(message, { lng: mainLanguage });
    const alternateLanguageText = t(message, { lng: alternateLanguage });

    const PROGRESS_STATE = Math.round(loadingProgress * 100);

    const isFileLoading = pcdFiles.length > 0;
    const isLoading = loadingMessages.some((key) => key.state === true);
    useMousetrapPause(isLoading);

    return (
        isLoading && (
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
        )
    );
};
