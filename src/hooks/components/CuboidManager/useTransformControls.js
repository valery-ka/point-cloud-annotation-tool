import { useThree } from "@react-three/fiber";

import { useCallback, useEffect } from "react";

import { useEditor, useCuboids } from "contexts";

import { TransformControls } from "utils/cuboids";

export const useTransformControls = ({ updateCuboidsState }) => {
    const { gl, camera, scene } = useThree();

    const { cameraControlsRef, transformControlsRef } = useEditor();
    const { selectedCuboidGeometryRef, sideViewsCamerasNeedUpdateRef, isCuboidTransformingRef } =
        useCuboids();

    const onTransformChange = useCallback(() => {
        sideViewsCamerasNeedUpdateRef.current = true;
    }, []);

    const onTransformFinished = useCallback(() => {
        updateCuboidsState();
    }, [updateCuboidsState]);

    const onDraggingChanged = useCallback((event) => {
        isCuboidTransformingRef.current = event.value;
        cameraControlsRef.current.enabled = !event.value;
        if (!event.value) onTransformFinished();
    }, []);

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
        const handleKeyDown = (e) => {
            const transform = transformControlsRef.current;
            if (!transform) return;

            if (e.key === "x") {
                transform.detach();
            } else if (e.key === "w") {
                const object = selectedCuboidGeometryRef.current;
                if (object) transform.attach(object);
            } else if (e.key === "a") {
                transform.setMode("translate");
            } else if (e.key === "s") {
                transform.setMode("scale");
            } else if (e.key === "d") {
                transform.setMode("rotate");
            }
        };

        const transform = transformControlsRef.current;
        document.addEventListener("keydown", handleKeyDown);
        transform?.addEventListener("change", onTransformChange);
        transform?.addEventListener("dragging-changed", onDraggingChanged);

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            transform?.removeEventListener("change", onTransformChange);
            transform?.removeEventListener("dragging-changed", onDraggingChanged);
            transform?.detach();
        };
    }, [onTransformChange, onDraggingChanged]);
};
