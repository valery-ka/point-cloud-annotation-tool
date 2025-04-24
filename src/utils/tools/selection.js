import { MODES } from "tools";
import { calculateBoundingRectangle, pointInPolyRaycast } from "./polygon.js";

export const selectByPolygon = (
    positions,
    pixelProjections,
    labels,
    classIndex,
    selection,
    depthZ,
    polygon,
) => {
    const projections = updatePolygonProjections(
        positions,
        pixelProjections,
        labels,
        classIndex,
        selection,
        depthZ,
        polygon,
    );

    const inside = [];

    for (let i = 0; i < projections.length; i += 3) {
        const idx = projections[i];
        const pixelX = projections[i + 1];
        const pixelY = projections[i + 2];

        if (pointInPolyRaycast([pixelX, pixelY], polygon)) {
            inside.push(idx);
        }
    }

    return inside;
};

const updatePolygonProjections = (
    positions,
    pixelProjections,
    labels,
    classIndex,
    selection,
    depthZ,
    polygon,
) => {
    const { minX, minY, maxX, maxY } = calculateBoundingRectangle(polygon);

    const result = [];

    for (let i = 0; i < pixelProjections.length; i += 3) {
        const idx = pixelProjections[i];
        const pixelX = pixelProjections[i + 1];
        const pixelY = pixelProjections[i + 2];

        const shouldProcess =
            MODES[selection.selectionMode]?.shouldProcess?.(
                labels,
                idx,
                classIndex,
                positions,
                selection,
                depthZ,
            ) ?? false;

        if (!shouldProcess) continue;
        if (pixelX < minX || pixelX > maxX || pixelY < minY || pixelY > maxY) continue;

        result.push(idx, pixelX, pixelY);
    }

    return result;
};
