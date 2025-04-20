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
        shouldProcess: (label, index, cls, position) => {
            if (position) {
                const x = position[index * 3];
                if (x >= Z_FILTER) return false;
            }
            return label[index] === 0;
        },
        paint: (frameColors, framsLabels, points, classColor, classIndex) => {
            if (!points.length) return;
            for (let i = 0; i < points.length; i++) {
                const pointIndex = points[i];
                framsLabels[pointIndex] = classIndex;
                frameColors.set(classColor, pointIndex * 3);
            }
        },
    },
    paintErase: {
        type: "paint",
        title: "paintErase",
        icon: faEraser,
        iconPosition: "",
        hotkey: "Shift",
        shouldProcess: (label, index, cls, position) => {
            if (label[index] === 0) return false;
            if (position[index * 3] >= Z_FILTER) return false;
            return label[index] === cls;
        },
        paint: (
            frameColors,
            framsLabels,
            points,
            classColor,
            classIndex,
            frameIntensity,
            pointColor,
            getDefaultPointColor,
        ) => {
            if (!points.length) return;
            const brightnessFactor = pointColor.pointBrightness;
            const intensityFactor = pointColor.pointIntensity;

            for (let i = 0; i < points.length; i++) {
                const pointIndex = points[i];

                const pointColor = getDefaultPointColor(
                    pointIndex,
                    frameIntensity,
                    brightnessFactor,
                    intensityFactor,
                );

                const defaultColor = [pointColor, pointColor, pointColor];

                framsLabels[pointIndex] = 0;
                frameColors.set(defaultColor, pointIndex * 3);
            }
        },
    },
    paintForce: {
        type: "paint",
        title: "paintForce",
        icon: faSprayCan,
        iconPosition: "",
        hotkey: "Control",
        shouldProcess: (label, index, cls, position) => {
            if (position) {
                const x = position[index * 3];
                if (x >= Z_FILTER) return false;
            }
            return label[index] !== cls;
        },
        paint: (frameColors, framsLabels, points, classColor, classIndex) => {
            if (!points.length) return;
            for (let i = 0; i < points.length; i++) {
                const pointIndex = points[i];
                framsLabels[pointIndex] = classIndex;
                frameColors.set(classColor, pointIndex * 3);
            }
        },
    },
    paintDepth: {
        type: "paint",
        title: "paintDepth",
        icon: faPencilRuler,
        iconPosition: "bottom",
        shouldProcess: (label, index, cls, position, selection, depthZ) => {
            if (depthZ) {
                const z = position[index * 3 + 2];
                const paintDepth = selection.paintDepth;
                if (z >= Z_FILTER || z <= depthZ + paintDepth) return false;
                return label[index] === 0;
            }
        },
        paint: (frameColors, framsLabels, points, classColor, classIndex) => {
            if (!points.length) return;
            for (let i = 0; i < points.length; i++) {
                const pointIndex = points[i];
                framsLabels[pointIndex] = classIndex;
                frameColors.set(classColor, pointIndex * 3);
            }
        },
    },
    filterHide: {
        type: "filter",
        title: "filterHide",
        icon: faEyeSlash,
        iconPosition: "top-right",
        shouldProcess: (label, index, cls, position) => {
            const x = position[index * 3];
            if (x < Z_FILTER) return true;
        },
        filter: ({ frameData, filterData, selectionData, imageData, callbacks }) => {
            const { positions } = frameData;
            const { isSelection } = selectionData;
            const { points } = selectionData;
            const { hidePoint, updateGlobalBox } = callbacks;

            if (!points.length) return;

            const reason = isSelection ? CLASS_FILTER : SELECTION;

            for (let i = 0; i < points.length; i++) {
                const pointIndex = points[i];
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
        shouldProcess: (label, index, cls, position) => {
            const x = position[index * 3];
            if (x < Z_FILTER) return true;
        },
        filter: ({ frameData, filterData, selectionData, imageData, callbacks }) => {
            const { positions, originalPositions, labels } = frameData;
            const { minZ, maxZ, visibility } = filterData;
            const { points } = selectionData;
            const { hidePoint, showPoint, updateGlobalBox } = callbacks;

            if (!points.length) return;

            const visiblePointsSet = new Set(points);

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
        shouldProcess: (label, index, cls, position) => {
            const x = position[index * 3];
            if (x >= Z_FILTER) return true;
        },
        filter: ({ frameData, filterData, selectionData, imageData, callbacks }) => {
            const { geometry, positions, originalPositions, labels } = frameData;
            const { minZ, maxZ, visibility } = filterData;
            const { points } = selectionData;
            const { showFilterPoints, updateGlobalBox } = callbacks;

            if (!points.length) return;

            for (let i = 0; i < points.length; i++) {
                const index = points[i] * 3;

                showFilterPoints({
                    frameData: {
                        geometry,
                        positions,
                        originalPositions,
                        labels,
                    },
                    filterData: {
                        visibility,
                        minZ,
                        maxZ,
                    },
                    index,
                    imageData: { imageData },
                });
            }

            updateGlobalBox();
        },
    },
};
