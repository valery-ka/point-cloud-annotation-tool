import { hidePoint, showPoint, invalidateCloudPointsPosition } from "./cloud";
import { MODES } from "tools";
import * as APP_CONSTANTS from "constants";

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
    const currentX = activeFramePositions[index];

    return { visible, originalZ, currentX };
};

export const filterPoints = ({ cloudData, filterData }) => {
    const { geometry, positions, originalPositions, labels } = cloudData;
    const { visibility, minZ, maxZ } = filterData;

    for (let i = 0; i < positions.length; i += 3) {
        const { visible, originalZ, currentX } = getPointData(
            i,
            labels,
            visibility,
            originalPositions,
            positions,
        );

        if (originalZ < minZ || originalZ > maxZ) {
            hidePoint(positions, i, Z_FILTER);
        } else if (!visible) {
            hidePoint(positions, i, CLASS_FILTER);
        } else if (currentX === SELECTION) {
            continue;
        } else {
            showPoint(positions, i, originalPositions);
        }
    }

    invalidateCloudPointsPosition(geometry);
};

export const filterPointsBySelection = ({
    cloudData,
    selectionData,
    filterData,
    showFilterPoints,
}) => {
    const { geometry } = cloudData;
    const { selectionMode, updateGlobalBox } = selectionData;

    const filterPoints = MODES[selectionMode]?.filter;
    if (!filterPoints) return;

    filterPoints({
        cloudData: cloudData,
        filterData: filterData,
        selectionData: selectionData,
        callbacks: {
            hidePoint,
            showPoint,
            updateGlobalBox,
            showFilterPoints,
        },
    });

    invalidateCloudPointsPosition(geometry);
};

export const showFilterPointsBySelection = ({ cloudData, filterData, index }) => {
    const { geometry, positions, originalPositions, labels } = cloudData;
    const { visibility, minZ, maxZ } = filterData;

    const { visible, originalZ } = getPointData(
        index,
        labels,
        visibility,
        originalPositions,
        positions,
    );

    if (!visible) {
        hidePoint(positions, index, CLASS_FILTER, true);
    } else if (originalZ < minZ || originalZ > maxZ) {
        hidePoint(positions, index, Z_FILTER, true);
    } else {
        showPoint(positions, index, originalPositions);
    }

    invalidateCloudPointsPosition(geometry);
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
