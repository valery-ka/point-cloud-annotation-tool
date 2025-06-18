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

const getCloudData = (cloud) => {
    const geometry = cloud.geometry;
    const positions = geometry.attributes.position.array;
    const originalPositions = geometry.attributes.original.array;

    return { geometry, positions, originalPositions };
};

export const filterPoints = ({ cloudData, filterData }) => {
    const { cloud, labels } = cloudData;
    const { visibility, minZ, maxZ } = filterData;

    const { geometry, positions, originalPositions } = getCloudData(cloud);

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

export const filterPointsBySelection = ({ cloudData, selectionData, filterData, callbacks }) => {
    const { cloud } = cloudData;
    const { selectionMode } = selectionData;

    const { geometry } = getCloudData(cloud);

    const filterPoints = MODES[selectionMode]?.filter;
    if (!filterPoints) return;

    filterPoints({
        cloudData: cloudData,
        filterData: filterData,
        selectionData: selectionData,
        callbacks: {
            ...callbacks,
            hidePoint,
            showPoint,
        },
    });

    invalidateCloudPointsPosition(geometry);
};

export const showFilterPointsBySelection = ({ cloudData, filterData, index }) => {
    const { cloud, labels } = cloudData;
    const { visibility, minZ, maxZ } = filterData;

    const { geometry, positions, originalPositions } = getCloudData(cloud);
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

export const updateObjectsFilter = (unit, action, index, classesData, cuboidsData) => {
    ACTIONS[action]?.classFilter(classesData);
    ACTIONS[action]?.cuboidFilter(cuboidsData);
    classesData[Object.keys(classesData)[0]].show = false;

    switch (unit) {
        case "class":
            classesData[index][action] = !classesData[index][action];
            break;
        case "cuboid":
            cuboidsData[index][action] = !cuboidsData[index][action];
            break;
    }

    const classList = Object.values(classesData);
    const cuboidList = Object.values(cuboidsData);

    const showClasses = classList.filter((c) => c.show);
    const showCuboids = cuboidList.filter((c) => c.show);

    const inShowMode = showClasses.length > 0 || showCuboids.length > 0;

    classList.forEach((classObj) => {
        if (inShowMode) {
            classObj.visible = showClasses.includes(classObj);
        } else {
            classObj.visible = !classObj.hide;
        }
    });

    cuboidList.forEach((cuboidObj) => {
        if (inShowMode) {
            cuboidObj.visible = showCuboids.includes(cuboidObj);
            if (!showClasses.length) {
                classesData[Object.keys(classesData)[0]].visible = true;
            }
        } else {
            cuboidObj.visible = !cuboidObj.hide;
        }
    });
};

export const ACTIONS = {
    hideAll: {
        classFilter: (classesData) => {
            Object.keys(classesData).forEach((key, i) => {
                const VOIDClass = i === 0;
                classesData[key].hide = !VOIDClass;
                classesData[key].show = VOIDClass;
                classesData[key].visible = VOIDClass;
            });
        },
        cuboidFilter: (cuboidsData) => {
            Object.keys(cuboidsData).forEach((key) => {
                cuboidsData[key].hide = true;
                cuboidsData[key].show = false;
                cuboidsData[key].visible = false;
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
        cuboidFilter: (cuboidsData) => {
            Object.keys(cuboidsData).forEach((key) => {
                cuboidsData[key].hide = false;
                cuboidsData[key].show = false;
                cuboidsData[key].visible = true;
            });
        },
        isActive: () => false,
    },
};
