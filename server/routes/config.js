const express = require("express");
const fs = require("fs");
const path = require("path");
const settings = require("../config/settings");

const router = express.Router();
const DATA_DIR = settings.dataPath;

router.get("/:folder/:file", (req, res) => {
    const { folder, file } = req.params;

    if (!file.endsWith(".json")) {
        return res.status(400).json({ error: "Only JSON files are allowed" });
    }

    const configPath = path.join(DATA_DIR, folder, "config", file);

    if (!fs.existsSync(configPath)) {
        return res.status(404).json({ error: "Config file not found" });
    }

    fs.readFile(configPath, "utf8", (err, data) => {
        if (err) {
            console.error(`Error reading config ${file}:`, err);
            return res.status(500).json({ error: "Error reading the config file" });
        }

        res.setHeader("Content-Type", "application/json");
        res.send(data);
    });
});

module.exports = router;
