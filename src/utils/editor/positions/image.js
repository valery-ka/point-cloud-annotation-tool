import * as APP_CONSTANTS from "constants";

const { HIDDEN_POINT } = APP_CONSTANTS;

export const invalidateImagePointsVisibility = ({ cloudData, imageData }) => {
    const { geometry, labels } = cloudData;
    const { image, projectedPoints, imagesPoints } = imageData;

    if (!image) return;

    const url = image.src;
    const projection = projectedPoints[url].geometry;
    if (!projection) return;
    const indices = projection.attributes.indices.array;
    const alpha_image = projection.attributes.alpha_image.array;
    const matchedPositionArray = geometry.attributes.position.array;

    for (let i = 0; i < indices.length; i++) {
        const pointIndex = indices[i];
        const label = labels[pointIndex];
        const x = getXFromMatchedPositionArray(pointIndex, matchedPositionArray);

        const shouldHide = (!imagesPoints.visibleVOID && label === 0) || x >= HIDDEN_POINT;
        alpha_image[i] = shouldHide ? 0.0 : 1.0;
    }

    projection.attributes.alpha_image.needsUpdate = true;
};

export const getXFromMatchedPositionArray = (index, matchedPositionArray) => {
    const x = matchedPositionArray[index * 3];
    return x;
};
