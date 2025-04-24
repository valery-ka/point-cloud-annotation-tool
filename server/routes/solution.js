const express = require("express");
const fs = require("fs");
const path = require("path");
const settings = require("../config/settings");

const router = express.Router();
const DATA_DIR = settings.dataPath;

// post labels (msgpack => lz4 compression)
// post moderation (raw .json)
router.post("/:folder/:file", (req, res) => {
    const { folder, file } = req.params;
    const solutionDir = path.join(DATA_DIR, folder);
    const filePath = path.join(solutionDir, file);

    const isJson = req.is("application/json");
    const isBinary = req.is("application/octet-stream");

    if (!isJson && !isBinary) {
        return res.status(415).json({ error: "Unsupported Content-Type" });
    }

    if ((isJson && !file.endsWith(".json")) || (isBinary && !file.endsWith(".msgpack.lz4"))) {
        return res.status(400).json({ error: "File extension does not match Content-Type" });
    }

    if (!fs.existsSync(solutionDir)) {
        fs.mkdirSync(solutionDir, { recursive: true });
    }

    try {
        if (isJson) {
            const jsonData = JSON.stringify(req.body, null, 2);
            fs.writeFile(filePath, jsonData, (err) => {
                if (err) {
                    console.error("Error saving JSON file:", err);
                    return res.status(500).json({ error: "Error saving the file" });
                }
                res.status(200).json({ message: "JSON file saved successfully" });
            });
        } else if (isBinary) {
            fs.writeFile(filePath, req.body, (err) => {
                if (err) {
                    console.error("Error saving binary file:", err);
                    return res.status(500).json({ error: "Error saving the file" });
                }
                res.status(200).json({ message: "Binary file saved successfully" });
            });
        }
    } catch (error) {
        console.error("Error handling request:", error);
        res.status(400).json({ error: "Invalid request body" });
    }
});

// get .json or .msgpack.lz4 compressed data
router.get("/:folder/:file", (req, res) => {
    const { folder, file } = req.params;
    const filePath = path.join(DATA_DIR, folder, file);

    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: "File not found" });
    }

    fs.readFile(filePath, (err, data) => {
        if (err) {
            console.error("Error reading file:", err);
            return res.status(500).json({ error: "Error reading the file" });
        }

        const ext = path.extname(file);

        if (ext === ".lz4" && file.endsWith(".msgpack.lz4")) {
            res.setHeader("Content-Type", "application/octet-stream");
            res.send(data);
        } else if (ext === ".json") {
            res.setHeader("Content-Type", "application/json");
            res.send(data);
        } else {
            return res.status(415).json({ error: "Unsupported file format" });
        }
    });
});

module.exports = router;
