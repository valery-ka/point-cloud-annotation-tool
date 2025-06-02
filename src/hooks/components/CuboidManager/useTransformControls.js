import { useThree } from "@react-three/fiber";

import { useCallback, useEffect } from "react";

import { useEditor, useCuboids, useFrames } from "contexts";
import { useCuboidInterpolation, useDebouncedCallback } from "hooks";

import { TransformControls } from "utils/cuboids";

const REQUEST_INTERPOLATE_PSR_TIME = 50;

export const useTransformControls = () => {
    const { gl, camera, scene } = useThree();

    const { activeFrameIndex } = useFrames();
    const { cameraControlsRef, transformControlsRef } = useEditor();
    const { sideViewsCamerasNeedUpdateRef, isCuboidTransformingRef } = useCuboids();
    const { batchMode, batchViewsCamerasNeedUpdateRef } = useCuboids();

    const { saveCurrentPSR, interpolatePSR, findFrameMarkers } = useCuboidInterpolation();
    const { saveCurrentPSRBatch, interpolatePSRBatch, updateCuboidPSRBatch } =
        useCuboidInterpolation();

    const debouncedInterpolatePSRSingle = useDebouncedCallback(() => {
        saveCurrentPSR({ activeFrameIndex: activeFrameIndex });
        findFrameMarkers();
        interpolatePSR();
        console.log("single finished");
    }, REQUEST_INTERPOLATE_PSR_TIME);

    const debouncedInterpolatePSRBatch = useDebouncedCallback(() => {
        saveCurrentPSRBatch();
        findFrameMarkers();
        interpolatePSRBatch();
        updateCuboidPSRBatch();
        console.log("batch finished");
    }, REQUEST_INTERPOLATE_PSR_TIME);

    const onTransformChange = useCallback(() => {
        sideViewsCamerasNeedUpdateRef.current = true;
        batchViewsCamerasNeedUpdateRef.current = true;
    }, []);

    const onTransformFinished = useCallback(() => {
        batchMode ? debouncedInterpolatePSRBatch() : debouncedInterpolatePSRSingle();
    }, [activeFrameIndex, batchMode, interpolatePSR]);

    const onDraggingChanged = useCallback(
        (event) => {
            isCuboidTransformingRef.current = event.value;
            cameraControlsRef.current.enabled = !event.value;
            if (!event.value) onTransformFinished();
        },
        [onTransformFinished],
    );

    useEffect(() => {
        const transformControls = new TransformControls(camera, gl.domElement);
        transformControls.setSpace("local");

        transformControlsRef.current = transformControls;
        scene.add(transformControls);

        return () => {
            scene.remove(transformControls);
        };
    }, [camera, gl.domElement, scene]);

    useEffect(() => {
        const transform = transformControlsRef.current;
        transform?.addEventListener("change", onTransformChange);
        transform?.addEventListener("dragging-changed", onDraggingChanged);

        return () => {
            transform?.removeEventListener("change", onTransformChange);
            transform?.removeEventListener("dragging-changed", onDraggingChanged);
            transform?.detach();
        };
    }, [onTransformChange, onDraggingChanged]);
};
