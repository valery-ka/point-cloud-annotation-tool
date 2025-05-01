const express = require("express");
const router = express.Router();

const { asyncHandler } = require("../middleware/asyncHandler");

const {
    getSingleNavigatorFolder,
    getAllNavigatorFolders,
} = require("../services/navigator/fileStructure");
const {
    handlePointcloudRequest,
    handleImageRequest,
    handleCalibrationRequest,
    handleConfigRequest,
    handleSolutionGet,
    handleSolutionPost,
    handleOdometryRequest,
} = require("../services/navigator/fileHandler");

router.get("/", asyncHandler(getAllNavigatorFolders));
router.get("/:folder", asyncHandler(getSingleNavigatorFolder));

router.get("/:folder/calibrations/:file", asyncHandler(handleCalibrationRequest));
router.get("/:folder/config/:file", asyncHandler(handleConfigRequest));
router.get("/:folder/images/:camera/:file", asyncHandler(handleImageRequest));
router.get("/:folder/odometry/:file", asyncHandler(handleOdometryRequest));
router.get("/:folder/pointclouds/:file", asyncHandler(handlePointcloudRequest));

router.get("/:folder/:file", asyncHandler(handleSolutionGet));
router.post("/:folder/:file", asyncHandler(handleSolutionPost));

module.exports = router;
