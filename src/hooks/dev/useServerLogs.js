import { useEffect } from "react";

export const useServerLogs = () => {
    useEffect(() => {
        const socket = new WebSocket("ws://localhost:3001");

        socket.onmessage = (event) => {
            const msg = event.data;
            if (msg.includes("Error")) {
                console.log(
                    `%c${msg}`,
                    "color: rgba(255, 255, 255, 0.9); background-color:rgba(173, 29, 29, 0.5); padding: 5px; border-radius: 5px;",
                );
            } else if (msg.includes("Warn")) {
                console.log(
                    `%c${msg}`,
                    "color: rgba(255, 255, 255, 0.9); background-color: rgba(255, 255, 0, 0.5); padding: 5px; border-radius: 5px;",
                );
            } else {
                console.log(
                    `%c${msg}`,
                    "color: rgba(255, 255, 255, 0.9); background-color: rgba(0, 255, 0, 0.5); padding: 5px; border-radius: 5px;",
                );
            }
        };

        return () => socket.close();
    }, []);
};
