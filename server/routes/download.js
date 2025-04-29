const express = require("express");
const router = express.Router();

const { asyncHandler } = require("../middleware/asyncHandler");

const { handleDownloadSolution } = require("../services/download/downloadHandler");

router.get("/:folder/:file", asyncHandler(handleDownloadSolution));

module.exports = router;
