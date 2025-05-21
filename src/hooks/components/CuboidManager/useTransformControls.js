import { Vector3, Matrix4 } from "three";
import { useThree } from "@react-three/fiber";

import { useCallback, useEffect } from "react";

import { useEditor, useFrames, useFileManager, useCuboids } from "contexts";

import { isEmpty } from "lodash";
import { TransformControls, extractPsrFromObject } from "utils/cuboids";

export const useTransformControls = () => {
    const { gl, camera, scene } = useThree();

    const { pcdFiles } = useFileManager();
    const { pointCloudRefs, cameraControlsRef, transformControlsRef } = useEditor();
    const { activeFrameIndex } = useFrames();
    const {
        selectedCuboidRef,
        sideViewsCamerasNeedUpdate,
        isCuboidTransformingRef,
        setCuboids,
        setSelectedCuboid,
    } = useCuboids();

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
        if (!selectedCuboidRef.current || !isCuboidTransformingRef.current) return;

        isCuboidTransformingRef.current = true;

        const cuboid = selectedCuboidRef.current;
        const { position, scale, rotation } = extractPsrFromObject(cuboid);

        sideViewsCamerasNeedUpdate.current = true;

        if (isEmpty(pcdFiles)) {
            // console.log("no points");
            return;
        }

        const activeFrameFilePath = pcdFiles[activeFrameIndex];
        const activeFrame = pointCloudRefs.current[activeFrameFilePath];
        if (!activeFrame) return;

        const positions = activeFrame.geometry.attributes.position.array;

        const matrix = new Matrix4();
        const positionVec = new Vector3().fromArray(position);
        const scaleVec = new Vector3().fromArray(scale);

        matrix.compose(positionVec, cuboid.quaternion, scaleVec);

        const inverseMatrix = new Matrix4().copy(matrix).invert();
        const halfSize = new Vector3(0.5, 0.5, 0.5);
        const point = new Vector3();
        const localPoint = new Vector3();

        const insidePoints = [];

        for (let i = 0; i < positions.length; i += 3) {
            point.set(positions[i], positions[i + 1], positions[i + 2]);
            localPoint.copy(point).applyMatrix4(inverseMatrix);

            if (
                Math.abs(localPoint.x) <= halfSize.x &&
                Math.abs(localPoint.y) <= halfSize.y &&
                Math.abs(localPoint.z) <= halfSize.z
            ) {
                insidePoints.push(i / 3);
            }
        }

        setSelectedCuboid((prevCuboid) => ({
            ...prevCuboid,
            ...{ position, scale, rotation },
        }));

        // console.log("---------------------------");
        // console.log("Points inside box", insidePoints);
        // console.log("---------------------------");
    }, [pcdFiles, activeFrameIndex]);

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
