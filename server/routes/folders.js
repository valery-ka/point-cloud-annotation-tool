const express = require("express");
const fs = require("fs");
const path = require("path");
const settings = require("../config/settings");

const router = express.Router();
const DATA_DIR = settings.cloudsPath;

router.get("/", (req, res) => {
    fs.readdir(DATA_DIR, { withFileTypes: true }, (err, files) => {
        if (err) return res.status(500).json({ error: "Error reading directory" });

        const folders = files
            .filter((file) => file.isDirectory())
            .map((dir) => ({
                name: dir.name,
                files: fs
                    .readdirSync(path.join(DATA_DIR, dir.name))
                    .filter((f) => f.endsWith(".pcd")),
            }));

        res.json(folders);
    });
});

module.exports = router;
