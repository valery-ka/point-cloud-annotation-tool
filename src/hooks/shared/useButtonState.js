import { useState, useEffect } from "react";

import { useEvent } from "contexts";

export const useButtonState = (buttonNames) => {
    const { subscribe, unsubscribe } = useEvent();

    const [buttonStates, setButtonStates] = useState(() => {
        const initialStates = {};
        buttonNames.forEach((name) => {
            initialStates[name] = true;
        });
        return initialStates;
    });

    useEffect(() => {
        const handlers = {};

        buttonNames.forEach((name) => {
            const enableEvent = `enable${name.charAt(0).toUpperCase() + name.slice(1)}`;
            const disableEvent = `disable${name.charAt(0).toUpperCase() + name.slice(1)}`;

            const enable = () => setButtonStates((prev) => ({ ...prev, [name]: true }));
            const disable = () => setButtonStates((prev) => ({ ...prev, [name]: false }));

            subscribe(enableEvent, enable);
            subscribe(disableEvent, disable);

            handlers[name] = { enable, disable };
        });

        return () => {
            buttonNames.forEach((name) => {
                const enableEvent = `enable${name.charAt(0).toUpperCase() + name.slice(1)}`;
                const disableEvent = `disable${name.charAt(0).toUpperCase() + name.slice(1)}`;

                unsubscribe(enableEvent, handlers[name]?.enable);
                unsubscribe(disableEvent, handlers[name]?.disable);
            });
        };
    }, [subscribe, unsubscribe]);

    return buttonStates;
};
