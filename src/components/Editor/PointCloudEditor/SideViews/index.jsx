import { useEffect, useRef, useState, memo } from "react";

import { useCuboids } from "contexts";

import { SIDE_VIEWS_GAP } from "constants";

import { SideViewSVG } from "./SideViewSVG";

export const SideViews = memo(() => {
    const { selectedCuboidGeometryRef, sideViews } = useCuboids();

    const containerRef = useRef(null);
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

    const VIEW_NAMES = sideViews.map((view) => view.name);
    const viewCount = VIEW_NAMES.length;
    const viewHeight = (containerSize.height - SIDE_VIEWS_GAP * (viewCount - 1)) / viewCount;

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const resizeObserver = new ResizeObserver((entries) => {
            for (let entry of entries) {
                const { width, height } = entry.contentRect;
                setContainerSize({ width, height });
            }
        });

        resizeObserver.observe(container);

        return () => resizeObserver.disconnect();
    }, []);

    return (
        <div id="side-views-canvas-container" ref={containerRef}>
            <canvas id="side-views-canvas" />
            <div className="side-views-container">
                {VIEW_NAMES.map((name, idx) => {
                    const y = idx * (viewHeight + SIDE_VIEWS_GAP);
                    const view = sideViews.find((v) => v.name === name);

                    return (
                        <SideViewSVG
                            key={name}
                            name={name}
                            y={y}
                            width={containerSize.width}
                            height={viewHeight}
                            mesh={selectedCuboidGeometryRef.current}
                            camera={view?.camera}
                        />
                    );
                })}
            </div>
        </div>
    );
});
