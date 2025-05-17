import { MODES } from "tools";
import { filterPointsBySelection } from "../positions/filters";

export const invalidateCloudColor = (geometry) => {
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

export const rgbToHex = (color) => {
    const r = Math.round(color.r * 255);
    const g = Math.round(color.g * 255);
    const b = Math.round(color.b * 255);

    const toHex = (n) => n.toString(16).padStart(2, "0");

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

export const getDefaultPointColor = (index, frameIntensity, brightnessFactor, intensityFactor) => {
    const intensity = frameIntensity?.[index] ?? 0;
    const adjustedIntensity = intensity * intensityFactor;
    const defaultColor = adjustedIntensity * (1 - brightnessFactor) + 255 * brightnessFactor;

    return defaultColor;
};

export const changeClassOfSelection = ({
    cloudData,
    colorData,
    selectionData,
    visibilityData,
    callbacks,
}) => {
    const { selectionMode, selectedPoints } = selectionData;

    const paintPoints = MODES[selectionMode]?.paint;
    if (!paintPoints) return;

    const { cloud, labels } = cloudData;
    const { classVisible, minMaxZ } = visibilityData;
    const { updateGlobalBox } = callbacks;

    paintPoints({
        cloudData: cloudData,
        selectionData: { selectedPoints: selectedPoints },
        colorData: colorData,
        callbacks: { updateGlobalBox, getDefaultPointColor },
    });

    if (!classVisible) {
        filterPointsBySelection({
            cloudData: {
                cloud,
                labels,
            },
            selectionData: {
                selectedPoints,
                selectionMode: "filterHide",
                isSelection: true,
            },
            filterData: {
                visibility: visibilityData.classVisible,
                minZ: minMaxZ[0],
                maxZ: minMaxZ[1],
            },
            callbacks,
        });
    }

    invalidateCloudColor(cloud.geometry);
};

export const updatePointCloudColors = ({ cloudData, colorData }) => {
    const { cloud, labels } = cloudData;
    const { classColorsCache, pointColor } = colorData;

    const geometry = cloud.geometry;
    const colorAttribute = geometry.attributes.color;
    const intensityAttribute = geometry.attributes.intensity;

    if (!colorAttribute) return;

    const colorArray = colorAttribute.array;
    const intensityArray = intensityAttribute?.array;
    const brightnessFactor = pointColor.pointBrightness;
    const intensityFactor = pointColor.pointIntensity;

    for (let i = 0, j = 0; i < colorArray.length; i += 3, j++) {
        const labelIndex = labels[j];

        if (labelIndex === 0) {
            const defaultColor = getDefaultPointColor(
                i / 3,
                intensityArray,
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
};
