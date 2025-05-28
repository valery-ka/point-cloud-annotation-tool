import { useEffect, useRef, useCallback } from "react";

import { useCuboids, useEditor } from "contexts";
import { useMousetrapPause, useFrameSwitcher, usePlayback } from "hooks";

import {
    scalingConfigs,
    translateConfigs,
    rotateConfigs,
    applyKeyTransformToMesh,
} from "utils/cuboids";

import { Box3, Vector3 } from "three";

const TRANSLATE_SENSITIVITY = 0.005;
const ROTATE_SENSITIVITY = 0.005;
const SCALE_SENSITIVITY = 0.001;

const MIN_SCALE = 0.1;

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 1.5;
const ZOOM_STEP = 0.05;

const translate = "translate";
const scale = "scale";
const rotate = "rotate";

export const useSideViewsControls = ({ camera, mesh, hoveredView, hoveredHandler, name }) => {
    const { sideViewsCamerasNeedUpdateRef, isCuboidTransformingRef } = useCuboids();
    const { cameraControlsRef, transformControlsRef } = useEditor();

    const { stopPlayback } = usePlayback();
    const { handleGoToPreviousFrame, handleGoToNextFrame } = useFrameSwitcher(stopPlayback);

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
        (movementX, movementY, isHandler = false) => {
            if (!mesh) return;

            const dx = movementX * ROTATE_SENSITIVITY;
            const dy = movementY * ROTATE_SENSITIVITY;

            const config = rotateConfigs[name];
            if (!config) return;

            const { axis, direction } = config;

            mesh.rotateOnAxis(axis, dx * direction);
            if (!isHandler) {
                mesh.rotateOnAxis(axis, dy * direction);
            }
        },
        [mesh, name],
    );

    const handleScale = useCallback(
        (movementX, movementY) => {
            if (!mesh) return;

            const objectSize = new Box3().setFromObject(mesh).getSize(new Vector3()).length();
            const zoomFactor = camera.zoom;

            const sensitivity = (SCALE_SENSITIVITY * objectSize) / zoomFactor;

            const dx = movementX * sensitivity;
            const dy = movementY * sensitivity;

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

    const handleMouseDown = useCallback(() => {
        if (!hoveredView) return;

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
    }, [hoveredView, hoveredHandler]);

    const handleMouseMove = useCallback(
        (e) => {
            if (!isCuboidTransformingRef.current || !mesh) {
                cameraControlsRef.current.enabled = true;
                return;
            }

            const { movementX, movementY, shiftKey } = e;

            if (transformModeRef.current === translate) {
                if (shiftKey) {
                    handleRotate(movementX, movementY);
                } else {
                    handleTranslate(movementX, movementY);
                }
            } else if (transformModeRef.current === rotate) {
                handleRotate(movementX, movementY, true);
            } else if (transformModeRef.current === scale) {
                handleScale(movementX, movementY);
            }

            transformControlsRef.current.dispatchEvent({ type: "change" });
        },
        [mesh, handleTranslate, handleRotate, handleScale],
    );

    const handleMouseUp = useCallback(() => {
        transformModeRef.current = null;
        sideViewsCamerasNeedUpdateRef.current = true;
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

            sideViewsCamerasNeedUpdateRef.current = true;
        },
        [camera, hoveredView],
    );

    useEffect(() => {
        cameraControlsRef.current.enabledKeys = hoveredView === null;
    }, [hoveredView]);

    useMousetrapPause(hoveredView);

    const handleKeyDown = useCallback(
        (e) => {
            if (!hoveredView || !mesh) return;

            const configTranslate = translateConfigs[name];
            const configRotate = rotateConfigs[name];

            const didTransform = applyKeyTransformToMesh({
                code: e.code,
                mesh,
                configTranslate,
                configRotate,
            });

            const frameShortcuts = {
                1: handleGoToPreviousFrame,
                2: handleGoToNextFrame,
            };
            frameShortcuts[e.key]?.();

            if (didTransform) {
                transformControlsRef.current.dispatchEvent({ type: "change" });
                transformControlsRef.current.dispatchEvent({ type: "dragging-changed" });
            }
        },
        [hoveredView, mesh, name, handleGoToPreviousFrame, handleGoToNextFrame],
    );

    useEffect(() => {
        document.addEventListener("mousedown", handleMouseDown);
        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
        document.addEventListener("mousewheel", handleMouseWheel);
        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("mousedown", handleMouseDown);
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
            document.removeEventListener("mousewheel", handleMouseWheel);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [handleMouseDown, handleMouseMove, handleMouseUp, handleMouseWheel, handleKeyDown]);
};
