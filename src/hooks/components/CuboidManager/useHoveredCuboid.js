import { useEffect, useRef, useCallback } from "react";

import { Raycaster, Vector2 } from "three";
import { useThree } from "@react-three/fiber";

import { useCuboids } from "contexts";

import { isEmpty } from "lodash";
import { LAYERS } from "constants";

export const useHoveredCuboid = ({ meshMap }) => {
    const { gl, camera } = useThree();

    const { cuboidsGeometriesRef, setHoveredCuboid } = useCuboids();

    const mouseRef = useRef(new Vector2());
    const raycasterRef = useRef(new Raycaster());

    const getIntersects = useCallback(
        (event) => {
            const rect = gl.domElement.getBoundingClientRect();
            mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

            raycasterRef.current.setFromCamera(mouseRef.current, camera);

            const meshes = Object.values(meshMap()).filter((obj) => obj.isMesh && obj.visible);
            return raycasterRef.current.intersectObjects(meshes);
        },
        [camera, gl.domElement],
    );

    useEffect(() => {
        raycasterRef.current.layers.set(LAYERS.SECONDARY);
        raycasterRef.current.params.Line.threshold = 0;
    }, []);

    const handleMouseMove = useCallback((event) => {
        if (!isEmpty(cuboidsGeometriesRef.current)) {
            const intersects = getIntersects(event);
            const object = intersects[0]?.object;

            setHoveredCuboid(object ? object.name : null);
        }
    }, []);

    useEffect(() => {
        if (!gl.domElement) return;
        gl.domElement.addEventListener("mousemove", handleMouseMove);
        return () => {
            gl.domElement.removeEventListener("mousemove", handleMouseMove);
        };
    }, [gl.domElement, handleMouseMove]);
};
