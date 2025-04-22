import React, { useMemo, useRef } from "react";

import { useHoveredPoint, useImages, useCalibrations } from "contexts";

import { PointHighlighterCanvas } from "./PointHighlighterCanvas";

const CROP_SIZE = 200;

export const PointHighlighter = () => {
    const { highlightedPoint } = useHoveredPoint();
    const { activeFrameImagesPath } = useImages();
    const { projectedPointsRef } = useCalibrations();

    const highlightedPointRef = useRef(highlightedPoint);

    const { image, indicesToPositions } = useMemo(() => {
        if (!highlightedPoint || !activeFrameImagesPath?.length) return {};
        highlightedPointRef.current = highlightedPoint;

        for (const { image } of activeFrameImagesPath) {
            const projected = projectedPointsRef.current?.[image.src];
            if (projected && projected.indexToPositionMap.has(highlightedPoint.index)) {
                return {
                    image,
                    indicesToPositions: projected.indexToPositionMap,
                };
            }
        }
        return {};
    }, [highlightedPoint, activeFrameImagesPath]);

    return (
        <div
            className={`point-highlighter-wrapper ${!image ? "hidden" : ""}`}
            style={{
                width: `${CROP_SIZE}px`,
                height: `${CROP_SIZE}px`,
            }}
        >
            <div className="vignette"></div>
            <div className="point-highlighter-image">
                <PointHighlighterCanvas
                    image={image}
                    positions={indicesToPositions}
                    point={highlightedPointRef.current}
                />
            </div>
        </div>
    );
};
