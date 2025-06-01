import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";

import { useCuboids, useFileManager } from "contexts";

import { SIDE_VIEWS_GAP } from "constants";

import { SideViewSVG } from "../SideViewSVG";
import { BatchHeader } from "../BatchHeader";

export const BatchView = () => {
    const { pcdFiles } = useFileManager();
    const { selectedCuboidBatchGeometriesRef, batchEditorCameras, batchMode } = useCuboids();

    const containerRef = useRef(null);
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

    const frameEntries = Object.entries(batchEditorCameras);
    const framesCount = frameEntries.length;
    const viewsPerFrame = frameEntries[0]?.[1]?.length || 0;

    const frameWidth = (containerSize.width - SIDE_VIEWS_GAP * (framesCount - 1)) / framesCount;
    const viewHeight =
        (containerSize.height - SIDE_VIEWS_GAP * (viewsPerFrame - 1)) / viewsPerFrame;

    useEffect(() => {
        if (!batchMode) return;

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
    }, [batchMode]);

    return createPortal(
        <div id="batch-view-canvas-container" ref={containerRef}>
            <div className="batch-header-wrapper">
                <BatchHeader />
            </div>
            <div className="batch-canvas-wrapper">
                <canvas id="batch-view-canvas" />
                <div
                    className="side-views-container"
                    style={{ position: "absolute", top: 0, left: 0 }}
                >
                    {frameEntries.map(([frameKey, views], frameIdx) =>
                        views.map((view, viewIdx) => {
                            const frame = view.frame;
                            const mesh = selectedCuboidBatchGeometriesRef.current?.[frame];
                            if (!mesh) return null;

                            const x = frameIdx * (frameWidth + SIDE_VIEWS_GAP);
                            const y = viewIdx * (viewHeight + SIDE_VIEWS_GAP);

                            const name = pcdFiles[frame].split("/").pop().replace(".pcd", "");

                            return (
                                <SideViewSVG
                                    key={`${frameKey}-${view.name}`}
                                    name={view.name}
                                    x={x}
                                    y={y}
                                    width={frameWidth}
                                    height={viewHeight}
                                    mesh={mesh}
                                    camera={view.camera}
                                    outline={true}
                                    fileName={name}
                                />
                            );
                        }),
                    )}
                </div>
            </div>
        </div>,
        document.getElementById("root"),
    );
};
