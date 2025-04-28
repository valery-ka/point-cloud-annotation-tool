const fsp = require("fs").promises;
const path = require("path");

const FileTypes = {
    POINTCLOUDS: { dir: "pointclouds", ext: [".pcd"] },
    IMAGES: { dir: "images", ext: [".jpg", ".jpeg", ".png", ".webp"] },
    CALIBRATIONS: { dir: "calibrations", ext: [".json"] },
    CONFIG: { dir: "config", ext: [".json"] },
};

async function getFoldersStructure(req, res) {
    const settings = require("../config/settings");
    const DATA_DIR = settings.dataPath;

    try {
        const entries = await fsp.readdir(DATA_DIR, { withFileTypes: true });
        const folders = entries.filter((entry) => entry.isDirectory());
        const results = await Promise.all(
            folders.map((dir) => getFolderStructure(path.join(DATA_DIR, dir.name))),
        );
        res.json(results);
    } catch (error) {
        console.error("Error getting folder structure:", error);
        res.status(500).json({ error: "Failed to get folder structure" });
    }
}

async function getFolderStructure(folderPath) {
    const folderName = path.basename(folderPath);
    const entries = await fsp.readdir(folderPath, { withFileTypes: true });

    const structure = {
        name: folderName,
        pointclouds: [],
        images: {},
        calibrations: [],
        config: [],
        solution: [],
    };

    await Promise.all(
        entries.map(async (entry) => {
            const entryPath = path.join(folderPath, entry.name);

            if (entry.isDirectory()) {
                switch (entry.name) {
                    case FileTypes.POINTCLOUDS.dir:
                        structure.pointclouds = await readFilteredFiles(
                            entryPath,
                            FileTypes.POINTCLOUDS.ext,
                        );
                        break;
                    case FileTypes.IMAGES.dir:
                        structure.images = await getImagesStructure(entryPath);
                        break;
                    case FileTypes.CALIBRATIONS.dir:
                        structure.calibrations = await readFilteredFiles(
                            entryPath,
                            FileTypes.CALIBRATIONS.ext,
                        );
                        break;
                    case FileTypes.CONFIG.dir:
                        structure.config = await readFilteredFiles(entryPath, FileTypes.CONFIG.ext);
                        break;
                }
            } else if (entry.isFile()) {
                structure.solution.push(entry.name);
            }
        }),
    );

    return structure;
}

async function readFilteredFiles(dirPath, extensions = null) {
    try {
        const files = await fsp.readdir(dirPath);
        return extensions
            ? files.filter((f) => extensions.some((ext) => f.toLowerCase().endsWith(ext)))
            : files;
    } catch (error) {
        if (error.code === "ENOENT") return extensions ? [] : null;
        throw error;
    }
}

async function getImagesStructure(imagesPath) {
    try {
        const cameraDirs = (await fsp.readdir(imagesPath, { withFileTypes: true }))
            .filter((entry) => entry.isDirectory())
            .map((dir) => dir.name);

        const structure = {};
        await Promise.all(
            cameraDirs.map(async (camera) => {
                structure[camera] = await readFilteredFiles(
                    path.join(imagesPath, camera),
                    FileTypes.IMAGES.ext,
                );
            }),
        );
        return structure;
    } catch (error) {
        if (error.code === "ENOENT") return {};
        throw error;
    }
}

module.exports = {
    getFoldersStructure,
    getFolderStructure,
    getImagesStructure,
    readFilteredFiles,
    FileTypes,
};
