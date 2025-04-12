const express = require("express");
const fs = require("fs");
const path = require("path");
const settings = require("../config/settings");

const router = express.Router();
const DATA_DIR = settings.dataPath;

const CONFIG_FILES = {
    classes: "classes.json",
    objects: "objects.json",
    moderation: "moderation.json",
};

router.get("/:folder/:type", (req, res) => {
    const { folder, type } = req.params;

    if (!CONFIG_FILES[type]) {
        return res.status(400).json({ error: "Unknown config type" });
    }

    const configPath = path.join(DATA_DIR, folder, "config", CONFIG_FILES[type]);

    if (!fs.existsSync(configPath)) {
        return res.status(404).json({ error: "Config file not found" });
    }

    fs.readFile(configPath, "utf8", (err, data) => {
        if (err) {
            console.error(`Error reading config ${type}:`, err);
            return res.status(500).json({ error: "Error reading the config file" });
        }

        res.setHeader("Content-Type", "application/json");
        res.send(data);
    });
});

module.exports = router;
