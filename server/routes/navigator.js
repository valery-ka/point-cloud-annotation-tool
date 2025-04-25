const express = require("express");
const fs = require("fs").promises;
const path = require("path");
const sharp = require("sharp");
const settings = require("../config/settings");

const router = express.Router();
const DATA_DIR = settings.dataPath;

const SUBDIRECTORIES = [
    { name: "pointclouds", extensions: [".pcd"] },
    { name: "images", extensions: [".jpg", ".jpeg", ".png", ".webp"] },
    { name: "calibrations", extensions: [".json"] },
];

const readFilesIfExists = async (dirPath, subdir) => {
    try {
        const { extensions } = SUBDIRECTORIES.find((s) => s.name === subdir) || {};
        if (!extensions) return [];

        const files = await fs.readdir(dirPath);
        return files.filter((f) => extensions.some((ext) => f.endsWith(ext)));
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

                    const pointclouds = await readFilesIfExists(
                        path.join(folderPath, "pointclouds"),
                        "pointclouds",
                    );

                    let imagesByCamera = {};
                    const imagesPath = path.join(folderPath, "images");
                    try {
                        const cameraDirs = await fs.readdir(imagesPath, { withFileTypes: true });
                        for (const camDir of cameraDirs) {
                            if (camDir.isDirectory()) {
                                const camPath = path.join(imagesPath, camDir.name);
                                const images = await readFilesIfExists(camPath, "images");
                                imagesByCamera[camDir.name] = images;
                            }
                        }
                    } catch {}

                    return {
                        name: dir.name,
                        pointclouds,
                        images: imagesByCamera,
                    };
                }),
        );

        res.json(folders);
    } catch (err) {
        console.error("Error reading data directory:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

router.get("/:folder/:subdir/*", async (req, res) => {
    const { folder, subdir } = req.params;
    const remainingPath = req.params[0];
    const acceptHeader = req.headers["accept"] || "";

    const allowedSubdir = SUBDIRECTORIES.find((s) => s.name === subdir);
    if (!allowedSubdir) {
        return res.status(400).json({ error: `Unsupported subdirectory: ${subdir}` });
    }

    const basePath = path.join(DATA_DIR, folder, subdir);
    const originalPath = path.join(basePath, remainingPath);
    const ext = path.extname(originalPath).toLowerCase();

    try {
        await fs.access(originalPath);

        if (acceptHeader.includes("image/webp") && [".jpg", ".jpeg", ".png"].includes(ext)) {
            res.set("Content-Type", "image/webp");

            sharp(originalPath)
                .webp({ quality: 80 })
                .pipe(res)
                .on("error", (err) => {
                    console.error("WebP conversion error:", err.message);
                    res.status(500).end("Image processing error");
                });
        } else {
            res.sendFile(originalPath);
        }
    } catch {
        res.status(404).json({ error: "File not found" });
    }
});

module.exports = router;
