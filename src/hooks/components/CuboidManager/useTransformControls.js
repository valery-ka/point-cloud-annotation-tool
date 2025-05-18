import { Vector3, Matrix4 } from "three";
import { useThree } from "@react-three/fiber";

import { useCallback, useEffect, useRef } from "react";

import { useEditor, useFrames, useFileManager, useSideViews } from "contexts";

import { isEmpty } from "lodash";
import { TransformControls } from "utils/cuboids";

export const useTransformControls = ({ selectedCuboidRef, onTransformFinished }) => {
    const { gl, camera, scene } = useThree();

    const { pcdFiles } = useFileManager();
    const { pointCloudRefs, controlsRef } = useEditor();
    const { activeFrameIndex } = useFrames();
    const { sideViewsCamerasNeedUpdate } = useSideViews();

    const transformControlsRef = useRef(null);
    const isDraggingRef = useRef(false);

    const onDraggingChanged = useCallback(
        (event) => {
            isDraggingRef.current = event.value;
            if (controlsRef.current) {
                controlsRef.current.enabled = !event.value;
            }
            if (!isDraggingRef.current) {
                onTransformFinished();
            }
        },
        [onTransformFinished],
    );

    const onTransformChange = useCallback(() => {
        if (!isDraggingRef.current || !selectedCuboidRef.current) return;

        const cuboid = selectedCuboidRef.current;
        const position = cuboid.position;
        const scale = cuboid.scale;

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
        matrix.compose(position, cuboid.quaternion, scale);

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

        // console.log("---------------------------");
        // console.log("Points inside box", insidePoints);
        // console.log("---------------------------");
    }, [pcdFiles, activeFrameIndex]);

    useEffect(() => {
        const transformControls = new TransformControls(camera, gl.domElement);
        transformControls.setSpace("local");

        transformControlsRef.current = transformControls;
        scene.add(transformControls);

        transformControls.addEventListener("dragging-changed", onDraggingChanged);

        return () => {
            transformControls.removeEventListener("dragging-changed", onDraggingChanged);
            scene.remove(transformControls);
        };
    }, [camera, gl.domElement, scene, onDraggingChanged]);

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

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            transform?.removeEventListener("change", onTransformChange);
            transform?.detach();
        };
    }, [onTransformChange]);

    return {
        transformControlsRef,
    };
};
