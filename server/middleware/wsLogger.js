const WebSocket = require("ws");

let clients = [];

function setupWebSocket(server) {
    const wss = new WebSocket.Server({ server });

    wss.on("connection", (ws) => {
        console.log("[WS] Client connected");

        clients.push(ws);

        ws.on("close", () => {
            console.log("[WS] Client disconnected");
            clients = clients.filter((client) => client !== ws);
        });

        ws.on("error", (error) => {
            console.error("[WS] Error with WebSocket connection:", error);
        });
    });

    wss.on("listening", () => {
        console.log("[WS] WebSocket server is listening for connections...");
    });
}

function logToClients(message) {
    const data = `[Server] ${message}`;
    console.log("[WS] Sending log to clients:", data);

    clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(data, (err) => {
                if (err) {
                    console.error("[WS] Error sending message to a client:", err);
                }
            });
        } else {
            console.warn("[WS] Skipping client, connection is not open.");
        }
    });
}

module.exports = {
    setupWebSocket,
    logToClients,
};
