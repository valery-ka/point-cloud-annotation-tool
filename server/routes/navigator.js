const express = require("express");
const fsp = require("fs").promises;
const path = require("path");

const { asyncHandler } = require("../middleware/asyncHandler");
const { getFolderStructure, handleFileRequest } = require("../services/navigator");
const settings = require("../config/settings");

const router = express.Router();
const DATA_DIR = settings.dataPath;

router.get(
    "/",
    asyncHandler(async (req, res) => {
        const entries = await fsp.readdir(DATA_DIR, { withFileTypes: true });
        const folders = entries.filter((entry) => entry.isDirectory());
        const results = await Promise.all(
            folders.map((dir) => getFolderStructure(path.join(DATA_DIR, dir.name))),
        );

        res.json(results);
    }),
);

router.get(
    "/:folder/:subdir/*",
    asyncHandler(async (req, res) => {
        const { folder, subdir } = req.params;
        const remainingPath = req.params[0];
        const filePath = path.join(DATA_DIR, folder, subdir, remainingPath);

        try {
            await fsp.access(filePath);
        } catch (error) {
            throw error;
        }

        await handleFileRequest(filePath, req.headers["accept"], res);
    }),
);

module.exports = router;
