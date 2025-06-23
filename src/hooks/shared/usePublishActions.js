import { useCallback } from "react";

import { useEvent } from "contexts";

export const usePublishActions = (events) => {
    const { publish } = useEvent();

    const createPublishFunction = useCallback(
        (event) => {
            return () => publish(event);
        },
        [publish],
    );

    const actions = events.reduce((acc, event) => {
        const actionName = `publish${event.charAt(0).toUpperCase()}${event.slice(1)}`;
        return {
            ...acc,
            [actionName]: createPublishFunction(event),
        };
    }, {});

    return actions;
};
