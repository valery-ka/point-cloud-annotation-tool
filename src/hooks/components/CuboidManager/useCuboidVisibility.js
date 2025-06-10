import { useEffect } from "react";

import { useCuboids, useFrames, useFileManager, useBatch } from "contexts";
import { useCuboidInterpolation, useSaveSolution } from "hooks";

import { computeVisibilityFrameRange } from "utils/cuboids";

export const useCuboidVisibility = () => {
    const { pcdFiles } = useFileManager();
    const { activeFrameIndex } = useFrames();

    const { cuboidsSolutionRef, updateSingleCuboidRef, selectedCuboidGeometryRef } = useCuboids();
    const { batchMode } = useBatch();

    const { findFrameMarkers } = useCuboidInterpolation();
    const { saveObjectsSolution } = useSaveSolution();

    useEffect(() => {
        const toggleVisibility = () => {
            const geometry = selectedCuboidGeometryRef.current;
            if (!geometry || batchMode) return;

            const id = geometry.name;
            const newVisibility = !geometry.visible;
            geometry.visible = newVisibility;

            const solution = cuboidsSolutionRef.current;
            const totalFrames = pcdFiles.length;

            const { startFrame, endFrame } = computeVisibilityFrameRange({
                activeFrameIndex,
                id,
                cuboidsSolutionRef,
                totalFrames,
            });

            for (let frame = startFrame; frame <= endFrame; frame++) {
                if (!solution[frame]) solution[frame] = [];
                const frameSol = solution[frame];
                const existingEntry = frameSol.find((e) => e.id === id);
                existingEntry.visible = newVisibility;
            }

            findFrameMarkers();
            saveObjectsSolution({ updateStack: true, isAutoSave: false });

            updateSingleCuboidRef.current.needsUpdate = true;
        };

        const handleKeyDown = (e) => {
            if (e.key === "Delete") {
                toggleVisibility();
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [pcdFiles, activeFrameIndex, batchMode, saveObjectsSolution]);
};
