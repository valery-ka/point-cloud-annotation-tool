const fs = require("fs");
const path = require("path");
const settings = require("../config/settings");

const DATA_DIR = settings.dataPath;

const readConfigFile = (folder, file) => {
    return new Promise((resolve, reject) => {
        const configPath = path.join(DATA_DIR, folder, "config", file);

        fs.readFile(configPath, "utf8", (err, data) => {
            if (err) {
                return reject(err);
            }
            resolve(data);
        });
    });
};

module.exports = { readConfigFile };
