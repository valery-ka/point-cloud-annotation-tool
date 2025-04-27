const fs = require("fs").promises;
const path = require("path");
const sharp = require("sharp");

const DIRECTORY_CONFIG = Object.freeze({
    POINTCLOUDS: {
        name: "pointclouds",
        extensions: [".pcd"],
    },
    IMAGES: {
        name: "images",
        extensions: [".jpg", ".jpeg", ".png", ".webp"],
    },
});

const readFilteredFiles = async (dirPath, config) => {
    try {
        const files = await fs.readdir(dirPath);
        return files.filter((f) => config.extensions.some((ext) => f.toLowerCase().endsWith(ext)));
    } catch (error) {
        throw error;
    }
};

const handleFileRequest = async (filePath, acceptHeader, res) => {
    const ext = path.extname(filePath).toLowerCase();
    const isImage = [".jpg", ".jpeg", ".png"].includes(ext);
    const shouldConvertToWebp = isImage && acceptHeader.includes("image/webp");

    if (shouldConvertToWebp) {
        res.set("Content-Type", "image/webp");
        await sharp(filePath).webp({ quality: 80 }).pipe(res);
    } else {
        res.sendFile(filePath);
    }
};

const getFolderStructure = async (folderPath) => {
    const [pointclouds, images] = await Promise.all([
        getPointcloudsStructure(folderPath),
        getImagesStructure(folderPath),
    ]);

    return {
        name: path.basename(folderPath),
        pointclouds,
        images,
    };
};

const getPointcloudsStructure = async (folderPath) => {
    const pointcloudsPath = path.join(folderPath, DIRECTORY_CONFIG.POINTCLOUDS.name);
    return readFilteredFiles(pointcloudsPath, DIRECTORY_CONFIG.POINTCLOUDS);
};

const getImagesStructure = async (folderPath) => {
    const imagesPath = path.join(folderPath, DIRECTORY_CONFIG.IMAGES.name);

    try {
        const cameraDirs = (await fs.readdir(imagesPath, { withFileTypes: true }))
            .filter((entry) => entry.isDirectory())
            .map((dir) => dir.name);

        const imagesByCamera = {};
        await Promise.all(
            cameraDirs.map(async (camera) => {
                imagesByCamera[camera] = await readFilteredFiles(
                    path.join(imagesPath, camera),
                    DIRECTORY_CONFIG.IMAGES,
                );
            }),
        );

        return imagesByCamera;
    } catch (error) {
        throw error;
    }
};

module.exports = {
    handleFileRequest,
    getFolderStructure,
    getPointcloudsStructure,
    getImagesStructure,
};
