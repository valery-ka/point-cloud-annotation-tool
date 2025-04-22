import { getRGBFromMatchedColorArray } from "./image";

export const invalidateHighlighterPointsColor = ({ geometry, imageData }) => {
    const { image, projectedPoints } = imageData;
    if (!image) return;

    const url = image.src;
    const projection = projectedPoints[url].geometry;
    if (!projection) return;

    const indices = projection.attributes.indices.array;
    const colorArray = projection.attributes.color.array;
    const matchedColorArray = geometry.attributes.color.array;

    for (let i = 0; i < indices.length; i++) {
        const pointIndex = indices[i];
        const { r, g, b } = getRGBFromMatchedColorArray(pointIndex, matchedColorArray);

        colorArray[i * 3] = r;
        colorArray[i * 3 + 1] = g;
        colorArray[i * 3 + 2] = b;
    }

    projection.attributes.color.needsUpdate = true;
};
