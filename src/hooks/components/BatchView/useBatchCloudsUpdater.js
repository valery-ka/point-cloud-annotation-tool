import { useEffect } from "react";

import { useBatch, useFileManager, useFrames } from "contexts";

export const useBatchCloudsUpdater = ({ handlers }) => {
    const { pcdFiles } = useFileManager();
    const { activeFrameIndex } = useFrames();
    const { batchMode, currentFrame, setCurrentFrame, viewsCount, setViewsCount } = useBatch();

    useEffect(() => {
        const { filterFramePoints, handlePointCloudColors, handlePointsSize } = handlers;

        for (let frame = currentFrame[0]; frame < currentFrame[1] + 1; frame++) {
            filterFramePoints(frame);
            handlePointCloudColors(null, frame);
            handlePointsSize(null, null, frame);
        }
    }, [batchMode, currentFrame]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!batchMode) return;

            setCurrentFrame((prev) => {
                const total = pcdFiles.length;
                const maxViews = Math.min(viewsCount, total);

                if (e.key === "1") {
                    const newStart = Math.max(0, prev[0] - maxViews);
                    const newEnd = newStart + maxViews - 1;

                    if (newStart === prev[0] && newEnd === prev[1]) return prev;
                    return [newStart, newEnd];
                }

                if (e.key === "2") {
                    const newEnd = Math.min(total - 1, prev[1] + maxViews);
                    const newStart = Math.max(0, newEnd - maxViews + 1);

                    if (newStart === prev[0] && newEnd === prev[1]) return prev;
                    return [newStart, newEnd];
                }

                return prev;
            });
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [batchMode, pcdFiles.length, viewsCount]);

    useEffect(() => {
        if (pcdFiles.length === 0) return;

        const clampedViews = Math.max(1, Math.min(viewsCount, pcdFiles.length));
        if (clampedViews !== viewsCount) {
            setViewsCount(clampedViews);
            return;
        }

        setCurrentFrame([0, clampedViews - 1]);
    }, [viewsCount, pcdFiles]);

    useEffect(() => {
        if (batchMode && pcdFiles.length > 0) {
            const clampedViews = Math.max(1, Math.min(viewsCount, pcdFiles.length));
            const startFrame = Math.min(activeFrameIndex, pcdFiles.length - clampedViews);
            const endFrame = Math.min(startFrame + clampedViews - 1, pcdFiles.length - 1);

            setCurrentFrame([startFrame, endFrame]);
        }
    }, [batchMode]);
};
