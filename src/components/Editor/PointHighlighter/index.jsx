import React, { useMemo } from "react";
import { useHoveredPoint, useImages, useCalibrations, useSettings } from "contexts";

import { chooseBestCamera } from "utils/calibrations";

import { PointHighlighterCanvas } from "./PointHighlighterCanvas";

export const PointHighlighter = () => {
    const { highlightedPoint } = useHoveredPoint();
    const { activeFrameImagesPath } = useImages();
    const { projectedPointsRef } = useCalibrations();
    const { settings } = useSettings();

    const { image, indicesToPositions } = useMemo(() => {
        if (!highlightedPoint || !activeFrameImagesPath?.length) return {};

        const bestCamera = chooseBestCamera(
            activeFrameImagesPath,
            projectedPointsRef.current,
            highlightedPoint,
        );

        if (bestCamera) {
            const projected = projectedPointsRef.current?.[bestCamera.src];
            return {
                image: bestCamera,
                indicesToPositions: projected.indexToPositionMap,
            };
        }

        return {};
    }, [highlightedPoint, activeFrameImagesPath]);

    const highlighterSize = useMemo(() => {
        return settings.editorSettings.highlighter.highlighterSize;
    }, [settings.editorSettings.highlighter.highlighterSize]);

    const isEnabled = useMemo(() => {
        return settings.editorSettings.highlighter.enabled;
    }, [settings.editorSettings.highlighter.enabled]);

    if (!isEnabled) return null;

    return (
        <div
            className={`point-highlighter-wrapper ${!image ? "hidden" : ""}`}
            style={{
                width: `${highlighterSize}px`,
                height: `${highlighterSize}px`,
            }}
        >
            <div className="vignette"></div>
            <div className="point-highlighter-image">
                <PointHighlighterCanvas image={image} positions={indicesToPositions} />
            </div>
        </div>
    );
};
