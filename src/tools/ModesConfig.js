import * as APP_CONSTANTS from "constants";
import {
    faFill,
    faEraser,
    faSprayCan,
    faPencilRuler,
    faEyeSlash,
    faCropSimple,
    faEye,
} from "@fortawesome/free-solid-svg-icons";

const { Z_FILTER, SELECTION, CLASS_FILTER } = APP_CONSTANTS.HIDDEN_POSITION;

export const MODES = {
    paintFill: {
        type: "paint",
        title: "paintFill",
        icon: faFill,
        iconPosition: "top-left",
        shouldProcess: ({ cloudData, index }) => {
            const { positions, labels } = cloudData;
            const x = positions[index * 3];

            if (x >= Z_FILTER) return false;

            return labels[index] === 0;
        },
        paint: ({ cloudData, selectionData, colorData }) => {
            const { cloud, labels } = cloudData;
            const { selectedPoints } = selectionData;
            const { originalClassIndex, selectedClassColor } = colorData;

            const colors = cloud.geometry.attributes.color.array;

            if (!selectedPoints.length) return;

            for (let i = 0; i < selectedPoints.length; i++) {
                const pointIndex = selectedPoints[i];
                labels[pointIndex] = originalClassIndex;
                colors.set(selectedClassColor, pointIndex * 3);
            }
        },
    },
    paintErase: {
        type: "paint",
        title: "paintErase",
        icon: faEraser,
        iconPosition: "",
        hotkey: "Shift",
        shouldProcess: ({ cloudData, selectionData, index }) => {
            const { positions, labels } = cloudData;
            const { originalClassIndex } = selectionData;
            const x = positions[index * 3];

            if (labels[index] === 0) return false;
            if (x >= Z_FILTER) return false;

            return labels[index] === originalClassIndex;
        },
        paint: ({ cloudData, selectionData, colorData, cuboidData, callbacks }) => {
            const { cloud, labels } = cloudData;
            const { selectedPoints } = selectionData;
            const { pointColor, objectColorsCache } = colorData;
            const { cuboidsPoints, idToLabel, cuboidsSolution, cuboidsVisibility } = cuboidData;
            const { getDefaultPointColor, getCuboidPointColor } = callbacks;

            const colors = cloud.geometry.attributes.color.array;
            const intensity = cloud.geometry.attributes.intensity?.array;
            const brightnessFactor = pointColor.pointBrightness;
            const intensityFactor = pointColor.pointIntensity;
            const cuboidPointsMixFactor = pointColor.cuboidPointsMixFactor;

            const cuboidPointToData = new Map();
            for (const cuboidId in cuboidsPoints) {
                const pointIndices = cuboidsPoints[cuboidId];
                const label = idToLabel[cuboidId];
                const frameVisible = cuboidsSolution.find((cube) => cube.id === cuboidId)?.visible;
                const globalVisible = cuboidsVisibility[cuboidId]?.visible ?? true;
                const isVisible = (frameVisible && globalVisible) === true;

                for (let i = 0; i < pointIndices.length; i++) {
                    cuboidPointToData.set(pointIndices[i], { label, isVisible });
                }
            }

            for (let i = 0; i < selectedPoints.length; i++) {
                const pointIndex = selectedPoints[i];
                labels[pointIndex] = 0;

                const defaultColor = getDefaultPointColor(
                    pointIndex,
                    intensity,
                    brightnessFactor,
                    intensityFactor,
                );

                const { label, isVisible } = cuboidPointToData.get(pointIndex) ?? {};
                const cuboidColor = (isVisible && objectColorsCache[label]) || null;

                const [r, g, b] = cuboidColor
                    ? getCuboidPointColor(defaultColor, cuboidColor, cuboidPointsMixFactor)
                    : [defaultColor, defaultColor, defaultColor];

                const baseIndex = pointIndex * 3;
                colors[baseIndex] = r;
                colors[baseIndex + 1] = g;
                colors[baseIndex + 2] = b;
            }
        },
    },
    paintForce: {
        type: "paint",
        title: "paintForce",
        icon: faSprayCan,
        iconPosition: "",
        hotkey: "Control",
        shouldProcess: ({ cloudData, selectionData, index }) => {
            const { positions, labels } = cloudData;
            const { originalClassIndex } = selectionData;
            const x = positions[index * 3];

            if (x >= Z_FILTER) return false;

            return labels[index] !== originalClassIndex;
        },
        paint: ({ cloudData, selectionData, colorData }) => {
            const { labels, cloud } = cloudData;
            const { selectedPoints } = selectionData;
            const { originalClassIndex, selectedClassColor } = colorData;

            const colors = cloud.geometry.attributes.color.array;

            if (!selectedPoints.length) return;

            for (let i = 0; i < selectedPoints.length; i++) {
                const pointIndex = selectedPoints[i];
                labels[pointIndex] = originalClassIndex;
                colors.set(selectedClassColor, pointIndex * 3);
            }
        },
    },
    paintDepth: {
        type: "paint",
        title: "paintDepth",
        icon: faPencilRuler,
        iconPosition: "bottom",
        shouldProcess: ({ cloudData, selectionData, index }) => {
            const { positions, labels } = cloudData;
            const { paintDepth, highlightedPointZ } = selectionData;

            if (highlightedPointZ) {
                const x = positions[index * 3];
                const z = positions[index * 3 + 2];

                if (x >= Z_FILTER || z <= highlightedPointZ + paintDepth) return false;
                return labels[index] === 0;
            }
        },
        paint: ({ cloudData, selectionData, colorData }) => {
            const { cloud, labels } = cloudData;
            const { selectedPoints } = selectionData;
            const { originalClassIndex, selectedClassColor } = colorData;

            const colors = cloud.geometry.attributes.color.array;

            if (!selectedPoints.length) return;

            for (let i = 0; i < selectedPoints.length; i++) {
                const pointIndex = selectedPoints[i];
                labels[pointIndex] = originalClassIndex;
                colors.set(selectedClassColor, pointIndex * 3);
            }
        },
    },
    filterHide: {
        type: "filter",
        title: "filterHide",
        icon: faEyeSlash,
        iconPosition: "top-right",
        shouldProcess: ({ cloudData, index }) => {
            const { positions } = cloudData;
            const x = positions[index * 3];

            if (x < Z_FILTER) return true;
        },
        filter: ({ cloudData, selectionData, callbacks }) => {
            const { cloud } = cloudData;
            const { isSelection } = selectionData;
            const { selectedPoints } = selectionData;
            const { hidePoint, updateGlobalBox } = callbacks;

            const positions = cloud.geometry.attributes.position.array;

            if (!selectedPoints.length) return;

            const reason = isSelection ? CLASS_FILTER : SELECTION;

            for (let i = 0; i < selectedPoints.length; i++) {
                const pointIndex = selectedPoints[i];
                hidePoint(positions, pointIndex * 3, reason);
            }

            updateGlobalBox();
        },
    },
    filterCrop: {
        type: "filter",
        title: "filterCrop",
        icon: faCropSimple,
        iconPosition: "",
        shouldProcess: ({ cloudData, index }) => {
            const { positions } = cloudData;
            const x = positions[index * 3];

            if (x < Z_FILTER) return true;
        },
        filter: ({ cloudData, filterData, selectionData, callbacks }) => {
            const { cloud, labels } = cloudData;
            const { minZ, maxZ, visibility } = filterData;
            const { selectedPoints } = selectionData;
            const { hidePoint, showPoint, updateGlobalBox } = callbacks;

            const positions = cloud.geometry.attributes.position.array;
            const originalPositions = cloud.geometry.attributes.original.array;

            if (!selectedPoints.length) return;

            const visiblePointsSet = new Set(selectedPoints);

            for (let i = 0; i < positions.length; i += 3) {
                const pointIndex = i / 3;
                const label = labels[pointIndex];
                const classVisibility = visibility[label];
                const isClassVisible = classVisibility ? classVisibility.visible : true;
                const originalZ = originalPositions[i + 2];
                const isSelected = visiblePointsSet.has(pointIndex);

                const shouldHide =
                    !isSelected || !isClassVisible || originalZ < minZ || originalZ > maxZ;

                if (shouldHide) {
                    const reason = !isSelected
                        ? SELECTION
                        : !isClassVisible
                          ? CLASS_FILTER
                          : Z_FILTER;

                    hidePoint(positions, i, reason, true);
                } else {
                    showPoint(positions, i, originalPositions);
                }
            }

            updateGlobalBox();
        },
    },
    filterReveal: {
        type: "filter",
        title: "filterReveal",
        icon: faEye,
        iconPosition: "bottom-right",
        shouldProcess: ({ cloudData, index }) => {
            const { positions } = cloudData;
            const x = positions[index * 3];

            if (x >= Z_FILTER) return true;
        },
        filter: ({ cloudData, filterData, selectionData, callbacks }) => {
            const { cloud, labels } = cloudData;
            const { minZ, maxZ, visibility } = filterData;
            const { selectedPoints } = selectionData;
            const { showFilterPoints, updateGlobalBox } = callbacks;

            if (!selectedPoints.length) return;

            for (let i = 0; i < selectedPoints.length; i++) {
                const index = selectedPoints[i] * 3;

                showFilterPoints({
                    cloudData: {
                        cloud: cloud,
                        labels: labels,
                    },
                    filterData: {
                        visibility,
                        minZ,
                        maxZ,
                    },
                    index,
                });
            }

            updateGlobalBox();
        },
    },
};
