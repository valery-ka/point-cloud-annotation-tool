import { useEffect } from "react";
import Mousetrap from "mousetrap";

export const useMousetrapPause = (pauseMousetrap) => {
    useEffect(() => {
        if (pauseMousetrap) {
            Mousetrap.pause();
        } else {
            Mousetrap.unpause();
        }
    }, [pauseMousetrap]);
};
