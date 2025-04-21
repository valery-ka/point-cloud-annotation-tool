import { MODES } from "tools";
import { filterPointsBySelection } from "../positions/filters";
import { invalidateImagePointsVisibility } from "../positions/general";

export const invalidateCloudColor = (geometry) => {
    geometry.attributes.color.needsUpdate = true;
};

export const invalidateImageColor = (geometry, image, projectedPoints) => {
    if (!image) return;

    const url = image.src;
    const projection = projectedPoints[url].geometry;
    if (!projection) return;

    const indices = projection.attributes.indices.array;
    const colorArray = projection.attributes.color.array;
    const matchedColorArray = geometry.attributes.color.array;

    for (let i = 0; i < indices.length; i++) {
        const pointIndex = indices[i];
        const { r, g, b } = getRGBFromMatchedColorArray(pointIndex, matchedColorArray);

        colorArray[i * 3] = r;
        colorArray[i * 3 + 1] = g;
        colorArray[i * 3 + 2] = b;
    }

    projection.attributes.color.needsUpdate = true;
};

export const getRGBFromMatchedColorArray = (index, matchedColorArray) => {
    const r = matchedColorArray[index * 3];
    const g = matchedColorArray[index * 3 + 1];
    const b = matchedColorArray[index * 3 + 2];
    return { r, g, b };
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

export const getDefaultPointColor = (index, frameIntensity, brightnessFactor, intensityFactor) => {
    const intensity = frameIntensity?.[index] ?? 0;
    const adjustedIntensity = intensity * intensityFactor;
    const defaultColor = adjustedIntensity * (1 - brightnessFactor) + 255 * brightnessFactor;

    return defaultColor;
};

export const changeClassOfSelection = ({
    mode,
    points,
    frameData,
    colorData,
    visibilityData,
    imageData,
    updateBox,
}) => {
    const paintPoints = MODES[mode]?.paint;
    if (!paintPoints) return;

    const { ref: geometryRef, colors, labels, intensity, positions } = frameData;
    const { classColor, classIndex, pointColor } = colorData;
    const { classVisible, minMaxZ } = visibilityData;
    const { image, projectedPoints, visibleVOID } = imageData;

    paintPoints(
        colors,
        labels,
        points,
        classColor,
        classIndex,
        intensity,
        pointColor,
        getDefaultPointColor,
    );

    if (!classVisible) {
        filterPointsBySelection({
            frameData: {
                geometry: geometryRef.geometry,
                positions: positions,
                labels,
            },
            selectionData: {
                points,
                mode: "filterHide",
                isSelection: true,
                updateGlobalBox: updateBox,
            },
            filterData: {
                visibility: visibilityData.classVisible,
                minZ: minMaxZ[0],
                maxZ: minMaxZ[1],
            },
            imageData: { image, projectedPoints },
        });
    }

    invalidateCloudColor(geometryRef.geometry);
    invalidateImageColor(geometryRef.geometry, image, projectedPoints);
    invalidateImagePointsVisibility({
        frameData: {
            geometry: geometryRef.geometry,
            labels: labels,
        },
        imageData,
    });
};

export const updatePointCloudColors = ({ frameData, colorData, imageData }) => {
    const { ref: pointCloud, labels, intensity } = frameData;
    const { classColorsCache, pointColor } = colorData;
    const { image, projectedPoints } = imageData;

    const geometry = pointCloud.geometry;
    const colorAttribute = geometry.attributes.color;
    if (!colorAttribute) return;

    const colorArray = colorAttribute.array;
    const brightnessFactor = pointColor.pointBrightness;
    const intensityFactor = pointColor.pointIntensity;

    for (let i = 0, j = 0; i < colorArray.length; i += 3, j++) {
        const labelIndex = labels[j];

        if (labelIndex === 0) {
            const defaultColor = getDefaultPointColor(
                i / 3,
                intensity,
                brightnessFactor,
                intensityFactor,
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

    invalidateCloudColor(geometry);
    invalidateImageColor(geometry, image, projectedPoints);
};
