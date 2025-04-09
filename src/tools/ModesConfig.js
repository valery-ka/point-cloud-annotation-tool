import * as APP_CONSTANTS from "@constants";
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
            getDefaultPointColor
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
                    intensityFactor
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
        filter: (
            geometry,
            framePositions,
            originalPositions,
            points,
            hidePoint,
            showPoint,
            minZ,
            maxZ,
            isSelection,
            updateGlobalBox,
            pointLabels,
            classesVisibility,
            showFilterPoints
        ) => {
            if (!points.length) return;
            for (let i = 0; i < points.length; i++) {
                const pointIndex = points[i];
                const hidePosition = isSelection ? CLASS_FILTER : SELECTION;
                hidePoint(
                    geometry,
                    framePositions,
                    pointIndex * 3,
                    hidePosition
                );
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
        filter: (
            geometry,
            framePositions,
            originalPositions,
            points,
            hidePoint,
            showPoint,
            minZ,
            maxZ,
            _,
            updateGlobalBox,
            pointLabels,
            classesVisibility,
            showFilterPoints
        ) => {
            if (!points.length) return;
            const visiblePointsSet = new Set(points);
            for (let i = 0; i < framePositions.length; i += 3) {
                const pointIndex = i / 3;
                const label = pointLabels[pointIndex];
                const classVisibility = classesVisibility[label];
                const visible = classVisibility
                    ? classVisibility.visible
                    : true;
                const originalZ = originalPositions[i + 2];

                const shouldShowPoint = visiblePointsSet.has(pointIndex);

                if (
                    !shouldShowPoint ||
                    (classVisibility && !visible) ||
                    originalZ < minZ ||
                    originalZ > maxZ
                ) {
                    const reason = !shouldShowPoint
                        ? SELECTION
                        : classVisibility && !visible
                        ? CLASS_FILTER
                        : Z_FILTER;
                    hidePoint(geometry, framePositions, i, reason, true);
                } else {
                    showPoint(geometry, framePositions, i, originalPositions);
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
        filter: (
            geometry,
            framePositions,
            originalPositions,
            points,
            hidePoint,
            showPoint,
            minZ,
            maxZ,
            _,
            updateGlobalBox,
            pointLabels,
            classesVisibility,
            showFilterPoints
        ) => {
            if (!points.length) return;
            for (let i = 0; i < points.length; i++) {
                const index = points[i];
                showFilterPoints(
                    geometry,
                    framePositions,
                    originalPositions,
                    pointLabels,
                    classesVisibility,
                    minZ,
                    maxZ,
                    index * 3
                );
            }
            updateGlobalBox();
        },
    },
};
