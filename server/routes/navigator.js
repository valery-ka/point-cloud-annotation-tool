const express = require("express");
const fs = require("fs").promises;
const path = require("path");
const settings = require("../config/settings");

const router = express.Router();
const DATA_DIR = settings.dataPath;

const SUBDIRECTORIES = [
    { name: "pointclouds", extensions: [".pcd"] },
    { name: "images", extensions: [".jpg", ".jpeg", ".png"] },
];

const readFilesIfExists = async (dirPath, validExtensions = []) => {
    try {
        const files = await fs.readdir(dirPath);
        return files.filter((f) => validExtensions.some((ext) => f.endsWith(ext)));
    } catch {
        return [];
    }
};

router.get("/", async (req, res) => {
    try {
        const entries = await fs.readdir(DATA_DIR, { withFileTypes: true });

        const folders = await Promise.all(
            entries
                .filter((entry) => entry.isDirectory())
                .map(async (dir) => {
                    const folderPath = path.join(DATA_DIR, dir.name);

                    const data = await Promise.all(
                        SUBDIRECTORIES.map(async ({ name, extensions }) => {
                            const fullPath = path.join(folderPath, name);
                            const files = await readFilesIfExists(fullPath, extensions);
                            return [name, files];
                        }),
                    );

                    const folderData = Object.fromEntries(data);

                    return {
                        name: dir.name,
                        ...folderData,
                    };
                }),
        );

        res.json(folders);
    } catch (err) {
        console.error("Error reading data directory:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

router.get("/:folder/:subdir/:file", async (req, res) => {
    const { folder, subdir, file } = req.params;

    const allowedSubdir = SUBDIRECTORIES.find((s) => s.name === subdir);
    if (!allowedSubdir) {
        return res.status(400).json({ error: `Unsupported subdirectory: ${subdir}` });
    }

    const filePath = path.join(DATA_DIR, folder, subdir, file);

    try {
        await fs.access(filePath);
        res.sendFile(filePath);
    } catch {
        res.status(404).json({ error: "File not found" });
    }
});

module.exports = router;
