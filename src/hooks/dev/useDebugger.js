import { useEffect, useRef } from "react";

export const useDebugger = (values, label = "Debugger") => {
    const prev = useRef({});

    useEffect(() => {
        const changedKeys = Object.keys(values).filter((key) => {
            return JSON.stringify(prev.current[key]) !== JSON.stringify(values[key]);
        });

        if (changedKeys.length > 0) {
            console.groupCollapsed(`[${label}] Update @ ${new Date().toLocaleTimeString()}`);
            changedKeys.forEach((key) => {
                console.log(`→ ${key}:`, values[key]);
                prev.current[key] = values[key];
            });
            console.groupEnd();
        }
    }, [values]);
};
