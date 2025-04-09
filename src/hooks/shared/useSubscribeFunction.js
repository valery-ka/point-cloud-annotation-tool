import { useEffect, useRef } from "react";

import { useEvent } from "@contexts";

export const useSubscribeFunction = (
    eventName,
    callback,
    dependencies,
) => {

    const callbackRef = useRef();
    const { subscribe, unsubscribe } = useEvent();

    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    useEffect(() => {
        const handler = (data) => callbackRef.current(data);
        subscribe(eventName, handler);
        return () => {
            unsubscribe(eventName, handler);
        };
    }, [eventName, subscribe, unsubscribe, ...dependencies]);
};
