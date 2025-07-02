import * as APP_CONSTANTS from "constants";

const { HIDDEN_POINT } = APP_CONSTANTS;

export const invalidateImagePointsVisibility = ({ cloudData, imageData }) => {
    const { geometry, labels, cuboids, cuboidsVisibility } = cloudData;
    const { image, projectedPoints, visibleVOID } = imageData;

    if (!image) return;

    const url = image.src;
    const projection = projectedPoints[url].geometry;
    if (!projection) return;

    const indices = projection.attributes.indices.array;
    const alpha_image = projection.attributes.alpha_image.array;
    const matchedPositionArray = geometry.attributes.position.array;

    const pointsInsideCuboids = new Set();
    if (cuboids) {
        for (const [id, pointIndices] of Object.entries(cuboids)) {
            const isVisible = cuboidsVisibility?.[id]?.visible ?? true;
            if (!isVisible) continue;

            for (const index of pointIndices) {
                pointsInsideCuboids.add(index);
            }
        }
    }

    for (let i = 0; i < indices.length; i++) {
        const pointIndex = indices[i];
        const label = labels[pointIndex];
        const x = getXFromMatchedPositionArray(pointIndex, matchedPositionArray);

        const isInsideCuboid = pointsInsideCuboids.has(pointIndex);
        const shouldHide = (!visibleVOID && label === 0 && !isInsideCuboid) || x >= HIDDEN_POINT;

        alpha_image[i] = shouldHide ? 0.0 : 1.0;
    }

    projection.attributes.alpha_image.needsUpdate = true;
};

export const getXFromMatchedPositionArray = (index, matchedPositionArray) => {
    const x = matchedPositionArray[index * 3];
    return x;
};
