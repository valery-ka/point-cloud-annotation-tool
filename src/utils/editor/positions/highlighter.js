import { getXFromMatchedPositionArray } from "./image";
import * as APP_CONSTANTS from "constants";

const { HIDDEN_POINT } = APP_CONSTANTS;

export const invalidateHighlighterPointsVisibility = ({ geometry, imageData }) => {
    const { cloudGeometry, highlightedPoint } = geometry;
    const { image, projectedPoints } = imageData;

    if (!image) return;

    const url = image.src;
    const projection = projectedPoints[url].geometry;
    if (!projection) return;

    const indices = projection.attributes.indices.array;
    const alpha_highlighter = projection.attributes.alpha_highlighter.array;
    const matchedPositionArray = cloudGeometry.attributes.position.array;
    const { nearestIndices } = highlightedPoint;

    const nearestSet = new Set(nearestIndices);

    for (let i = 0; i < indices.length; i++) {
        const pointIndex = indices[i];
        const x = getXFromMatchedPositionArray(pointIndex, matchedPositionArray);

        const shouldHide = !nearestSet.has(pointIndex) || x >= HIDDEN_POINT;
        alpha_highlighter[i] = shouldHide ? 0.0 : 1.0;
    }

    projection.attributes.alpha_highlighter.needsUpdate = true;
};
