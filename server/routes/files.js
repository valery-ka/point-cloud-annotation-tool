const express = require("express");
const fs = require("fs");
const path = require("path");
const settings = require("../config/settings");

const router = express.Router();
const DATA_DIR = settings.cloudsPath;

router.get("/:folder/:file", (req, res) => {
    const filePath = path.join(DATA_DIR, req.params.folder, req.params.file);
    if (!fs.existsSync(filePath)) {
        // return res.status(404).json({ error: "File not found" });
    }
    res.sendFile(filePath);
});

module.exports = router;
