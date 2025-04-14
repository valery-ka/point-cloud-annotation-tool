import { useEffect, useRef } from "react";

export const useTimeSinceMount = (label = "TimeSinceMount") => {
    const start = useRef(Date.now());

    useEffect(() => {
        return () => {
            const duration = ((Date.now() - start.current) / 1000).toFixed(2);
            console.log(`[${label}] unmounted within ${duration} seconds`);
        };
    }, []);
};
