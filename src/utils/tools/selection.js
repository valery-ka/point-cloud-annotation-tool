import { MODES } from "tools";
import { calculateBoundingRectangle, pointInPolyRaycast, pointInCircle } from "./polygon.js";

export const selectByPolygon = ({ cloudData, selectionData, polygonParams }) => {
    const { polygon } = polygonParams;
    const projections = updatePolygonProjections({ cloudData, selectionData, polygon });

    const { isBrushTool = false, brushCenter = [0, 0], brushRadius = 0 } = polygonParams ?? {};

    const inside = [];

    for (let i = 0; i < projections.length; i += 3) {
        const idx = projections[i];
        const pixelX = projections[i + 1];
        const pixelY = projections[i + 2];

        const isInside = isBrushTool
            ? pointInCircle([pixelX, pixelY], brushCenter[0], brushCenter[1], brushRadius)
            : pointInPolyRaycast([pixelX, pixelY], polygon);

        if (isInside) {
            inside.push(idx);
        }
    }

    return inside;
};

const updatePolygonProjections = ({ cloudData, selectionData, polygon }) => {
    const { pixelProjections } = cloudData;
    const { selectionMode } = selectionData;

    const { minX, minY, maxX, maxY } = calculateBoundingRectangle(polygon);

    const result = [];

    for (let i = 0; i < pixelProjections.length; i += 3) {
        const index = pixelProjections[i];
        const pixelX = pixelProjections[i + 1];
        const pixelY = pixelProjections[i + 2];

        const shouldProcess =
            MODES[selectionMode]?.shouldProcess?.({ cloudData, selectionData, index }) ?? false;

        if (!shouldProcess) continue;
        if (pixelX < minX || pixelX > maxX || pixelY < minY || pixelY > maxY) continue;

        result.push(index, pixelX, pixelY);
    }

    return result;
};
