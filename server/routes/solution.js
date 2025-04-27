const express = require("express");

const { saveJsonFile, saveBinaryFile, readSolutionFile } = require("../services/solution");
const { asyncHandler } = require("../middleware/asyncHandler");

const router = express.Router();

router.get(
    "/:folder/:file",
    asyncHandler(async (req, res) => {
        const { folder, file } = req.params;
        const { data, contentType } = await readSolutionFile(folder, file);

        res.setHeader("Content-Type", contentType);
        res.send(data);
    }),
);

router.post(
    "/:folder/:file",
    asyncHandler(async (req, res) => {
        const { folder, file } = req.params;
        const isJson = req.is("application/json");
        const isBinary = req.is("application/octet-stream");

        let response;

        if (isJson) {
            response = await saveJsonFile(folder, file, req.body);
        } else if (isBinary) {
            response = await saveBinaryFile(folder, file, req.body);
        } else {
            throw { status: 415, message: "Unsupported content type" };
        }

        res.status(200).json(response);
    }),
);

module.exports = router;
