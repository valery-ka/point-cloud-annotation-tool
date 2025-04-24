import * as APP_CONSTANTS from "constants";

const { HIDDEN_POINT } = APP_CONSTANTS;

export const invalidateCloudPointsPosition = (geometry) => {
    geometry.attributes.position.needsUpdate = true;
};

export const getPositionArray = (pointCloudRefs, filePath) => {
    const pointCloud = pointCloudRefs.current[filePath];
    if (pointCloud) {
        return pointCloud.geometry.attributes.position.array;
    }
    return null;
};

export const hidePoint = (positions, i, hiddenPosition, ignoreSkip = false) => {
    if (positions[i] >= HIDDEN_POINT && !ignoreSkip) return;
    positions[i] = hiddenPosition;
};

export const showPoint = (positions, i, originalPositions) => {
    if (positions[i] < HIDDEN_POINT) return;
    positions[i] = originalPositions[i];
};

export const findNearestPoints = (point, framePositions, radius) => {
    if (!point || !framePositions) return [];

    const { x: hx, y: hy, z: hz } = point;
    const positions = framePositions;
    const radiusSquared = radius * radius;

    const neighbors = [];
    for (let i = 0; i < positions.length; i += 3) {
        const dx = positions[i] - hx;
        const dy = positions[i + 1] - hy;
        const dz = positions[i + 2] - hz;
        const distanceSquared = dx * dx + dy * dy + dz * dz;

        if (distanceSquared <= radiusSquared) {
            neighbors.push(i / 3);
        }
    }

    return neighbors;
};
