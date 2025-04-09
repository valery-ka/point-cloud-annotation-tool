import React, {
    createContext,
    useContext,
    useEffect,
    useState,
    useCallback,
} from "react";

const EventContext = createContext();

export const EventProvider = ({ children }) => {
    const [eventCallbacks, setEventCallbacks] = useState({});

    const subscribe = useCallback((event, callback) => {
        setEventCallbacks((prev) => ({
            ...prev,
            [event]: prev[event] ? [...prev[event], callback] : [callback],
        }));
    }, []);

    const unsubscribe = useCallback((event, callback) => {
        setEventCallbacks((prev) => ({
            ...prev,
            [event]: prev[event]?.filter((cb) => cb !== callback) || [],
        }));
    }, []);

    const publish = useCallback(
        (event, data) => {
            if (eventCallbacks[event]) {
                eventCallbacks[event].forEach((callback) => callback(data));
            }
        },
        [eventCallbacks]
    );

    useEffect(() => {
        return () => {
            setEventCallbacks({});
        };
    }, []);

    return (
        <EventContext.Provider value={{ subscribe, unsubscribe, publish }}>
            {children}
        </EventContext.Provider>
    );
};

export const useEvent = () => useContext(EventContext);
