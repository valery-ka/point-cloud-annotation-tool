const express = require("express");
const fs = require("fs");
const path = require("path");
const settings = require("../config/settings");

const router = express.Router();
const DATA_DIR = settings.dataPath;

router.get("/", (req, res) => {
    fs.readdir(DATA_DIR, { withFileTypes: true }, (err, files) => {
        if (err) return res.status(500).json({ error: "Error reading directory" });

        const folders = files
            .filter((file) => file.isDirectory())
            .map((dir) => ({
                name: dir.name,
                files: fs
                    .readdirSync(path.join(DATA_DIR, dir.name, "pointclouds"))
                    .filter((f) => f.endsWith(".pcd")),
            }));

        res.json(folders);
    });
});

router.get("/:folder/:file", (req, res) => {
    const filePath = path.join(DATA_DIR, req.params.folder, "pointclouds", req.params.file);
    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: "File not found" });
    }
    res.sendFile(filePath);
});

module.exports = router;
