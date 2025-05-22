import { useThree } from "@react-three/fiber";

import { useCallback, useEffect } from "react";

import { useEditor, useCuboids } from "contexts";

import { TransformControls, extractPsrFromObject } from "utils/cuboids";

export const useTransformControls = ({ selectPointsByCuboid }) => {
    const { gl, camera, scene } = useThree();

    const { cameraControlsRef, transformControlsRef } = useEditor();
    const { selectedCuboidRef, sideViewsCamerasNeedUpdate, isCuboidTransformingRef, setCuboids } =
        useCuboids();

    const onDraggingChanged = useCallback((event) => {
        isCuboidTransformingRef.current = event.value;

        if (cameraControlsRef.current) {
            cameraControlsRef.current.enabled = !event.value;
        }

        if (!event.value) {
            onTransformFinished();
        }

        sideViewsCamerasNeedUpdate.current = true;
    }, []);

    const onTransformChange = useCallback(() => {
        if (!isCuboidTransformingRef.current) return;
        selectPointsByCuboid();
    }, [selectPointsByCuboid]);

    const onTransformFinished = useCallback(() => {
        const object = selectedCuboidRef.current;
        if (!object) return;

        const psr = extractPsrFromObject(object);

        setCuboids((prevCuboids) =>
            prevCuboids.map((cuboid) =>
                cuboid.id === object.name ? { ...cuboid, ...psr } : cuboid,
            ),
        );

        console.log("finish transform");
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
                const object = selectedCuboidRef.current;
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

    return {
        transformControlsRef,
    };
};
