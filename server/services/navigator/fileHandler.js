const fs = require("fs");
const fsp = fs.promises;
const path = require("path");
const sharp = require("sharp");

const settings = require("../../config/settings");
const { FileTypes } = require("./fileStructure");

const DATA_DIR = settings.dataPath;
const FALLBACK_CONFIG_DIR = path.join(__dirname, "../../config");

function validateFileExtension(filename, allowedExtensions) {
    const ext = path.extname(filename).toLowerCase();
    if (!allowedExtensions.includes(ext)) {
        throw {
            status: 400,
            message: `Invalid file type. Allowed: ${allowedExtensions.join(", ")}`,
        };
    }
}

async function handlePointcloudRequest(req, res) {
    const { folder, file } = req.params;
    const filePath = path.join(DATA_DIR, folder, FileTypes.POINTCLOUDS.dir, file);
    validateFileExtension(file, FileTypes.POINTCLOUDS.ext);
    res.sendFile(filePath);
}

async function handleImageRequest(req, res) {
    const { folder, camera, file } = req.params;
    const filePath = path.join(DATA_DIR, folder, FileTypes.IMAGES.dir, camera, file);
    validateFileExtension(file, FileTypes.IMAGES.ext);

    const ext = path.extname(file).toLowerCase();
    const shouldConvert =
        [".jpg", ".jpeg", ".png"].includes(ext) && req.headers["accept"].includes("image/webp");

    if (shouldConvert) {
        res.set("Content-Type", "image/webp");
        await sharp(filePath).webp({ quality: 80 }).pipe(res);
    } else {
        res.sendFile(filePath);
    }
}

async function handleCalibrationRequest(req, res) {
    const { folder, file } = req.params;
    const filePath = path.join(DATA_DIR, folder, FileTypes.CALIBRATIONS.dir, file);
    validateFileExtension(file, FileTypes.CALIBRATIONS.ext);
    res.set("Content-Type", "application/json");
    res.sendFile(filePath);
}

async function handleConfigRequest(req, res, next) {
    const { folder, file } = req.params;
    const filePath = path.join(DATA_DIR, folder, FileTypes.CONFIG.dir, file);

    try {
        await fsp.access(filePath);
        const data = await fsp.readFile(filePath, "utf8");
        res.set("Content-Type", "application/json");
        res.send(data);
    } catch (error) {
        if (error.code === "ENOENT") {
            const fallbackFilePath = path.join(FALLBACK_CONFIG_DIR, file);
            try {
                await fsp.access(fallbackFilePath);
                const data = await fsp.readFile(fallbackFilePath, "utf8");
                res.set("Content-Type", "application/json");
                res.send(data);
            } catch (fallbackError) {
                next(fallbackError);
            }
        } else {
            next(error);
        }
    }
}

async function handleSolutionGet(req, res) {
    const { folder, file } = req.params;
    const filePath = path.join(DATA_DIR, folder, file);

    const contentType = file.endsWith(".json") ? "application/json" : "application/octet-stream";

    res.set("Content-Type", contentType);
    res.sendFile(filePath);
}

async function handleSolutionPost(req, res) {
    const { folder, file } = req.params;
    const filePath = path.join(DATA_DIR, folder, file);

    if (!fs.existsSync(path.dirname(filePath))) {
        await fsp.mkdir(path.dirname(filePath), { recursive: true });
    }

    const isJson = req.is("application/json");
    const content = isJson ? JSON.stringify(req.body, null, 2) : req.body;

    await fsp.writeFile(filePath, content);
    res.json({ message: `File ${file} saved successfully` });
}

module.exports = {
    handlePointcloudRequest,
    handleImageRequest,
    handleCalibrationRequest,
    handleConfigRequest,
    handleSolutionGet,
    handleSolutionPost,
};
