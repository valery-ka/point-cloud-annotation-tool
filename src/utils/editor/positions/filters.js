import { hidePoint, showPoint } from "./general";
import { MODES } from "@tools";
import * as APP_CONSTANTS from "@constants";

const { Z_FILTER, SELECTION, CLASS_FILTER } = APP_CONSTANTS.HIDDEN_POSITION;

const getPointData = (
    index,
    activeFrameLabels,
    classesVisibility,
    originalPositions,
    activeFramePositions,
) => {
    const label = activeFrameLabels[index / 3];
    const classVisibility = classesVisibility[label];
    const visible = classVisibility ? classVisibility.visible : true;
    const originalZ = originalPositions[index + 2];
    const currentZ = activeFramePositions[index + 2];

    return { visible, originalZ, currentZ };
};

export const filterPoints = (
    geometry,
    activeFramePositions,
    originalPositions,
    activeFrameLabels,
    classesVisibility,
    minZ,
    maxZ,
) => {
    for (let i = 0; i < activeFramePositions.length; i += 3) {
        const { visible, originalZ, currentZ } = getPointData(
            i,
            activeFrameLabels,
            classesVisibility,
            originalPositions,
            activeFramePositions,
        );

        if (originalZ < minZ || originalZ > maxZ) {
            hidePoint(geometry, activeFramePositions, i, Z_FILTER);
        } else if (!visible) {
            hidePoint(geometry, activeFramePositions, i, CLASS_FILTER);
        } else if (currentZ == SELECTION) {
            continue;
        } else {
            showPoint(geometry, activeFramePositions, i, originalPositions);
        }
    }
};

export const filterPointsBySelection = (
    geometry,
    activeFramePositions,
    originalPositions,
    points,
    mode,
    minZ,
    maxZ,
    isSelection = false,
    updateGlobalBox,
    pointLabels,
    classesVisibility,
    showFilterPoints,
) => {
    const filterPoints = MODES[mode]?.filter;
    if (!filterPoints) return;

    filterPoints(
        geometry,
        activeFramePositions,
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
        showFilterPoints,
    );
};

export const showFilterPointsBySelection = (
    geometry,
    activeFramePositions,
    originalPositions,
    activeFrameLabels,
    classesVisibility,
    minZ,
    maxZ,
    i,
) => {
    const { visible, originalZ } = getPointData(
        i,
        activeFrameLabels,
        classesVisibility,
        originalPositions,
        activeFramePositions,
    );

    if (!visible) {
        hidePoint(geometry, activeFramePositions, i, CLASS_FILTER, true);
    } else if (originalZ < minZ || originalZ > maxZ) {
        hidePoint(geometry, activeFramePositions, i, Z_FILTER, true);
    } else {
        showPoint(geometry, activeFramePositions, i, originalPositions);
    }
};

export const updateClassFilter = (action, classIndex, classesVisibilityRef) => {
    const classesData = classesVisibilityRef.current;

    if (ACTIONS[action]?.classFilter) {
        ACTIONS[action].classFilter(classesData);
        return;
    }

    classesData[Object.keys(classesData)[0]].show = false;

    const classVisibility = classesData[classIndex];
    classVisibility[action] = !classVisibility[action];

    const showMode = Object.values(classesData).some((classObj) => classObj.show);

    Object.values(classesData).forEach((classObj) => {
        classObj.visible = showMode ? classObj.show : !classObj.hide;
    });
};

export const ACTIONS = {
    hideAll: {
        classFilter: (classesData) => {
            Object.keys(classesData).forEach((key) => {
                const VOIDClass = key === Object.keys(classesData)[0];
                classesData[key].hide = !VOIDClass;
                classesData[key].show = VOIDClass;
                classesData[key].visible = VOIDClass;
            });
        },
        isActive: (action) => action === "hide",
    },
    showAll: {
        classFilter: (classesData) => {
            Object.keys(classesData).forEach((key) => {
                classesData[key].hide = false;
                classesData[key].show = false;
                classesData[key].visible = true;
            });
        },
        isActive: () => false,
    },
};
