import { Vector3 } from "three";
import { useEffect, useRef, useCallback } from "react";

import { useSideViews, useEditor } from "contexts";

const SENSITIVITY = 0.0025;

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 1.5;
const ZOOM_STEP = 0.05;

const translate = "translate";
const scale = "scale";
const rotate = "rotate";

export const useSideViewsControls = ({ camera, mesh, hoveredView, hoveredHandler, name }) => {
    const { sideViewsCamerasNeedUpdate } = useSideViews();
    const { cameraControlsRef, transformControlsRef } = useEditor();

    const isDraggingRef = useRef(false);
    const transformModeRef = useRef(null);

    const handleTranslate = useCallback(
        (movementX, movementY) => {
            if (!mesh) return;

            const dx = movementX * SENSITIVITY;
            const dy = movementY * SENSITIVITY;

            const localMove = new Vector3();

            switch (name) {
                case "top":
                    localMove.set(-dy, -dx, 0);
                    break;
                case "left":
                    localMove.set(dx, 0, -dy);
                    break;
                case "front":
                    localMove.set(0, -dx, -dy);
                    break;
                default:
                    return;
            }

            const worldTarget = mesh.localToWorld(localMove.clone());
            const worldMove = worldTarget.sub(mesh.position);
            mesh.position.add(worldMove);
        },
        [mesh, name],
    );

    const handleRotate = useCallback(
        (movementX) => {
            if (!mesh) return;

            const dx = movementX * SENSITIVITY;

            switch (name) {
                case "top": {
                    const axis = new Vector3(0, 0, 1);
                    mesh.rotateOnAxis(axis, -dx);
                    break;
                }

                case "left": {
                    const axis = new Vector3(0, 1, 0);
                    mesh.rotateOnAxis(axis, dx);
                    break;
                }

                case "front": {
                    const axis = new Vector3(1, 0, 0);
                    mesh.rotateOnAxis(axis, dx);
                    break;
                }

                default:
                    return;
            }
        },
        [mesh, name],
    );

    const handleMouseDown = useCallback(
        (e) => {
            if (e.button !== 0 || !hoveredView) return;

            cameraControlsRef.current.enabled = false;

            const type = hoveredHandler?.type;

            if (!hoveredHandler) {
                isDraggingRef.current = true;
                transformModeRef.current = translate;
            } else if (type === "edge" || type === "corner") {
                isDraggingRef.current = true;
                transformModeRef.current = scale;
            } else if (type === "rotation") {
                isDraggingRef.current = true;
                transformModeRef.current = rotate;
            }
        },
        [hoveredView, hoveredHandler],
    );

    const handleMouseMove = useCallback(
        (e) => {
            if (!isDraggingRef.current || !mesh) return;

            const { movementX, movementY } = e;

            if (transformModeRef.current === translate) {
                handleTranslate(movementX, movementY);
            } else if (transformModeRef.current === rotate) {
                handleRotate(movementX);
            }

            sideViewsCamerasNeedUpdate.current = true;
            transformControlsRef.current.dispatchEvent({ type: "change" });
        },
        [mesh, handleTranslate, handleRotate],
    );

    const handleMouseUp = useCallback(() => {
        isDraggingRef.current = false;
        transformModeRef.current = null;
        sideViewsCamerasNeedUpdate.current = true;
        cameraControlsRef.current.enabled = true;
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
