const fs = require("fs");
const path = require("path");

const settings = require("../config/settings");

const DATA_DIR = settings.dataPath;

const saveJsonFile = (folder, file, data) => {
    const solutionDir = path.join(DATA_DIR, folder);
    const filePath = path.join(solutionDir, file);

    return new Promise((resolve, reject) => {
        if (!fs.existsSync(solutionDir)) {
            fs.mkdirSync(solutionDir, { recursive: true });
        }

        const jsonData = JSON.stringify(data, null, 2);
        fs.writeFile(filePath, jsonData, (err) => {
            if (err) reject(err);
            resolve({ message: "JSON file saved successfully" });
        });
    });
};

const saveBinaryFile = (folder, file, data) => {
    const solutionDir = path.join(DATA_DIR, folder);
    const filePath = path.join(solutionDir, file);

    return new Promise((resolve, reject) => {
        if (!fs.existsSync(solutionDir)) {
            fs.mkdirSync(solutionDir, { recursive: true });
        }

        fs.writeFile(filePath, data, (err) => {
            if (err) reject(err);
            resolve({ message: "Binary file saved successfully" });
        });
    });
};

const readSolutionFile = (folder, file) => {
    const filePath = path.join(DATA_DIR, folder, file);

    return new Promise((resolve, reject) => {
        fs.readFile(filePath, (err, data) => {
            if (err) reject(err);

            const ext = path.extname(file);

            if (ext === ".lz4" && file.endsWith(".msgpack.lz4")) {
                resolve({ data, contentType: "application/octet-stream" });
            } else if (ext === ".json") {
                resolve({ data, contentType: "application/json" });
            } else {
                reject({ status: 415, message: "Unsupported file format" });
            }
        });
    });
};

module.exports = {
    saveJsonFile,
    saveBinaryFile,
    readSolutionFile,
};
