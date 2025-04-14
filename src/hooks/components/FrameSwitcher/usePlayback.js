import { useState, useRef, useEffect, useCallback } from "react";

import { useFileManager, useFrames } from "contexts";

export const usePlayback = (playbackConfig) => {
    const { pcdFiles } = useFileManager();
    const { isPlaying, setIsPlaying, setActiveFrameIndex } = useFrames();

    const [isPlayCycle, setIsPlayCycle] = useState(false);
    const [playSpeed, setPlaySpeed] = useState(playbackConfig.speeds.normal.value);
    const intervalRef = useRef(null);

    const stopPlayback = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        setIsPlaying(false);
    }, []);

    const startPlayback = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }
        intervalRef.current = setInterval(() => {
            setActiveFrameIndex((prevIndex) => {
                if (prevIndex < pcdFiles.length - 1) {
                    return prevIndex + 1;
                } else {
                    if (isPlayCycle) {
                        return 0;
                    } else {
                        stopPlayback();
                        return prevIndex;
                    }
                }
            });
        }, playSpeed);
    }, [playSpeed, setActiveFrameIndex, stopPlayback, isPlayCycle, pcdFiles]);

    const handlePlay = useCallback(() => {
        setIsPlaying((prevIsPlaying) => {
            if (prevIsPlaying) {
                stopPlayback();
                return false;
            } else {
                setActiveFrameIndex((prevIndex) => {
                    if (prevIndex === pcdFiles.length - 1) {
                        return 0;
                    } else {
                        return prevIndex;
                    }
                });
                setTimeout(() => setIsPlaying(true), 0);
                return true;
            }
        });
    }, [startPlayback, stopPlayback, setActiveFrameIndex, pcdFiles]);

    const handlePlayCycle = useCallback(() => {
        setIsPlayCycle((prev) => !prev);
    }, []);

    const handlePlaySpeed = useCallback(() => {
        setPlaySpeed((prevSpeed) => playbackConfig.getNextSpeed(prevSpeed));
    }, [playbackConfig]);

    useEffect(() => {
        if (isPlaying) {
            startPlayback();
        } else {
            stopPlayback();
        }
    }, [playSpeed, isPlaying, startPlayback, stopPlayback]);

    return {
        isPlaying,
        isPlayCycle,
        playSpeed,
        handlePlay,
        handlePlayCycle,
        handlePlaySpeed,
        stopPlayback,
    };
};
