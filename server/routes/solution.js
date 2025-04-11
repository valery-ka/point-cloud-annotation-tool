const express = require("express");
const fs = require("fs");
const path = require("path");
const { decode } = require("@msgpack/msgpack");
const settings = require("../config/settings");

const router = express.Router();
const DATA_DIR = settings.dataPath;

// post labels / decoding msgpack to .json
// post moderation (raw .json)
router.post("/:folder/:file", (req, res) => {
    const { folder, file } = req.params;
    const solutionDir = path.join(DATA_DIR, folder);
    const filePath = path.join(solutionDir, file);

    if (!file.endsWith(".json")) {
        return res.status(400).json({ error: "Invalid file format. Only .json is supported." });
    }

    if (!fs.existsSync(solutionDir)) {
        fs.mkdirSync(solutionDir, { recursive: true });
    }

    let dataToSave;

    try {
        if (req.is("application/octet-stream")) {
            dataToSave = decode(req.body);
        } else if (req.is("application/json")) {
            dataToSave = req.body;
        } else {
            return res.status(415).json({ error: "Unsupported Content-Type" });
        }

        fs.writeFile(filePath, JSON.stringify(dataToSave, null, 2), (err) => {
            if (err) {
                console.error("Error saving file:", err);
                return res.status(500).json({ error: "Error saving the file" });
            }

            res.status(200).json({ message: "File saved successfully" });
        });
    } catch (error) {
        console.error("Error parsing input:", error);
        res.status(400).json({ error: "Invalid request body" });
    }
});

// get any .json formatted data
router.get("/:folder/:file", (req, res) => {
    const { folder, file } = req.params;
    const filePath = path.join(DATA_DIR, folder, file);

    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: "File not found" });
    }

    fs.readFile(filePath, "utf8", (err, data) => {
        if (err) {
            console.error("Error reading file:", err);
            return res.status(500).json({ error: "Error reading the file" });
        }

        res.setHeader("Content-Type", "application/json");
        res.send(data);
    });
});

module.exports = router;
