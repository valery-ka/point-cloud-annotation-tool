import { useEffect } from "react";

export const useStartStopPlayback = ({ playSpeed, isPlaying, startPlayback, stopPlayback }) => {
    useEffect(() => {
        if (isPlaying) {
            startPlayback();
        } else {
            stopPlayback();
        }
    }, [playSpeed, isPlaying, startPlayback, stopPlayback]);
};
