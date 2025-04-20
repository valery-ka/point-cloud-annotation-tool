import * as APP_CONSTANTS from "constants";

const { HIDDEN_POINT } = APP_CONSTANTS;

export const invalidateCloudPosition = (geometry) => {
    geometry.attributes.position.needsUpdate = true;
};

export const invalidateImagePointsVisibility = ({ frameData, imageData }) => {
    const { geometry, labels } = frameData;
    const { image, projectedPoints, visibleVOID } = imageData;

    if (!image) return;

    const url = image.src;
    const projection = projectedPoints[url];
    if (!projection) return;
    const indices = projection.attributes.indices.array;
    const alpha = projection.attributes.alpha.array;
    const matchedPositionArray = geometry.attributes.position.array;

    for (let i = 0; i < indices.length; i++) {
        const pointIndex = indices[i];
        const label = labels[pointIndex];
        const x = getXFromMatchedPositionArray(pointIndex, matchedPositionArray);

        const shouldHide = (!visibleVOID && label === 0) || x >= HIDDEN_POINT;
        alpha[i] = shouldHide ? 0.0 : 1.0;
    }

    projection.attributes.alpha.needsUpdate = true;
};

export const getXFromMatchedPositionArray = (index, matchedPositionArray) => {
    const x = matchedPositionArray[index * 3];
    return x;
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
