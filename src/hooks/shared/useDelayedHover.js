import { useRef, useCallback } from "react";

export const useDelayedHover = ({ setState, delay }) => {
    const timeoutRef = useRef(null);

    const handleMouseEnter = useCallback(
        (value) => {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = setTimeout(() => {
                setState(value);
            }, delay);
        },
        [setState],
    );

    const handleMouseLeave = useCallback(() => {
        clearTimeout(timeoutRef.current);
        setState(null);
    }, [setState]);

    return { handleMouseEnter, handleMouseLeave };
};
