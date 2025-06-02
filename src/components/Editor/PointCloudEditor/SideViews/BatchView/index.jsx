import { createPortal } from "react-dom";
import { useEffect, useRef, useState, memo } from "react";

import { useCuboids, useFileManager } from "contexts";

import { SIDE_VIEWS_GAP } from "constants";
import { getBatchLayout } from "utils/cuboids";

import { SideViewSVG } from "../SideViewSVG";
import { BatchHeader } from "../BatchHeader";

export const BatchView = memo(() => {
    const { pcdFiles } = useFileManager();
    const { selectedCuboidBatchGeometriesRef, batchEditorCameras, batchMode } = useCuboids();

    const containerRef = useRef(null);
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

    const BATCH_CAMERAS = Object.entries(batchEditorCameras);
    const framesCount = BATCH_CAMERAS.length;
    const viewsPerFrame = BATCH_CAMERAS[0]?.[1]?.length || 0;

    const { rows, framesPerRow } = getBatchLayout(framesCount);

    const frameWidth = (containerSize.width - SIDE_VIEWS_GAP * (framesPerRow - 1)) / framesPerRow;
    const viewHeight =
        (containerSize.height - SIDE_VIEWS_GAP * (viewsPerFrame * rows - 1)) /
        (viewsPerFrame * rows);

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
        <div id="batch-view-canvas-container">
            <div className="batch-header-wrapper">
                <BatchHeader />
            </div>

            <div className="batch-canvas-wrapper" ref={containerRef}>
                <canvas id="batch-view-canvas" />
                <div
                    className="side-views-container"
                    style={{ position: "absolute", top: 0, left: 0 }}
                >
                    {BATCH_CAMERAS.map(([frameKey, views], frameIdx) =>
                        views.map((view, viewIdx) => {
                            const frame = view.frame;
                            const mesh = selectedCuboidBatchGeometriesRef.current?.[frame];
                            if (!mesh) return null;

                            const row = rows === 2 && frameIdx >= framesPerRow ? 1 : 0;
                            const col = rows === 2 ? frameIdx % framesPerRow : frameIdx;

                            const x = col * (frameWidth + SIDE_VIEWS_GAP);
                            const rowOffset = row * (viewsPerFrame * (viewHeight + SIDE_VIEWS_GAP));
                            const y = viewIdx * (viewHeight + SIDE_VIEWS_GAP) + rowOffset;

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
});
