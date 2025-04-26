import { getXFromMatchedPositionArray } from "./image";
import * as APP_CONSTANTS from "constants";

const { HIDDEN_POINT } = APP_CONSTANTS;

export const invalidateHighlighterPointsVisibility = ({ cloudData, imageData }) => {
    const { geometry, point } = cloudData;
    const { image, projectedPoints } = imageData;

    if (!image) return;

    const url = image.src;
    const projection = projectedPoints[url].geometry;
    if (!projection) return;

    const indices = projection.attributes.indices.array;
    const alpha_highlighter = projection.attributes.alpha_highlighter.array;
    const matchedPositionArray = geometry.attributes.position.array;
    const { nearestIndices } = point;

    const nearestSet = new Set(nearestIndices);

    for (let i = 0; i < indices.length; i++) {
        const pointIndex = indices[i];
        const x = getXFromMatchedPositionArray(pointIndex, matchedPositionArray);

        const shouldHide = !nearestSet.has(pointIndex) || x >= HIDDEN_POINT;
        alpha_highlighter[i] = shouldHide ? 0.0 : 1.0;
    }

    projection.attributes.alpha_highlighter.needsUpdate = true;
};
