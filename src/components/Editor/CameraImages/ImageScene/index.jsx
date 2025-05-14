import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

export const ImageScene = ({ image, geometry, material, visible = true, scale = 1 }) => {
    const { gl, scene } = useThree();
    const pointsRef = useRef(null);
    const prevGeometryRef = useRef(null);
    const prevMaterialRef = useRef(null);

    useEffect(() => {
        if (geometry && geometry !== prevGeometryRef.current) {
            if (pointsRef.current) {
                scene.remove(pointsRef.current);
                prevGeometryRef.current?.dispose();
            }

            pointsRef.current = new THREE.Points(geometry, material);
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
        if (pointsRef.current) {
            pointsRef.current.scale.set(scale, scale, 1);
        }
    }, [image, scale]);

    useEffect(() => {
        if (pointsRef.current) {
            pointsRef.current.visible = visible;
        }
    }, [image, visible]);

    return null;
};
