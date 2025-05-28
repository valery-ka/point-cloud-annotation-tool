import { useCallback } from "react";

import { useFileManager, useFrames } from "contexts";

export const useFrameSwitcher = (stopPlayback) => {
    const { pcdFiles } = useFileManager();
    const { setActiveFrameIndex } = useFrames();

    const handleGoToFirstFrame = useCallback(() => {
        stopPlayback();
        setActiveFrameIndex(0);
    }, []);

    const handleGoToPreviousFrame = useCallback(() => {
        stopPlayback();
        setActiveFrameIndex((prevIndex) => Math.max(0, prevIndex - 1));
    }, []);

    const handleGoToNextFrame = useCallback(() => {
        stopPlayback();
        setActiveFrameIndex((prevIndex) => Math.min(pcdFiles.length - 1, prevIndex + 1));
    }, [pcdFiles]);

    const handleGoToLastFrame = useCallback(() => {
        stopPlayback();
        setActiveFrameIndex(pcdFiles.length - 1);
    }, [pcdFiles]);

    return {
        handleGoToFirstFrame,
        handleGoToPreviousFrame,
        handleGoToNextFrame,
        handleGoToLastFrame,
    };
};
