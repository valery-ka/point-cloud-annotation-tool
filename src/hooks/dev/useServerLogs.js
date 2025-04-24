import { useEffect } from "react";

export const useServerLogs = () => {
    useEffect(() => {
        const ws = new WebSocket(
            `ws://${window.location.hostname}:${process.env.REACT_APP_WS_PORT || 3001}`,
        );

        ws.onmessage = (event) => {
            const log = event.data;
            console.log(`%c${log}`, "color: #0bf; font-weight: bold");
        };

        ws.onopen = () => console.log("[WS] connected to server log stream");
        ws.onclose = () => console.log("[WS] disconnected from server");

        return () => ws.close();
    }, []);
};
