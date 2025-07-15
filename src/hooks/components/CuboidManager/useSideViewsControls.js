import { useEffect, useRef, useCallback } from "react";

import { useBatch, useCuboids, useEditor, useFrames } from "contexts";
import {
    useMousetrapPause,
    useBatchEditorEvents,
    usePublishActions,
    useCuboidInterpolation,
} from "hooks";

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

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 1.5;
const ZOOM_STEP = 0.05;

const translate = "translate";
const scale = "scale";
const rotate = "rotate";

//
// fixed shortcuts for hovered view start
const handleFrameShortcuts = (e, actions, batchMode) => {
    if (batchMode) return;

    const mouse = {
        1: actions.publishToggleCuboidVisibility,
        3: actions.publishFixOdometryFrame,
        4: actions.publishApplyTransform,
    };

    const keyboard = {
        Tab: actions.publishOpenBatchMode,
        Digit1: actions.publishGoToPreviousFrame,
        Digit2: actions.publishGoToNextFrame,
        KeyZ: e.ctrlKey ? actions.publishUndoAction : actions.publishToggleCuboidVisibility,
        KeyX: e.ctrlKey ? actions.publishRedoAction : actions.publishCopyObjectTransform,
        KeyC: actions.publishFixOdometryFrame,
        KeyV: actions.publishApplyTransform,
        KeyF: actions.publishFlipObjectZ,
    };

    if (e instanceof KeyboardEvent) {
        keyboard[e.code]?.();
    } else if (e instanceof MouseEvent) {
        mouse[e.button]?.();
    }
};
// fixed shortcuts for hovered view end
//

export const useSideViewsControls = ({ camera, mesh, hoveredView, hoveredHandler, name }) => {
    const { cameraControlsRef, transformControlsRef } = useEditor();
    const { activeFrameIndex } = useFrames();

    const { sideViewsCamerasNeedUpdateRef, isCuboidTransformingRef, sideViewCameraZoomsRef } =
        useCuboids();
    const { batchMode, batchViewsCamerasNeedUpdateRef, batchEditingFrameRef } = useBatch();

    const { removeBatchKeyFrame, toggleCuboidVisibility, goToHoveredFrame } =
        useBatchEditorEvents();

    const { removeKeyFrame } = useCuboidInterpolation();

    const actions = usePublishActions([
        "openBatchMode",
        "fixOdometryFrame",
        "copyObjectTransform",
        "applyTransform",
        "goToPreviousFrame",
        "goToPreviousFrame",
        "goToNextFrame",
        "toggleCuboidVisibility",
        "undoAction",
        "redoAction",
        "flipObjectZ",
        "toggleCuboidVisibility",
        "fixOdometryFrame",
        "applyTransform",
    ]);

    const scaleHandlerRef = useRef(null);
    const transformModeRef = useRef(null);

    const updateCameras = useCallback(() => {
        batchMode
            ? (batchViewsCamerasNeedUpdateRef.current = true)
            : (sideViewsCamerasNeedUpdateRef.current = true);
    }, [batchMode]);

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

    const handleMouseDown = useCallback(
        (e) => {
            if (!hoveredView) return;

            handleFrameShortcuts(e, actions, false);

            if (e.button !== 0 || !mesh || !mesh.visible) return;

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
            batchEditingFrameRef.current = mesh?.userData?.frame;
        },
        [actions, hoveredView, hoveredHandler],
    );

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
        updateCameras();
        cameraControlsRef.current.enabled = true;

        if (isCuboidTransformingRef.current) {
            transformControlsRef.current.dispatchEvent({ type: "dragging-changed" });
        }
    }, [updateCameras]);

    const handleMouseWheel = useCallback(
        (e) => {
            if (camera.name !== hoveredView) return;

            if (e.deltaY < 0) {
                camera.zoom = Math.min(MAX_ZOOM, camera.zoom + ZOOM_STEP);
            } else {
                camera.zoom = Math.max(MIN_ZOOM, camera.zoom - ZOOM_STEP);
            }

            sideViewCameraZoomsRef.current[camera.name] = camera.zoom;
            updateCameras();
        },
        [camera, hoveredView, updateCameras],
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

            if (didTransform) {
                batchEditingFrameRef.current = mesh?.userData?.frame;
                transformControlsRef.current.dispatchEvent({ type: "change" });
                transformControlsRef.current.dispatchEvent({ type: "dragging-changed" });
            }

            handleFrameShortcuts(e, actions, batchMode);

            //
            // batch shortcuts start
            goToHoveredFrame(e, mesh);
            toggleCuboidVisibility(e, mesh);
            // batch shortcuts end
            //
        },
        [hoveredView, mesh, name, batchMode, actions, toggleCuboidVisibility, goToHoveredFrame],
    );

    const handleRightClick = useCallback(() => {
        if (hoveredView) {
            removeBatchKeyFrame({ hoveredView, mesh });
            removeKeyFrame({ frame: activeFrameIndex });
        }
    }, [removeBatchKeyFrame, hoveredView, mesh, activeFrameIndex]);

    useEffect(() => {
        document.addEventListener("mousedown", handleMouseDown);
        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
        document.addEventListener("mousewheel", handleMouseWheel);
        document.addEventListener("keydown", handleKeyDown);
        document.addEventListener("contextmenu", handleRightClick);

        return () => {
            document.removeEventListener("mousedown", handleMouseDown);
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
            document.removeEventListener("mousewheel", handleMouseWheel);
            document.removeEventListener("keydown", handleKeyDown);
            document.removeEventListener("contextmenu", handleRightClick);
        };
    }, [
        handleMouseDown,
        handleMouseMove,
        handleMouseUp,
        handleMouseWheel,
        handleKeyDown,
        handleRightClick,
    ]);
};
