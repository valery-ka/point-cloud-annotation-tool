import { useEffect, useCallback } from "react";

import { useCuboids, useFrames, useFileManager, useBatch, useEditor, useLoading } from "contexts";
import { useCuboidInterpolation, useSaveSolution, useSubscribeFunction } from "hooks";

import { computeVisibilityFrameRange } from "utils/cuboids";

export const useCuboidsVisibility = () => {
    const { pcdFiles } = useFileManager();
    const { activeFrameIndex } = useFrames();
    const { globalIsLoading } = useLoading();
    const { cloudPointsColorNeedsUpdateRef } = useEditor();

    const { cuboids, cuboidsSolutionRef, cuboidsVisibilityRef, selectedCuboidGeometryRef } =
        useCuboids();
    const { batchMode } = useBatch();

    const { findFrameMarkers } = useCuboidInterpolation();
    const { saveObjectsSolution } = useSaveSolution();

    const toggleVisibility = useCallback(() => {
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
        saveObjectsSolution({ updateStack: true, isAutoSave: false, id: id });

        cloudPointsColorNeedsUpdateRef.current = true;
    }, [pcdFiles, activeFrameIndex, batchMode, saveObjectsSolution]);

    useSubscribeFunction("toggleCuboidVisibility", toggleVisibility, []);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Delete") {
                toggleVisibility();
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [toggleVisibility]);

    useEffect(() => {
        if (globalIsLoading || !pcdFiles.length) return;

        const currentCuboidIds = new Set(cuboids.map(({ id }) => id));

        Object.keys(cuboidsVisibilityRef.current).forEach((id) => {
            if (!currentCuboidIds.has(id)) {
                delete cuboidsVisibilityRef.current[id];
            }
        });

        cuboids.forEach(({ id }) => {
            if (!(id in cuboidsVisibilityRef.current)) {
                cuboidsVisibilityRef.current[id] = {
                    hide: false,
                    show: false,
                    visible: true,
                };
            }
        });
    }, [globalIsLoading, cuboids, pcdFiles]);
};
