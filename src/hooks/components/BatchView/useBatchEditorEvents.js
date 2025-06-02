import { useCallback } from "react";

import { useCuboids } from "contexts";
import { useCuboidInterpolation } from "hooks";

export const useBatchEditorEvents = () => {
    const {
        selectedCuboidGeometryRef,
        cuboidsSolutionRef,
        selectedCuboidBatchGeometriesRef,
        batchMode,
    } = useCuboids();
    const { saveCurrentPSRBatch, interpolatePSRBatch, updateCuboidPSRBatch, findFrameMarkers } =
        useCuboidInterpolation();

    const removeBatchKeyFrame = useCallback(
        ({ hoveredView, mesh }) => {
            if (batchMode && hoveredView && mesh) {
                saveCurrentPSRBatch({ keyFrameToRemove: mesh.userData.frame });
                findFrameMarkers();
                interpolatePSRBatch();
                updateCuboidPSRBatch();
            }
        },
        [batchMode, interpolatePSRBatch],
    );

    const setBatchCuboidVisibility = useCallback((frame, visible) => {
        const cuboid = selectedCuboidBatchGeometriesRef.current[frame];
        if (cuboid) cuboid.visible = visible;

        const solution = cuboidsSolutionRef.current;
        const id = selectedCuboidGeometryRef.current.name;
        const frameSol = solution[frame];
        const existingEntry = frameSol?.find((e) => e.id === id);
        if (existingEntry) existingEntry.visible = visible;

        findFrameMarkers();
    }, []);

    const toggleCuboidVisibility = useCallback(
        (e, mesh) => {
            if (!batchMode || !mesh) return;

            const frame = mesh.userData.frame;

            switch (e.code) {
                case "Delete":
                    return setBatchCuboidVisibility(frame, false);
                case "End":
                    return setBatchCuboidVisibility(frame, true);
                default:
                    break;
            }
        },
        [batchMode, setBatchCuboidVisibility],
    );

    return { removeBatchKeyFrame, toggleCuboidVisibility };
};
