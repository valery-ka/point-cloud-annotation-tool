import { useState, useCallback } from "react";

import { useSideViews } from "contexts";
import { useSideViewsControls } from "hooks";

import { rgbToHex } from "utils/editor";
import { projectToScreen, getCornerCursor, getEdgeStyles, isHovered } from "utils/cuboids";

const PICKER_COLOR = "#ffffff";
const PICKER_WIDTH = 30;
const PICKER_OPACITY = 0;

export const SideViewSVG = ({ name, y, width, height, mesh, camera }) => {
    const { selectedCuboidRef, handlePositions } = useSideViews();
    const { corners = [], edges = [] } = handlePositions?.[name] ?? {};

    const [hoveredHandler, setHoveredHandler] = useState(null);
    const [hoveredView, setHoveredView] = useState(null);

    useSideViewsControls({ camera, mesh, hoveredView, hoveredHandler, name });

    const project = useCallback(
        (pos3d) => projectToScreen(pos3d, camera, width, height),
        [camera, width, height],
    );

    const renderCornersHandlers = useCallback(
        (pos3d, index) => {
            const pos2d = project(pos3d);

            const projectedCorners = corners.map(project);
            const cursor = getCornerCursor(index, projectedCorners);

            return (
                <>
                    <circle
                        key={`corner-${index}`}
                        cx={pos2d.x}
                        cy={pos2d.y}
                        r={PICKER_WIDTH / 2}
                        fill={PICKER_COLOR}
                        fillOpacity={PICKER_OPACITY}
                        style={{ cursor }}
                        onMouseEnter={() => setHoveredHandler({ type: "corner", index })}
                        onMouseLeave={() => setHoveredHandler(null)}
                    />
                    {isHovered(hoveredHandler, "corner", index) && (
                        <>
                            <line
                                key={`corner-line-vertical-${index}`}
                                className="svg-line hovered"
                                x1={pos2d.x}
                                y1={0}
                                x2={pos2d.x}
                                y2={height}
                            />
                            <line
                                key={`corner-line-horizontal-${index}`}
                                className="svg-line hovered"
                                x1={0}
                                y1={pos2d.y}
                                x2={width}
                                y2={pos2d.y}
                            />
                        </>
                    )}
                </>
            );
        },
        [project, corners, hoveredHandler],
    );

    const renderEdgesHandlers = useCallback(
        (pos3d, index) => {
            const pos2d = project(pos3d);
            const prev = project(corners[index]);
            const next = project(corners[(index + 1) % corners.length]);
            const isVertical = Math.abs(next.y - prev.y) > Math.abs(next.x - prev.x);
            const { picker, line } = getEdgeStyles(isVertical, pos2d, width, height, PICKER_WIDTH);

            return (
                <>
                    <rect
                        key={`edge-picker-${index}`}
                        {...picker}
                        fill={PICKER_COLOR}
                        fillOpacity={PICKER_OPACITY}
                        onMouseEnter={() => setHoveredHandler({ type: "edge", index })}
                        onMouseLeave={() => setHoveredHandler(null)}
                    />
                    <line
                        key={`edge-line-${index}`}
                        className={`svg-line ${hoveredHandler?.index === index ? "hovered" : ""}`}
                        {...line}
                    />
                </>
            );
        },
        [project, hoveredHandler, corners],
    );

    const renderRotationHandler = useCallback(() => {
        if (corners.length !== 4) return null;

        const projected = corners.map(project);
        const centerX = (projected[0].x + projected[2].x) / 2;

        return (
            <>
                <rect
                    key="center-vertical-picker"
                    x={centerX - PICKER_WIDTH / 2}
                    y={0}
                    width={PICKER_WIDTH}
                    height={height}
                    fill={PICKER_COLOR}
                    fillOpacity={PICKER_OPACITY}
                    style={{ cursor: "col-resize" }}
                    onMouseEnter={() => setHoveredHandler({ type: "rotation", index: null })}
                    onMouseLeave={() => setHoveredHandler(null)}
                />

                <line
                    key="center-vertical-line"
                    className={`svg-line ${hoveredHandler?.type === "rotation" ? "hovered" : ""}`}
                    x1={centerX}
                    y1={0}
                    x2={centerX}
                    y2={height}
                />
            </>
        );
    }, [project, hoveredHandler, corners]);

    const renderBoxOutline = useCallback(() => {
        if (!corners.length) return null;

        const projectedCorners = corners.map(project);

        const color = rgbToHex(selectedCuboidRef.current.material.color);

        return edges.map((_, index) => {
            const start = projectedCorners[index];
            const end = projectedCorners[(index + 1) % projectedCorners.length];

            return (
                <line
                    key={`hovered-line-${index}`}
                    x1={start.x}
                    y1={start.y}
                    x2={end.x}
                    y2={end.y}
                    stroke={color}
                    strokeWidth={1}
                    pointerEvents="none"
                />
            );
        });
    }, [corners]);

    if (!mesh || !camera) return null;

    return (
        <svg
            width={width}
            height={height}
            className={`side-view-svg ${hoveredView === name ? "hovered" : ""}`}
            style={{
                position: "absolute",
                left: 0,
                top: y,
                cursor: "move",
            }}
            onMouseEnter={() => setHoveredView(name)}
            onMouseLeave={() => setHoveredView(null)}
        >
            <text x="10" y="20" fill={PICKER_COLOR} fontSize="14">
                {name}
            </text>

            {renderBoxOutline()}
            {edges.map(renderEdgesHandlers)}
            {renderRotationHandler()}
            {corners.map(renderCornersHandlers)}
        </svg>
    );
};
