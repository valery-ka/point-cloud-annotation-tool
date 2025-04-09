import { MODES } from "@tools";
import { filterPointsBySelection } from "../positions/filters";

export const invalidateColor = (geometry) => {
    geometry.attributes.color.needsUpdate = true;
};

export const getColorArray = (pointCloudRefs, filePath) => {
    const pointCloud = pointCloudRefs.current[filePath];
    if (pointCloud) {
        return pointCloud.geometry.attributes.color.array;
    }
    return null;
};

export const hexToRgb = (hex) => {
    const bigint = parseInt(hex.slice(1), 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;

    return [r, g, b];
};

export const getDefaultPointColor = (
    index,
    frameIntensity,
    brightnessFactor,
    intensityFactor
) => {
    const intensity = frameIntensity?.[index] ?? 0;
    const adjustedIntensity = intensity * intensityFactor;
    const defaultColor =
        adjustedIntensity * (1 - brightnessFactor) + 255 * brightnessFactor;

    return defaultColor;
};

export const changeClassOfSelection = ({
    mode,
    points,
    frameData,
    colorData,
    visibilityData,
    updateBox,
}) => {
    const paintPoints = MODES[mode]?.paint;
    if (!paintPoints) return;

    paintPoints(
        frameData.colors,
        frameData.labels,
        points,
        colorData.classColor,
        colorData.classIndex,
        frameData.intensity,
        colorData.pointColor,
        getDefaultPointColor
    );

    if (!visibilityData.classVisible) {
        filterPointsBySelection(
            frameData.ref.geometry,
            frameData.positions.current,
            frameData.originalPositions.current,
            points,
            (mode = "filterHide"),
            visibilityData.minMaxZ[0],
            visibilityData.minMaxZ[1],
            true, // isSelection
            updateBox
        );
    }

    invalidateColor(frameData.ref.geometry);
};

export const updatePointCloudColors = (
    activeFrameLabels,
    pointCloud,
    classColorsCache,
    activeFrameIntensity,
    pointColor
) => {
    const geometry = pointCloud.geometry;
    const colorAttribute = geometry.attributes.color;
    if (!colorAttribute) return;

    const colorArray = colorAttribute.array;
    const brightnessFactor = pointColor.pointBrightness;
    const intensityFactor = pointColor.pointIntensity;

    for (let i = 0, j = 0; i < colorArray.length; i += 3, j++) {
        const labelIndex = activeFrameLabels[j];

        if (labelIndex === 0) {
            const defaultColor = getDefaultPointColor(
                i / 3,
                activeFrameIntensity,
                brightnessFactor,
                intensityFactor
            );

            colorArray[i] = defaultColor;
            colorArray[i + 1] = defaultColor;
            colorArray[i + 2] = defaultColor;
        } else if (classColorsCache.current[labelIndex]) {
            const rgb = classColorsCache.current[labelIndex];
            colorArray[i] = rgb[0];
            colorArray[i + 1] = rgb[1];
            colorArray[i + 2] = rgb[2];
        }
    }

    invalidateColor(geometry);
};
