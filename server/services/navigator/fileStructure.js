const fsp = require("fs").promises;
const path = require("path");

const settings = require("../../config/settings");
const DATA_DIR = settings.dataPath;

const FileTypes = {
    POINTCLOUDS: { dir: "pointclouds", ext: [".pcd"] },
    IMAGES: { dir: "images", ext: [".jpg", ".jpeg", ".png", ".webp"] },
    CALIBRATIONS: { dir: "calibrations", ext: [".json"] },
    CONFIG: { dir: "config", ext: [".json"] },
};

async function getAllNavigatorFolders(req, res) {
    const entries = await fsp.readdir(DATA_DIR, { withFileTypes: true });
    const folders = entries.filter((entry) => entry.isDirectory());
    const results = await Promise.all(
        folders.map((dir) => getFolderStructure(path.join(DATA_DIR, dir.name))),
    );
    res.json(results);
}

async function getSingleNavigatorFolder(req, res) {
    const { folder } = req.params;
    const folderPath = path.join(DATA_DIR, folder);

    await fsp.access(folderPath);

    const folderStructure = await getFolderStructure(folderPath);
    res.json(folderStructure);
}

async function readFilesByExtension(filePath, extensions = null) {
    const files = await fsp.readdir(filePath);
    return extensions
        ? files.filter((f) => extensions.some((ext) => f.toLowerCase().endsWith(ext)))
        : files;
}

async function getSubdirFolderStructure(folderPath, extensions) {
    const entries = await fsp.readdir(folderPath, { withFileTypes: true });
    const structure = {};

    await Promise.all(
        entries.map(async (entry) => {
            const entryPath = path.join(folderPath, entry.name);
            if (entry.isDirectory()) {
                structure[entry.name] = await readFilesByExtension(entryPath, extensions);
            }
        }),
    );

    return structure;
}

async function getFolderStructure(folderPath) {
    const folderName = path.basename(folderPath);
    const entries = await fsp.readdir(folderPath, { withFileTypes: true });

    const structure = {
        name: folderName,
        rootFiles: [],
    };

    const dirHandlers = {
        [FileTypes.POINTCLOUDS.dir]: async (p) =>
            await readFilesByExtension(p, FileTypes.POINTCLOUDS.ext),

        [FileTypes.IMAGES.dir]: async (p) =>
            await getSubdirFolderStructure(p, FileTypes.IMAGES.ext),

        [FileTypes.CALIBRATIONS.dir]: async (p) =>
            await readFilesByExtension(p, FileTypes.CALIBRATIONS.ext),

        [FileTypes.CONFIG.dir]: async (p) => await readFilesByExtension(p, FileTypes.CONFIG.ext),
    };

    await Promise.all(
        entries.map(async (entry) => {
            const entryPath = path.join(folderPath, entry.name);

            if (entry.isDirectory() && dirHandlers[entry.name]) {
                structure[entry.name] = await dirHandlers[entry.name](entryPath);
            } else if (entry.isFile()) {
                structure.rootFiles.push(entry.name);
            }
        }),
    );

    return structure;
}

module.exports = {
    getSingleNavigatorFolder,
    getAllNavigatorFolders,
    FileTypes,
};
