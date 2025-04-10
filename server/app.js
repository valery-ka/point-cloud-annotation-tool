const express = require("express");
const cors = require("cors");
const path = require("path");
const settings = require("./config/settings");

const app = express();
const PORT = process.env.SERVER_PORT || 3001;

app.use(cors());

app.use(express.raw({ type: "application/octet-stream", limit: "50mb" }));
app.use(express.json({ type: "application/json", limit: "50mb" }));

app.use("/api/folders", require("./routes/folders"));
app.use("/api/files", require("./routes/files"));
app.use("/api/config", require("./routes/config"));
app.use("/api/output", require("./routes/output"));

if (process.env.NODE_ENV === "production") {
    const buildPath = path.join(__dirname, "../build");
    app.use(express.static(buildPath));

    app.get("*", (req, res) => {
        res.sendFile(path.join(buildPath, "index.html"));
    });
}

app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
