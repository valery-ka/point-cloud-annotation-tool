const express = require("express");
const router = express.Router();

const { asyncHandler } = require("../middleware/asyncHandler");

const { getFoldersStructure } = require("../services/fileStructure");
const {
    handlePointcloudRequest,
    handleImageRequest,
    handleCalibrationRequest,
    handleConfigRequest,
    handleSolutionGet,
    handleSolutionPost,
} = require("../services/fileHandler");

router.get("/", asyncHandler(getFoldersStructure));

router.get("/:folder/calibrations/:file", asyncHandler(handleCalibrationRequest));
router.get("/:folder/config/:file", asyncHandler(handleConfigRequest));
router.get("/:folder/images/:camera/:file", asyncHandler(handleImageRequest));
router.get("/:folder/pointclouds/:file", asyncHandler(handlePointcloudRequest));

router.get("/:folder/:file", asyncHandler(handleSolutionGet));
router.post("/:folder/:file", asyncHandler(handleSolutionPost));

module.exports = router;
