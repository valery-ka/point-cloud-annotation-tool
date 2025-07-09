import { useCallback } from "react";

import { useBatch, useCuboids, useFrames, useEditor } from "contexts";
import { useCuboidInterpolation, useSaveSolution } from "hooks";

export const useBatchEditorEvents = () => {
    const { setActiveFrameIndex } = useFrames();
    const { cloudPointsColorNeedsUpdateRef } = useEditor();

    const { selectedCuboidGeometryRef, cuboidsSolutionRef, cuboidsVisibilityRef } = useCuboids();
    const {
        updateBatchCuboidRef,
        selectedCuboidBatchGeometriesRef,
        batchMode,
        setBatchMode,
        batchEditingFrameRef,
    } = useBatch();

    const { saveObjectsSolution } = useSaveSolution();
    const { saveCurrentPSRBatch, interpolatePSRBatch, updateCuboidPSRBatch, findFrameMarkers } =
        useCuboidInterpolation();

    const goToHoveredFrame = useCallback(
        (e, mesh) => {
            if (e.code === "KeyF" && mesh && batchMode) {
                const frame = mesh.userData.frame;
                setActiveFrameIndex(frame);
                setBatchMode(false);
            }
        },
        [batchMode],
    );

    const removeBatchKeyFrame = useCallback(
        ({ hoveredView, mesh }) => {
            if (batchMode && hoveredView && mesh) {
                const frame = mesh.userData.frame;
                batchEditingFrameRef.current = frame;
                saveCurrentPSRBatch({ keyFrameToRemove: frame });
                findFrameMarkers();
                interpolatePSRBatch();
                updateCuboidPSRBatch();
                updateBatchCuboidRef.current.needsUpdate = true;
            }
        },
        [batchMode, interpolatePSRBatch],
    );

    const setBatchCuboidVisibility = useCallback(
        (frame, visible) => {
            const id = selectedCuboidGeometryRef.current.name;

            const globalVisibility = cuboidsVisibilityRef.current[id].visible;
            if (!globalVisibility) return;

            const cuboid = selectedCuboidBatchGeometriesRef.current[frame];
            if (cuboid) cuboid.visible = visible;

            const solution = cuboidsSolutionRef.current;
            const frameSol = solution[frame];
            const existingEntry = frameSol?.find((e) => e.id === id);
            if (existingEntry) existingEntry.visible = visible;

            findFrameMarkers();
            saveObjectsSolution({ updateStack: false, isAutoSave: false });

            cloudPointsColorNeedsUpdateRef.current = true;
        },
        [saveObjectsSolution],
    );

    const toggleCuboidVisibility = useCallback(
        (e, mesh) => {
            if (!batchMode || !mesh) return;

            const frame = mesh.userData.frame;

            switch (e.code) {
                case "KeyZ":
                    return setBatchCuboidVisibility(frame, false);
                case "KeyX":
                    return setBatchCuboidVisibility(frame, true);
                default:
                    break;
            }
        },
        [batchMode, setBatchCuboidVisibility],
    );

    return { removeBatchKeyFrame, toggleCuboidVisibility, goToHoveredFrame };
};
