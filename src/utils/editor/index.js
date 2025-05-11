export { updatePixelProjections } from "./positions/updatePixelProjections";

// positions (points visibility)
export {
    hidePoint,
    showPoint,
    getPositionArray,
    findNearestPoints,
    invalidateCloudPointsPosition,
} from "./positions/cloud";
export { invalidateImagePointsVisibility } from "./positions/image";
export { invalidateHighlighterPointsVisibility } from "./positions/highlighter";
export {
    ACTIONS,
    filterPoints,
    filterPointsBySelection,
    showFilterPointsBySelection,
    updateClassFilter,
} from "./positions/filters";

// points colors
export {
    getColorArray,
    invalidateCloudColor,
    hexToRgb,
    changeClassOfSelection,
    getDefaultPointColor,
    updatePointCloudColors,
} from "./colors/cloud";
export { invalidateImagePointsColor, getRGBFromMatchedColorArray } from "./colors/image";
export { invalidateHighlighterPointsColor } from "./colors/highlighter";

// points sizes
export {
    getSizeArray,
    invalidateCloudPointsSize,
    updatePointsSize,
    updateSelectedPointsSize,
    updateHighlightedPointSize,
} from "./sizes/cloud";
export { invalidateImagePointsSize } from "./sizes/image";
export { invalidateHighlighterPointsSize } from "./sizes/highlighter";

export {
    rebuildGeometry,
    drawGlobalBox,
    drawCircleRuler,
    drawFrustumMesh,
    drawWireframe,
    drawAxesHelper,
    disposeMesh,
} from "./geometry/general";
export {
    handleIntensityAttribute,
    handleLabelAttribute,
    setupPointCloudGeometry,
    getLabelsForFile,
    createPointCloud,
    cleanupPointClouds,
} from "./geometry/loader";

export { formatPointLabels } from "./output/general";
export { saveLabels } from "./output/saveLabels";
export { loadLabels } from "./output/loadLabels";
