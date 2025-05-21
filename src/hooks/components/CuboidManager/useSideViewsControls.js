import { useEffect, useRef, useCallback } from "react";

import { useCuboids, useEditor } from "contexts";
import { scalingConfigs, translateConfigs, rotateConfigs } from "utils/cuboids";

const TRANSLATE_SENSITIVITY = 0.005;
const ROTATE_SENSITIVITY = 0.005;
const SCALE_SENSITIVITY = 0.015;

const MIN_SCALE = 0.1;

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 1.5;
const ZOOM_STEP = 0.05;

const translate = "translate";
const scale = "scale";
const rotate = "rotate";

export const useSideViewsControls = ({ camera, mesh, hoveredView, hoveredHandler, name }) => {
    const { sideViewsCamerasNeedUpdate, isCuboidTransformingRef } = useCuboids();
    const { cameraControlsRef, transformControlsRef } = useEditor();

    const scaleHandlerRef = useRef(null);
    const transformModeRef = useRef(null);

    const handleTranslate = useCallback(
        (movementX, movementY) => {
            if (!mesh) return;

            const dx = movementX * TRANSLATE_SENSITIVITY;
            const dy = movementY * TRANSLATE_SENSITIVITY;

            const config = translateConfigs[name];
            if (!config) return;

            const localMove = config(dx, dy);
            const worldTarget = mesh.localToWorld(localMove.clone());
            const worldMove = worldTarget.sub(mesh.position);

            mesh.position.add(worldMove);
        },
        [mesh, name],
    );

    const handleRotate = useCallback(
        (movementX) => {
            if (!mesh) return;

            const dx = movementX * ROTATE_SENSITIVITY;

            const config = rotateConfigs[name];
            if (!config) return;

            const { axis, direction } = config;
            mesh.rotateOnAxis(axis, dx * direction);
        },
        [mesh, name],
    );

    const handleScale = useCallback(
        (movementX, movementY) => {
            if (!mesh) return;

            const dx = movementX * SCALE_SENSITIVITY;
            const dy = movementY * SCALE_SENSITIVITY;

            const scale = mesh.scale.clone();
            const position = mesh.position.clone();

            const config = scalingConfigs(dx, dy)[name]?.[scaleHandlerRef.current];
            if (!config) return;

            const configs = Array.isArray(config) ? config : [config];

            configs.forEach(({ axis, delta, scaleKey, posAdd }) => {
                let newScaleVal = scale[scaleKey] + delta;
                if (newScaleVal < MIN_SCALE) newScaleVal = MIN_SCALE;

                const scaleChange = newScaleVal - scale[scaleKey];
                scale[scaleKey] = newScaleVal;

                const positionOffset = axis.clone().multiplyScalar(scaleChange / 2);
                positionOffset.applyQuaternion(mesh.quaternion);

                if (posAdd) {
                    position.add(positionOffset);
                } else {
                    position.sub(positionOffset);
                }
            });

            mesh.scale.copy(scale);
            mesh.position.copy(position);
        },
        [mesh, name],
    );

    const handleMouseDown = useCallback(
        (e) => {
            if (e.button !== 0 || !hoveredView) return;

            cameraControlsRef.current.enabled = false;

            const type = hoveredHandler?.type;

            if (!hoveredHandler) {
                transformModeRef.current = translate;
            } else if (type === "edge" || type === "corner") {
                scaleHandlerRef.current = hoveredHandler?.direction;
                transformModeRef.current = scale;
            } else if (type === "rotation") {
                transformModeRef.current = rotate;
            }

            isCuboidTransformingRef.current = true;
        },
        [hoveredView, hoveredHandler],
    );

    const handleMouseMove = useCallback(
        (e) => {
            if (!isCuboidTransformingRef.current || !mesh) return;

            const { movementX, movementY } = e;

            if (transformModeRef.current === translate) {
                handleTranslate(movementX, movementY);
            } else if (transformModeRef.current === rotate) {
                handleRotate(movementX);
            } else if (transformModeRef.current === scale) {
                handleScale(movementX, movementY);
            }

            sideViewsCamerasNeedUpdate.current = true;
            transformControlsRef.current.dispatchEvent({ type: "change" });
        },
        [mesh, handleTranslate, handleRotate, handleScale],
    );

    const handleMouseUp = useCallback(() => {
        transformModeRef.current = null;
        sideViewsCamerasNeedUpdate.current = true;
        cameraControlsRef.current.enabled = true;

        if (isCuboidTransformingRef.current) {
            transformControlsRef.current.dispatchEvent({ type: "dragging-changed" });
        }
    }, []);

    const handleMouseWheel = useCallback(
        (e) => {
            if (camera.name !== hoveredView) return;

            if (e.deltaY < 0) {
                camera.zoom = Math.min(MAX_ZOOM, camera.zoom + ZOOM_STEP);
            } else {
                camera.zoom = Math.max(MIN_ZOOM, camera.zoom - ZOOM_STEP);
            }

            sideViewsCamerasNeedUpdate.current = true;
        },
        [camera, hoveredView],
    );

    useEffect(() => {
        document.addEventListener("mousedown", handleMouseDown);
        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
        document.addEventListener("mousewheel", handleMouseWheel);

        return () => {
            document.removeEventListener("mousedown", handleMouseDown);
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
            document.removeEventListener("mousewheel", handleMouseWheel);
        };
    }, [handleMouseDown, handleMouseMove, handleMouseUp, handleMouseWheel]);
};
