import { Points } from "three";

import { useRef, useEffect } from "react";
import { useThree } from "@react-three/fiber";

export const ImageScenePoints = ({ image, geometry, material, visible = true, scale = 1 }) => {
    const { scene } = useThree();

    const pointsRef = useRef(null);
    const prevGeometryRef = useRef(null);
    const prevMaterialRef = useRef(null);

    useEffect(() => {
        if (geometry && geometry !== prevGeometryRef.current) {
            if (pointsRef.current) {
                scene.remove(pointsRef.current);
                prevGeometryRef.current?.dispose();
            }

            pointsRef.current = new Points(geometry, material);
            scene.add(pointsRef.current);

            prevGeometryRef.current = geometry;
        }

        return () => {
            if (pointsRef.current) {
                scene.remove(pointsRef.current);
            }
        };
    }, [geometry, scene]);

    useEffect(() => {
        if (material !== prevMaterialRef.current) {
            if (pointsRef.current) {
                pointsRef.current.material.dispose();
                pointsRef.current.material = material;
                pointsRef.current.needsUpdate = true;
            }

            prevMaterialRef.current = material;
        }
    }, [material]);

    useEffect(() => {
        const points = pointsRef.current;
        if (points) {
            points.scale.set(scale, scale, 1);
        }
    }, [image, scale]);

    useEffect(() => {
        if (pointsRef.current) {
            pointsRef.current.visible = visible;
        }
    }, [image, visible]);

    return null;
};
