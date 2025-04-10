import { useCallback } from "react";

import { usePCDManager, useFrames } from "@contexts";

export const useFrameSwitcher = (stopPlayback) => {
    const { pcdFiles } = usePCDManager();
    const { setActiveFrameIndex } = useFrames();

    const handleGoToFirstFrame = useCallback(() => {
        stopPlayback();
        setActiveFrameIndex(0);
    }, [setActiveFrameIndex, stopPlayback]);

    const handleGoToPreviousFrame = useCallback(() => {
        stopPlayback();
        setActiveFrameIndex((prevIndex) => Math.max(0, prevIndex - 1));
    }, [setActiveFrameIndex, stopPlayback]);

    const handleGoToNextFrame = useCallback(() => {
        stopPlayback();
        setActiveFrameIndex((prevIndex) => Math.min(pcdFiles.length - 1, prevIndex + 1));
    }, [setActiveFrameIndex, stopPlayback, pcdFiles]);

    const handleGoToLastFrame = useCallback(() => {
        stopPlayback();
        setActiveFrameIndex(pcdFiles.length - 1);
    }, [setActiveFrameIndex, stopPlayback, pcdFiles]);

    return {
        handleGoToFirstFrame,
        handleGoToPreviousFrame,
        handleGoToNextFrame,
        handleGoToLastFrame,
    };
};
