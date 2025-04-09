import { useCallback, useEffect } from "react";

export const useGlobalEventListeners = () => {
    const handleContextMenu = useCallback((event) => {
        event.preventDefault();
    }, []);

    const handleKeyDown = useCallback((event) => {
        if (event.key == "Tab" || event.key == "Alt") {
            event.preventDefault();
        }
    }, []);

    const handleBlur = useCallback((event) => {
        const keysToRelease = ["Shift", "Alt", "Control", "Meta", "Tab"];

        keysToRelease.forEach((key) => {
            const keyUpEvent = new KeyboardEvent("keyup", {
                key: key,
                code: key,
                bubbles: true,
                cancelable: true,
                view: window,
            });
            document.dispatchEvent(keyUpEvent);
        });
    }, []);

    useEffect(() => {
        document.addEventListener("contextmenu", handleContextMenu);
        document.addEventListener("keydown", handleKeyDown);

        window.addEventListener("blur", handleBlur);

        return () => {
            document.removeEventListener("contextmenu", handleContextMenu);
            document.removeEventListener("keydown", handleKeyDown);

            window.removeEventListener("blur", handleBlur);
        };
    }, []);
};
