import * as APP_CONSTANTS from "constants";

const { HIDDEN_POINT } = APP_CONSTANTS;

export const invalidatePosition = (geometry) => {
    geometry.attributes.position.needsUpdate = true;
};

export const getPositionArray = (pointCloudRefs, filePath) => {
    const pointCloud = pointCloudRefs.current[filePath];
    if (pointCloud) {
        return pointCloud.geometry.attributes.position.array;
    }
    return null;
};

export const hidePoint = (geometry, positions, i, hiddenPosition, ignoreSkip = false) => {
    if (positions[i] >= HIDDEN_POINT && !ignoreSkip) return;
    for (let j = 0; j < 3; j++) {
        positions[i + j] = hiddenPosition;
    }

    invalidatePosition(geometry);
};

export const showPoint = (geometry, positions, i, originalPositions) => {
    if (positions[i] < HIDDEN_POINT) return;
    for (let j = 0; j < 3; j++) {
        positions[i + j] = originalPositions[i + j];
    }
    invalidatePosition(geometry);
};

export const findNearestPoints = (point, activeFramePositionsRef, radius) => {
    if (!point || !activeFramePositionsRef.current) return [];

    const { x: hx, y: hy, z: hz } = point;
    const positions = activeFramePositionsRef.current;
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
