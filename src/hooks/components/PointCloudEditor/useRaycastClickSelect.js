import { useEffect, useRef, useCallback } from "react";

import { Raycaster, Vector2 } from "three";
import { useThree } from "@react-three/fiber";

import { useTools, useEditor } from "contexts";

import { DEFAULT_TOOL } from "constants";

export const useRaycastClickSelect = ({ getMeshMap, onSelect, groupKey }) => {
    const { gl, camera } = useThree();

    const { selectedTool } = useTools();
    const { isIntersectingMap } = useEditor();

    const raycasterRef = useRef(new Raycaster());
    const mouseRef = useRef(new Vector2());
    const downIntersectRef = useRef(null);
    const isObjectIntersectRef = useRef(false);

    useEffect(() => {
        raycasterRef.current.params.Line.threshold = 0;
    }, []);

    const getIntersects = useCallback(
        (event) => {
            const rect = gl.domElement.getBoundingClientRect();
            mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

            raycasterRef.current.setFromCamera(mouseRef.current, camera);

            const meshes = Object.values(getMeshMap()).filter((obj) => obj.isMesh);
            return raycasterRef.current.intersectObjects(meshes);
        },
        [camera, gl.domElement],
    );

    const handleMouseDown = useCallback(
        (event) => {
            if (event.button !== 0) return;

            const intersects = getIntersects(event);
            downIntersectRef.current = intersects[0]?.object || null;
        },
        [getIntersects],
    );

    const handleMouseUp = useCallback(
        (event) => {
            if (!downIntersectRef.current) return;

            const intersects = getIntersects(event);

            const isSame = intersects.some((i) => i.object === downIntersectRef.current);

            if (isSame && selectedTool === DEFAULT_TOOL) {
                const key = Object.entries(getMeshMap()).find(
                    ([_, obj]) => obj === downIntersectRef.current,
                )?.[0];
                if (key) onSelect(key);
            }

            downIntersectRef.current = null;
        },
        [getIntersects, selectedTool, DEFAULT_TOOL, onSelect],
    );

    const handleMouseMove = useCallback(
        (event) => {
            const intersects = getIntersects(event);
            const isIntersecting = intersects.length > 0;
            isObjectIntersectRef.current = isIntersecting;
            isIntersectingMap.current.set(groupKey, isIntersecting);
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
