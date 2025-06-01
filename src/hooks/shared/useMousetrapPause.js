import { useEffect } from "react";
import Mousetrap from "mousetrap";

let pauseCount = 0;

const safePause = () => {
    pauseCount++;
    if (pauseCount === 1) {
        Mousetrap.pause();
    }
};

const safeUnpause = () => {
    pauseCount = Math.max(0, pauseCount - 1);
    if (pauseCount === 0) {
        Mousetrap.unpause();
    }
};

export const useMousetrapPause = (pause) => {
    useEffect(() => {
        if (pause) {
            safePause();
            return () => safeUnpause();
        }
    }, [pause]);
};
