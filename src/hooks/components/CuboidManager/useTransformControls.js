import { useThree } from "@react-three/fiber";

import { useCallback, useEffect } from "react";

import { useEditor, useCuboids, useFrames, useBatch } from "contexts";
import { useCuboidInterpolation, useDebouncedCallback } from "hooks";

import { TransformControls } from "utils/cuboids";

const REQUEST_INTERPOLATE_PSR_TIME = 50;

export const useTransformControls = () => {
    const { gl, camera, scene } = useThree();

    const { activeFrameIndex } = useFrames();
    const { cameraControlsRef, transformControlsRef } = useEditor();

    const {
        transformMode,
        sideViewsCamerasNeedUpdateRef,
        isCuboidTransformingRef,
        updateSingleCuboidRef,
        selectedCuboidGeometryRef,
        updateProjectedCuboidsRef,
    } = useCuboids();
    const {
        batchMode,
        batchViewsCamerasNeedUpdateRef,
        updateBatchCuboidRef,
        batchEditingFrameRef,
    } = useBatch();

    const { saveCurrentPSR, interpolatePSR, findFrameMarkers } = useCuboidInterpolation();
    const { saveCurrentPSRBatch, interpolatePSRBatch, updateCuboidPSRBatch } =
        useCuboidInterpolation();

    const debouncedInterpolatePSRSingle = useDebouncedCallback(() => {
        saveCurrentPSR({ frame: activeFrameIndex });
        findFrameMarkers();
        interpolatePSR();
        updateSingleCuboidRef.current.needsUpdate = true;
        updateProjectedCuboidsRef.current = true;
    }, REQUEST_INTERPOLATE_PSR_TIME);

    const debouncedInterpolatePSRBatch = useDebouncedCallback(() => {
        saveCurrentPSRBatch();
        findFrameMarkers();
        interpolatePSRBatch();
        updateCuboidPSRBatch();
        updateBatchCuboidRef.current.needsUpdate = true;
        updateProjectedCuboidsRef.current = true;
    }, REQUEST_INTERPOLATE_PSR_TIME);

    const onTransformChange = useCallback(() => {
        updateSingleCuboidRef.current.frame = activeFrameIndex;
        updateSingleCuboidRef.current.needsUpdate = true;
        sideViewsCamerasNeedUpdateRef.current = true;

        updateBatchCuboidRef.current.frame = batchEditingFrameRef.current;
        updateBatchCuboidRef.current.needsUpdate = true;
        batchViewsCamerasNeedUpdateRef.current = true;
    }, [activeFrameIndex]);

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
        };
    }, [onTransformChange, onDraggingChanged]);

    useEffect(() => {
        const transform = transformControlsRef.current;
        const object = selectedCuboidGeometryRef.current;

        transform.attach(object);

        switch (transformMode) {
            case "transformTranslate":
                transform.setMode("translate");
                break;
            case "transformRotate":
                transform.setMode("rotate");
                break;
            case "transformScale":
                transform.setMode("scale");
                break;
            default:
                transform.detach();
                break;
        }
    }, [transformMode]);
};
