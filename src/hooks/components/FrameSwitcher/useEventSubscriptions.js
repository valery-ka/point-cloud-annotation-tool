import { useEffect } from "react";

import { useEvent, useFileManager, useFrames } from "contexts";

export const useEventSubscriptions = (
    handleGoToFirstFrame,
    handleGoToPreviousFrame,
    handlePlay,
    handleGoToNextFrame,
    handleGoToLastFrame,
    handlePlayCycle,
    handlePlaySpeed,
) => {
    const { pcdFiles } = useFileManager();
    const { arePointCloudsLoading } = useFrames();
    const { subscribe, unsubscribe } = useEvent();

    useEffect(() => {
        if (pcdFiles.length < 2 || arePointCloudsLoading) return;

        subscribe("goToFirstFrame", handleGoToFirstFrame);
        subscribe("goToPreviousFrame", handleGoToPreviousFrame);
        subscribe("play", handlePlay);
        subscribe("goToNextFrame", handleGoToNextFrame);
        subscribe("goToLastFrame", handleGoToLastFrame);
        subscribe("playCycle", handlePlayCycle);
        subscribe("playSpeed", handlePlaySpeed);

        return () => {
            unsubscribe("goToFirstFrame", handleGoToFirstFrame);
            unsubscribe("goToPreviousFrame", handleGoToPreviousFrame);
            unsubscribe("play", handlePlay);
            unsubscribe("goToNextFrame", handleGoToNextFrame);
            unsubscribe("goToLastFrame", handleGoToLastFrame);
            unsubscribe("playCycle", handlePlayCycle);
            unsubscribe("playSpeed", handlePlaySpeed);
        };
    }, [subscribe, unsubscribe, pcdFiles.length, arePointCloudsLoading]);
};
