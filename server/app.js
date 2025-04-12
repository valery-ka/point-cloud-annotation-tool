const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.SERVER_PORT || 3001;

app.use(cors());

app.use(express.raw({ type: "application/octet-stream", limit: "50mb" }));
app.use(express.json({ type: "application/json", limit: "50mb" }));

app.use("/api/navigator", require("./routes/navigator"));
app.use("/api/config", require("./routes/config"));
app.use("/api/solution", require("./routes/solution"));

if (process.env.NODE_ENV === "production") {
    const buildPath = path.join(__dirname, "../build");
    app.use(express.static(buildPath));

    app.get("*", (req, res) => {
        res.sendFile(path.join(buildPath, "index.html"));
    });
}

app.listen(PORT, () => console.log(`Server is running on http://localhost:${PORT}/`));
