import { useCallback } from "react";

import { useFrames, useCuboids } from "contexts";
import { useSubscribeFunction, useCuboidInterpolation, useSaveSolution } from "hooks";

import { computeRelativePSRs, applyRelativePSRsToTarget } from "utils/cuboids";

export const useWorldShifting = () => {
    const { activeFrameIndex } = useFrames();
    const { selectedCuboid, copiedPSRRef, cuboidsSolutionRef, updateSingleCuboidRef } =
        useCuboids();
    const { findFrameMarkers, updateCuboidPSR } = useCuboidInterpolation();
    const { saveObjectsSolution } = useSaveSolution();

    const copyCuboidId = useCallback(() => {
        if (!selectedCuboid?.id) return;
        copiedPSRRef.current = { cuboidId: selectedCuboid.id };
    }, [selectedCuboid?.id]);

    useSubscribeFunction("copyPsrId", copyCuboidId, []);

    const applyCuboidRelativePSR = useCallback(() => {
        const sourceId = copiedPSRRef.current?.cuboidId;
        const targetId = selectedCuboid?.id;
        if (!sourceId || !targetId) return;

        const relativePSRs = computeRelativePSRs(
            cuboidsSolutionRef.current,
            activeFrameIndex,
            sourceId,
            targetId,
        );
        if (!relativePSRs) return;

        applyRelativePSRsToTarget(cuboidsSolutionRef.current, sourceId, targetId, relativePSRs);

        updateCuboidPSR();
        findFrameMarkers();
        saveObjectsSolution({ updateStack: false, isAutoSave: false, id: null });

        updateSingleCuboidRef.current.needsUpdate = true;
    }, [activeFrameIndex, selectedCuboid?.id, saveObjectsSolution, updateCuboidPSR]);

    useSubscribeFunction("applyPsr", applyCuboidRelativePSR, []);
};
