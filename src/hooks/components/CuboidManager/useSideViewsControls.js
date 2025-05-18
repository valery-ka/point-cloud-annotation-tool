import { Vector3 } from "three";
import { useEffect, useRef, useCallback } from "react";

import { useSideViews, useEditor } from "contexts";

const SENSITIVITY = 0.0025;

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 1;
const ZOOM_STEP = 0.05;

const translate = "translate";
const scale = "scale";
const rotate = "rotate";

export const useSideViewsControls = ({ camera, mesh, hoveredView, hoveredHandler, name }) => {
    const { sideViewsCamerasNeedUpdate } = useSideViews();
    const { controlsRef } = useEditor();

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

    const handleMouseDown = useCallback(
        (e) => {
            if (e.button !== 0 || !hoveredView) return;

            controlsRef.current.enabled = false;

            const type = hoveredHandler?.type;

            if (!hoveredHandler) {
                isDraggingRef.current = true;
                transformModeRef.current = translate;
            } else if (type === "edge" || type === "corner") {
                transformModeRef.current = scale;
            } else if (type === "rotation") {
                transformModeRef.current = rotate;
            }
        },
        [hoveredView, hoveredHandler],
    );

    const handleMouseMove = useCallback(
        (e) => {
            if (!isDraggingRef.current || !mesh) return;

            if (transformModeRef.current === translate) {
                handleTranslate(e.movementX, e.movementY);
                sideViewsCamerasNeedUpdate.current = true;
            }
        },
        [mesh, handleTranslate],
    );

    const handleMouseUp = useCallback(() => {
        isDraggingRef.current = false;
        transformModeRef.current = null;
        sideViewsCamerasNeedUpdate.current = true;
        controlsRef.current.enabled = true;
        console.log(controlsRef.current.enabled);
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
