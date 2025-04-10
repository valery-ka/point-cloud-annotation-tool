import { MODES } from "tools";
import { calculateBoundingRectangle, pointInPolyRaycast } from "./polygon.js";

export function selectByPolygon(
    positions,
    pixelProjections,
    labels,
    classIndex,
    selection,
    depthZ,
    polygon,
) {
    const polygonProjections = updatePolygonProjections(
        positions,
        pixelProjections,
        labels,
        classIndex,
        selection,
        depthZ,
        polygon,
    );
    const inside = [];

    for (const projection of polygonProjections) {
        if (pointInPolyRaycast([projection.pixelX, projection.pixelY], polygon)) {
            inside.push(projection.idx);
        }
    }

    return inside;
}

function updatePolygonProjections(
    positions,
    pixelProjections,
    labels,
    classIndex,
    selection,
    depthZ,
    polygon,
) {
    const { minX, minY, maxX, maxY } = calculateBoundingRectangle(polygon);

    const polygonProjections = new Set();

    for (let i = 0; i < pixelProjections.length; i += 3) {
        const idx = pixelProjections[i];
        const pixelX = pixelProjections[i + 1];
        const pixelY = pixelProjections[i + 2];

        if (
            !(
                MODES[selection.selectionMode]?.shouldProcess?.(
                    labels,
                    idx,
                    classIndex,
                    positions,
                    selection,
                    depthZ,
                ) ?? false
            )
        ) {
            continue;
        }

        if (pixelX < minX || pixelX > maxX || pixelY < minY || pixelY > maxY) {
            continue;
        }

        polygonProjections.add({ idx, pixelX, pixelY });
    }

    return polygonProjections;
}
