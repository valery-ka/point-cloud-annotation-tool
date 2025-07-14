export { updatePixelProjections } from "./positions/updatePixelProjections";

// positions (points visibility) utils
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
    updateObjectsFilter,
} from "./positions/filters";

// points colors utils
export {
    getColorArray,
    invalidateCloudColor,
    hexToRgb,
    rgbToHex,
    changeClassOfSelection,
    getDefaultPointColor,
    updatePointCloudColors,
} from "./colors/cloud";
export { invalidateImagePointsColor, getRGBFromMatchedColorArray } from "./colors/image";
export { invalidateHighlighterPointsColor } from "./colors/highlighter";

// points sizes utils
export {
    getSizeArray,
    invalidateCloudPointsSize,
    updatePointsSize,
    updateSelectedPointsSize,
    updateHighlightedPointSize,
} from "./sizes/cloud";
export { invalidateImagePointsSize } from "./sizes/image";
export { invalidateHighlighterPointsSize } from "./sizes/highlighter";

// geometry utils
export {
    rebuildGeometry,
    drawGlobalBox,
    drawCircleRuler,
    drawFrustumMesh,
    drawWireframe,
    drawAxesHelper,
    disposeMesh,
} from "./geometry/general";

// save / load utils
export { formatPointLabels, formatObjects } from "./output/general";
export { saveLabels } from "./output/saveLabels";
export { loadLabels } from "./output/loadLabels";
export { saveObjects } from "./output/saveObjects";
export { loadObjects } from "./output/loadObjects";
export {
    handleIntensityAttribute,
    handleLabelAttribute,
    setupPointCloudGeometry,
    getLabelsForFile,
    createPointCloud,
} from "./geometry/loader";
