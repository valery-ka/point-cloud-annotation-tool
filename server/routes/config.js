const express = require("express");

const { asyncHandler } = require("../middleware/asyncHandler");
const { readConfigFile } = require("../services/config");

const router = express.Router();

router.get(
    "/:folder/:file",
    asyncHandler(async (req, res) => {
        const { folder, file } = req.params;
        const data = await readConfigFile(folder, file);

        res.setHeader("Content-Type", "application/json");
        res.send(data);
    }),
);

module.exports = router;
