import { useEffect, useRef, useCallback } from "react";

import { Raycaster, Vector2 } from "three";
import { useThree } from "@react-three/fiber";

import { useTools, useEditor } from "contexts";

import { DEFAULT_TOOL, LAYERS } from "constants";

const DRAG_ACTION_PX = 1;

export const useRaycastClickSelect = ({ getMeshMap, onSelect, groupKey }) => {
    const { gl, camera } = useThree();

    const { selectedTool } = useTools();
    const { isIntersectingMap } = useEditor();

    const raycasterRef = useRef(new Raycaster());
    const mouseRef = useRef(new Vector2());
    const mouseDownPosRef = useRef({ x: 0, y: 0 });
    const isDragRef = useRef(false);
    const downIntersectRef = useRef(null);
    const isObjectIntersectRef = useRef(false);

    useEffect(() => {
        raycasterRef.current.layers.set(LAYERS.SECONDARY);
        raycasterRef.current.params.Line.threshold = 0;
    }, []);

    const getIntersects = useCallback(
        (event) => {
            const rect = gl.domElement.getBoundingClientRect();
            mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

            raycasterRef.current.setFromCamera(mouseRef.current, camera);

            const meshes = Object.values(getMeshMap()).filter((obj) => obj.isMesh && obj.visible);
            return raycasterRef.current.intersectObjects(meshes);
        },
        [camera, gl.domElement],
    );

    const handleMouseDown = useCallback(
        (event) => {
            if (event.button !== 0) return;

            const intersects = getIntersects(event);
            downIntersectRef.current = intersects[0]?.object || null;

            mouseDownPosRef.current = { x: event.clientX, y: event.clientY };
            isDragRef.current = false;
        },
        [getIntersects],
    );

    const handleMouseUp = useCallback(
        (event) => {
            if (!downIntersectRef.current) return;

            if (!isDragRef.current && selectedTool === DEFAULT_TOOL) {
                const intersects = getIntersects(event).filter((i) => i.object.visible);
                const isSame = intersects.some((i) => i.object === downIntersectRef.current);

                if (isSame) {
                    const id = downIntersectRef.current.name;
                    if (id) onSelect(id);
                }
            }

            downIntersectRef.current = null;
            isDragRef.current = false;
        },
        [getIntersects, selectedTool, onSelect],
    );

    const handleMouseMove = useCallback(
        (event) => {
            const dx = event.clientX - mouseDownPosRef.current.x;
            const dy = event.clientY - mouseDownPosRef.current.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance > DRAG_ACTION_PX) isDragRef.current = true;

            const visibleIntersects = getIntersects(event).filter((i) => i.object.visible);
            const isIntersecting = visibleIntersects.length > 0;
            isObjectIntersectRef.current = isIntersecting;
            isIntersectingMap.current.set(groupKey, isIntersecting);

            if ([...isIntersectingMap.current.values()].some(Boolean)) {
                gl.domElement.classList.add("pointer-cursor");
            } else {
                gl.domElement.classList.remove("pointer-cursor");
            }
        },
        [getIntersects, gl.domElement],
    );

    useEffect(() => {
        if (!gl.domElement) return;

        gl.domElement.addEventListener("mousedown", handleMouseDown);
        gl.domElement.addEventListener("mouseup", handleMouseUp);
        gl.domElement.addEventListener("mousemove", handleMouseMove);

        return () => {
            gl.domElement.removeEventListener("mousedown", handleMouseDown);
            gl.domElement.removeEventListener("mouseup", handleMouseUp);
            gl.domElement.removeEventListener("mousemove", handleMouseMove);
        };
    }, [gl.domElement, handleMouseDown, handleMouseUp, handleMouseMove]);
};
