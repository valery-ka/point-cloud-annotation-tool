const WebSocket = require("ws");

let clients = [];

function setupWebSocket(server) {
    const wss = new WebSocket.Server({ server });

    wss.on("connection", (ws) => {
        clients.push(ws);
        ws.on("close", () => {
            clients = clients.filter((client) => client !== ws);
        });
    });
}

function logToClients(message) {
    const data = `[Server] ${message}`;
    clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(data);
        }
    });
    console.log(data);
}

module.exports = {
    setupWebSocket,
    logToClients,
};
