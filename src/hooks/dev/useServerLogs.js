import { useEffect } from "react";

export const useServerLogs = () => {
    useEffect(() => {
        const socket = new WebSocket("ws://localhost:3001");

        socket.onmessage = (event) => {
            const msg = event.data;
            if (msg.includes("error")) {
                console.log("%c" + msg, "color: red");
            } else if (msg.includes("warn")) {
                console.log("%c" + msg, "color: orange");
            } else {
                console.log("%c" + msg, "color: green");
            }
        };

        return () => socket.close();
    }, []);
};
