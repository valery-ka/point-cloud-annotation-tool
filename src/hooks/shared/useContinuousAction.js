import { useCallback, useRef, useEffect } from "react";

export const useContinuousAction = ({ delay = 100 }) => {
    const intervalRef = useRef(null);

    const clearIntervalRef = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, []);

    const startContinuousAction = useCallback((action) => {
        clearIntervalRef();
        action();
        intervalRef.current = setInterval(action, delay);
        document.addEventListener("mouseup", clearIntervalRef, { once: true });
    }, []);

    useEffect(() => {
        return () => clearIntervalRef();
    }, []);

    return { startContinuousAction };
};
