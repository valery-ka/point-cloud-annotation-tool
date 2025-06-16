import { useState, useCallback, useEffect, Fragment, memo } from "react";

import { useBatch, useCuboids } from "contexts";
import { useSideViewsControls, useDelayedHover } from "hooks";

import { SVGText } from "components";

import {
    projectToScreen,
    getCornerCursor,
    getEdgeStyles,
    getEdgeDirection,
    getCornerDirection,
    isHovered,
} from "utils/cuboids";

const PICKER_COLOR = "#ffffff";
const PICKER_WIDTH = 30;
const PICKER_OPACITY = 0;

export const SideViewSVG = memo(
    ({ name, x, y, width, height, mesh, camera, fileName = null, keyFrame = null }) => {
        const { selectedCuboid, handlePositions } = useCuboids();
        const { batchHandlePositions, batchMode } = useBatch();

        const frame = mesh?.userData?.frame;

        const currentViewHandles = batchMode
            ? batchHandlePositions?.[frame]?.[name]
            : handlePositions?.[name];

        const { corners = [], edges = [] } = currentViewHandles ?? {};

        const [hoveredHandler, setHoveredHandler] = useState(null);
        const [hoveredView, setHoveredView] = useState(null);

        const { handleMouseEnter, handleMouseLeave } = useDelayedHover({
            setState: setHoveredView,
            delay: 10,
        });

        useSideViewsControls({ camera, mesh, hoveredView, hoveredHandler, name });

        const project = useCallback(
            (pos3d) => {
                if (!pos3d || !camera || !width || !height || width <= 0 || height <= 0) {
                    return { x: 0, y: 0 };
                }
                return projectToScreen(pos3d, camera, width, height);
            },
            [camera, width, height],
        );

        const renderCornersHandlers = useCallback(
            (pos3d, index) => {
                if (!pos3d) return null;

                const pos2d = project(pos3d);
                if (isNaN(pos2d.x) || isNaN(pos2d.y)) return null;

                const direction = getCornerDirection(index, corners, project);
                const projectedCorners = corners.map(project);
                const cursor = getCornerCursor(index, projectedCorners);

                return (
                    <Fragment key={`corner-${index}`}>
                        <circle
                            cx={Math.max(0, pos2d.x)}
                            cy={Math.max(0, pos2d.y)}
                            r={PICKER_WIDTH / 2}
                            fill={PICKER_COLOR}
                            fillOpacity={PICKER_OPACITY}
                            style={{ cursor }}
                            onMouseEnter={() =>
                                setHoveredHandler({ type: "corner", index, direction })
                            }
                            onMouseLeave={() => setHoveredHandler(null)}
                        />
                        {isHovered(hoveredHandler, "corner", index) && (
                            <>
                                <line
                                    className="svg-line hovered"
                                    x1={Math.max(0, pos2d.x)}
                                    y1={0}
                                    x2={Math.max(0, pos2d.x)}
                                    y2={Math.max(0, height)}
                                />
                                <line
                                    className="svg-line hovered"
                                    x1={0}
                                    y1={Math.max(0, pos2d.y)}
                                    x2={Math.max(0, width)}
                                    y2={Math.max(0, pos2d.y)}
                                />
                            </>
                        )}
                    </Fragment>
                );
            },
            [project, corners, hoveredHandler, width, height],
        );

        const renderEdgesHandlers = useCallback(
            (pos3d, index) => {
                if (!pos3d || !corners[index]) return null;

                const pos2d = project(pos3d);
                const prev = project(corners[index]);
                const next = project(corners[(index + 1) % corners.length]);

                if ([pos2d.x, pos2d.y, prev.x, prev.y, next.x, next.y].some(isNaN)) {
                    return null;
                }

                const isVertical = Math.abs(next.y - prev.y) > Math.abs(next.x - prev.x);
                const { picker, line } = getEdgeStyles(
                    isVertical,
                    pos2d,
                    width,
                    height,
                    PICKER_WIDTH,
                );

                if (picker.height < 0 || picker.width < 0) return null;

                const corners2d = corners.map(project);
                const direction = getEdgeDirection(pos2d, isVertical, corners2d);

                return (
                    <Fragment key={`edge-${index}`}>
                        <rect
                            {...picker}
                            width={Math.max(0, picker.width)}
                            height={Math.max(0, picker.height)}
                            fill={PICKER_COLOR}
                            fillOpacity={PICKER_OPACITY}
                            onMouseEnter={() =>
                                setHoveredHandler({ type: "edge", index, direction })
                            }
                            onMouseLeave={() => setHoveredHandler(null)}
                        />
                        <line
                            className={`svg-line ${hoveredHandler?.index === index ? "hovered" : ""}`}
                            {...line}
                            x1={Math.max(0, line.x1)}
                            x2={Math.max(0, line.x2)}
                            y1={Math.max(0, line.y1)}
                            y2={Math.max(0, line.y2)}
                        />
                    </Fragment>
                );
            },
            [project, hoveredHandler, corners, width, height],
        );

        const renderRotationHandler = useCallback(() => {
            if (corners.length !== 4) return null;

            const projected = corners.map(project);
            if (projected.some((p) => isNaN(p.x) || isNaN(p.y))) return null;

            const centerX = (projected[0].x + projected[2].x) / 2;
            const handlerHeight = Math.max(0, height / 2);

            return (
                <>
                    <rect
                        x={Math.max(0, centerX - PICKER_WIDTH / 2)}
                        y={0}
                        width={Math.max(0, PICKER_WIDTH)}
                        height={Math.max(0, handlerHeight)}
                        fill={PICKER_COLOR}
                        fillOpacity={PICKER_OPACITY}
                        style={{ cursor: "col-resize" }}
                        onMouseEnter={() => setHoveredHandler({ type: "rotation", index: null })}
                        onMouseLeave={() => setHoveredHandler(null)}
                    />

                    <line
                        className={`svg-line ${hoveredHandler?.type === "rotation" ? "hovered" : ""}`}
                        x1={Math.max(0, centerX)}
                        y1={0}
                        x2={Math.max(0, centerX)}
                        y2={Math.max(0, handlerHeight)}
                    />
                </>
            );
        }, [project, hoveredHandler, corners, height]);

        useEffect(() => {
            const delay = 50;
            setTimeout(() => {
                setHoveredView(null);
                setHoveredHandler(null);
            }, delay);
        }, [selectedCuboid, batchMode]);

        if (!mesh || !camera || width <= 0 || height <= 0) return null;

        return (
            <svg
                width={Math.max(0, width)}
                height={Math.max(0, height)}
                className={`side-view-svg ${hoveredView === name ? "hovered" : ""}`}
                style={{
                    position: "absolute",
                    left: x || 0,
                    top: y,
                    cursor: "move",
                }}
                onMouseMove={() => handleMouseEnter(name)}
                onMouseEnter={() => handleMouseEnter(name)}
                onMouseLeave={() => handleMouseLeave(null)}
            >
                <SVGText
                    text={fileName ?? name}
                    position={"top-left"}
                    parentWidth={width}
                    parentHeight={height}
                />
                {keyFrame && (
                    <SVGText
                        text={"key"}
                        position={"top-right"}
                        parentWidth={width}
                        parentHeight={height}
                    />
                )}
                {mesh.visible && (
                    <>
                        {edges.map(renderEdgesHandlers)}
                        {renderRotationHandler()}
                        {corners.map(renderCornersHandlers)}
                    </>
                )}
            </svg>
        );
    },
);
