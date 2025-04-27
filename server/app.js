const express = require("express");
const cors = require("cors");
const path = require("path");
const http = require("http");

const { setupWebSocket, logToClients } = require("./middleware/wsLogger");
const errorHandler = require("./middleware/errorHandler");
const trafficLogger = require("./middleware/trafficLogger");

const navigatorRoutes = require("./routes/navigator");
const configRoutes = require("./routes/config");
const solutionRoutes = require("./routes/solution");

const app = express();
const server = http.createServer(app);
const PORT = process.env.SERVER_PORT || 3001;

setupWebSocket(server);

app.use(cors());
app.use(express.raw({ type: "application/octet-stream", limit: "50mb" }));
app.use(express.json({ type: "application/json", limit: "50mb" }));

app.use(trafficLogger);

app.use("/api/navigator", navigatorRoutes);
app.use("/api/config", configRoutes);
app.use("/api/solution", solutionRoutes);

if (process.env.NODE_ENV === "production") {
    const buildPath = path.join(__dirname, "../build");

    app.use(express.static(buildPath));

    app.get("*", (req, res) => {
        res.sendFile(path.join(buildPath, "index.html"));
    });
}

app.use(errorHandler);

server.listen(PORT, () => {
    logToClients(`Server is running on http://localhost:${PORT}/`);
});
