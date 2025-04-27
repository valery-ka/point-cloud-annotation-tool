import { useEffect } from "react";

export const useServerLogs = () => {
    useEffect(() => {
        const ws = new WebSocket("ws://localhost:3001");

        ws.onopen = () => console.log("[WS] connected to server log stream");

        ws.onmessage = (event) => {
            const log = event.data;
            console.log(`%c${log}`, "color: #0bf; font-weight: bold");
        };

        ws.onerror = (error) => {
            console.error("[WS] Error:", error);
        };

        ws.onclose = () => console.log("[WS] disconnected from server");

        return () => ws.close();
    }, []);
};
