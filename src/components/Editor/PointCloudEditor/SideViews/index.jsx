import { useEffect, useRef, useState } from "react";

const GAP = 2;
const VIEW_NAMES = ["top", "left", "front"]; // для теста пока так

export const SideViews = () => {
    const containerRef = useRef(null);
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

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

    const viewCount = VIEW_NAMES.length;
    const viewHeight = (containerSize.height - GAP * (viewCount - 1)) / viewCount;

    return (
        <div id="side-views-canvas-container" ref={containerRef}>
            <canvas id="side-views-canvas" />

            {VIEW_NAMES.map((name, idx) => {
                const y = idx * (viewHeight + GAP);
                return (
                    <svg
                        key={name}
                        width={containerSize.width}
                        height={viewHeight}
                        style={{
                            position: "absolute",
                            left: 0,
                            top: y,
                            pointerEvents: "none",
                        }}
                    >
                        <text x="10" y="20" fill="white" fontSize="14">{`${name}`}</text>
                    </svg>
                );
            })}
        </div>
    );
};
