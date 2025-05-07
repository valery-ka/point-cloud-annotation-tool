import { useEffect, useCallback, useMemo, useRef } from "react";
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
    const {
        pointCloudRefs,
        pointLabelsRef,
        pixelProjections,
        setSelectedClassIndex,
        isIntersectingMap,
    } = useEditor();
    const { selectedTool } = useTools();
    const { highlightedPoint, setHighlightedPoint } = useHoveredPoint();
    const { settings } = useSettings();

    const searchingRadius = useMemo(() => {
        return settings.editorSettings.highlighter.searchingRadius;
    }, [settings.editorSettings.highlighter.searchingRadius]);

    const isDraggingRef = useRef(false);
    const mouseDownPositionRef = useRef({ x: 0, y: 0 });

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
            const activeFrameCloud = pointCloudRefs.current[activeFrameFilePath];
            const activeFrameLabels = pointLabelsRef.current[activeFrameFilePath];
            const label = activeFrameLabels[index];

            const nearestIndices = findNearestPoints(
                { x, y, z },
                activeFrameCloud.geometry.attributes.original.array,
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

            const dx = Math.abs(screenX - mouseDownPositionRef.current?.x);
            const dy = Math.abs(screenY - mouseDownPositionRef.current?.y);
            const distance = Math.max(dx, dy);

            if (distance > 1) {
                isDraggingRef.current = true;
            }

            const activeFrameFilePath = pcdFiles[activeFrameIndex];
            const activeFrameCloud = pointCloudRefs.current[activeFrameFilePath];
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
            if (!closestPoint || !activeFrameCloud.geometry.attributes.position.array) {
                setHighlightedPoint(null);

                return;
            }

            const { index, u, v } = closestPoint;
            const positions = activeFrameCloud.geometry.attributes.position.array;

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
                    activeFrameCloud.geometry.attributes.original.array,
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
            if (
                isDraggingRef.current === true ||
                [...isIntersectingMap.current.values()].some(Boolean)
            )
                return;

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

    const onMouseDown = useCallback((event) => {
        mouseDownPositionRef.current = { x: event.layerX, y: event.layerY };
        isDraggingRef.current = false;
    }, []);

    useEffect(() => {
        gl.domElement.addEventListener("mousemove", onMouseMove);
        gl.domElement.addEventListener("mouseleave", onMouseLeave);
        gl.domElement.addEventListener("mousedown", onMouseDown);
        gl.domElement.addEventListener("click", onClick);

        return () => {
            gl.domElement.removeEventListener("mousemove", onMouseMove);
            gl.domElement.removeEventListener("mouseleave", onMouseLeave);
            gl.domElement.removeEventListener("mousedown", onMouseDown);
            gl.domElement.removeEventListener("click", onClick);
        };
    }, [onMouseMove, onMouseLeave, onClick]);
};
