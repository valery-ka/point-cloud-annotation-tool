import { useEffect, useCallback, useMemo } from "react";
import { useThree } from "@react-three/fiber";

import {
    useEditor,
    useHoveredPoint,
    useFrames,
    useFileManager,
    useConfig,
    useTools,
    useSettings,
} from "contexts";

import { findNearestPoints } from "utils/editor";
import * as APP_CONSTANTS from "constants";

const { DEFAULT_TOOL, HIDDEN_POINT } = APP_CONSTANTS;

export const useHighlightedPoint = () => {
    const { gl } = useThree();

    const { pcdFiles } = useFileManager();
    const { activeFrameIndex } = useFrames();
    const { nonHiddenClasses } = useConfig();
    const { activeFramePositionsRef, pointLabelsRef, pixelProjections, setSelectedClassIndex } =
        useEditor();
    const { selectedTool } = useTools();
    const { highlightedPoint, setHighlightedPoint } = useHoveredPoint();
    const { settings } = useSettings();

    const searchingRadius = useMemo(() => {
        return settings.editorSettings.highlighter.searchingRadius;
    }, [settings.editorSettings.highlighter.searchingRadius]);

    useEffect(() => {
        if (!highlightedPoint) {
            gl.domElement.classList.remove("pointer-cursor");
        } else {
            gl.domElement.classList.add("pointer-cursor");
        }
    }, [highlightedPoint]);

    useEffect(() => {
        if (highlightedPoint) {
            const { x, y, z, index, u, v } = highlightedPoint;
            const activeFrameFilePath = pcdFiles[activeFrameIndex];
            const activeFrameLabels = pointLabelsRef.current[activeFrameFilePath];
            const label = activeFrameLabels[index];

            const nearestIndices = findNearestPoints(
                { x, y, z },
                activeFramePositionsRef,
                searchingRadius,
            );

            setHighlightedPoint({
                index,
                nearestIndices,
                label,
                x,
                y,
                z,
                u,
                v,
            });
        }
    }, [searchingRadius]);

    const onMouseMove = useCallback(
        (event) => {
            const { layerX: screenX, layerY: screenY } = event;

            const activeFrameFilePath = pcdFiles[activeFrameIndex];
            const activeFrameLabels = pointLabelsRef.current[activeFrameFilePath];

            let closestPoint = null;
            let minDistance = 15; // distance to process in pixels

            // find closest point to the mouse
            for (let i = 0; i < pixelProjections.length; i += 3) {
                const index = pixelProjections[i];
                const x = pixelProjections[i + 1];
                const y = pixelProjections[i + 2];

                const distance = Math.sqrt(Math.pow(x - screenX, 2) + Math.pow(y - screenY, 2));

                if (distance < minDistance) {
                    minDistance = distance;
                    closestPoint = { index, u: x, v: y };
                }
            }

            // setting highlighted point index and 3d coordinates
            if (!closestPoint || !activeFramePositionsRef.current) {
                setHighlightedPoint(null);

                return;
            }

            const { index, u, v } = closestPoint;
            const positions = activeFramePositionsRef.current;

            if (index * 3 + 2 >= positions.length) {
                setHighlightedPoint(null);
                return;
            }

            const [x, y, z] = positions.slice(index * 3, index * 3 + 3);

            if (Math.abs(x) >= HIDDEN_POINT) {
                setHighlightedPoint(null);
                return;
            }

            if (highlightedPoint?.index !== index) {
                const label = activeFrameLabels[index];
                const nearestIndices = findNearestPoints(
                    { x, y, z },
                    activeFramePositionsRef,
                    searchingRadius,
                );
                setHighlightedPoint({
                    index,
                    nearestIndices,
                    label,
                    x,
                    y,
                    z,
                    u,
                    v,
                });
            }
        },
        [pcdFiles, activeFrameIndex, pixelProjections, highlightedPoint],
    );

    useEffect(() => {
        setHighlightedPoint(null);
    }, [activeFrameIndex]);

    const onMouseLeave = useCallback((event) => {
        setHighlightedPoint(null);
    }, []);

    const onClick = useCallback(
        (event) => {
            if (highlightedPoint && selectedTool === DEFAULT_TOOL && !event.ctrlKey) {
                const index = highlightedPoint.label
                    ? nonHiddenClasses.findIndex(
                          (item) => item && item.originalIndex === highlightedPoint.label,
                      )
                    : null;

                const validIndex = index === -1 ? null : index;
                setSelectedClassIndex(validIndex);
            }
        },
        [highlightedPoint, selectedTool, nonHiddenClasses],
    );

    useEffect(() => {
        gl.domElement.addEventListener("mousemove", onMouseMove);
        gl.domElement.addEventListener("mouseleave", onMouseLeave);
        gl.domElement.addEventListener("click", onClick);

        return () => {
            gl.domElement.removeEventListener("mousemove", onMouseMove);
            gl.domElement.removeEventListener("mouseleave", onMouseLeave);
            gl.domElement.removeEventListener("click", onClick);
        };
    }, [onMouseMove, onMouseLeave, onClick]);
};
