const fs = require("fs");
const path = require("path");
const archiver = require("archiver");
const { decompress } = require("lz4js");
const { decode } = require("@msgpack/msgpack");

const settings = require("../../config/settings");
const {
    parsePCDHeader,
    reducePCDHeader,
    extractFieldsAndAppendLabels,
} = require("../../utils/pcdUtils");

const DATA_DIR = settings.dataPath;

async function handleDownloadSolution(req, res) {
    const { folder, file } = req.params;
    const cloudsPath = path.join(DATA_DIR, folder, "pointclouds");
    const solutionPath = path.join(DATA_DIR, folder, file);

    if (!fs.existsSync(solutionPath)) {
        return res.status(404).json({ error: "Solution file not found" });
    }

    const compressed = fs.readFileSync(solutionPath);
    const decompressed = decompress(compressed);
    const decoded = decode(decompressed);

    res.setHeader("Content-Disposition", `attachment; filename="${folder}_labeled.zip"`);
    res.setHeader("Content-Type", "application/zip");

    const archive = archiver("zip", { zlib: { level: 9 } });
    archive.pipe(res);

    for (const entry of decoded) {
        const pcdPath = path.join(cloudsPath, entry.fileName);
        if (!fs.existsSync(pcdPath)) {
            archive.abort();
            return res.status(404).json({ error: `Missing file: ${entry.fileName}` });
        }

        const pcdBuffer = fs.readFileSync(pcdPath);
        const { header, offset, meta } = parsePCDHeader(pcdBuffer);
        const { newHeader } = reducePCDHeader(meta, header, entry.labels.length);
        const asciiBody = extractFieldsAndAppendLabels(pcdBuffer, offset, meta, entry.labels);

        const fullPCD = newHeader + asciiBody;
        const filename = entry.fileName.replace(".pcd", ".pcd"); // если вдруг решим менять на _labeled.pcd например

        archive.append(fullPCD, { name: filename });
    }

    archive.finalize();
}

module.exports = {
    handleDownloadSolution,
};
