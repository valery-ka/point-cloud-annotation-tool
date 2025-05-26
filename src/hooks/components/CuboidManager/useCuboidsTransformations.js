import { useEffect, useCallback } from "react";
import { useCuboids, useFrames } from "contexts";

export const useCuboidsTransformations = () => {
    const { activeFrameIndex } = useFrames();
    const { cuboidsSolutionRef, cuboidsGeometriesRef, sideViewsCamerasNeedUpdateRef } =
        useCuboids();

    const saveCurrentPSR = useCallback(() => {
        const geometries = cuboidsGeometriesRef.current;

        const solutionForFrame = [];

        Object.values(geometries).forEach((entry) => {
            const cube = entry.cube?.mesh;
            if (!cube) return;

            const position = cube.position.clone();
            const scale = cube.scale.clone();
            const rotation = cube.rotation.clone();

            if (!cube.userData.psrByFrame) {
                cube.userData.psrByFrame = {};
            }

            cube.userData.psrByFrame[activeFrameIndex] = {
                position,
                scale,
                rotation,
            };

            solutionForFrame.push({
                id: cube.name,
                type: cube.userData.label,
                psr: {
                    position: {
                        x: position.x,
                        y: position.y,
                        z: position.z,
                    },
                    rotation: {
                        x: rotation.x,
                        y: rotation.y,
                        z: rotation.z,
                    },
                    scale: {
                        x: scale.x,
                        y: scale.y,
                        z: scale.z,
                    },
                },
            });
        });

        cuboidsSolutionRef.current[activeFrameIndex] = solutionForFrame;

        console.log(cuboidsSolutionRef.current);

        sideViewsCamerasNeedUpdateRef.current = true;
    }, [activeFrameIndex]);

    useEffect(() => {
        const geometries = cuboidsGeometriesRef.current;

        Object.values(geometries).forEach((entry) => {
            const cube = entry.cube?.mesh;
            if (!cube) return;

            const psrByFrame = cube.userData.psrByFrame;
            if (!psrByFrame) return;

            const frameData = psrByFrame[activeFrameIndex];
            if (frameData) {
                cube.position.copy(frameData.position);
                cube.scale.copy(frameData.scale);
                cube.rotation.copy(frameData.rotation);
            }
        });

        sideViewsCamerasNeedUpdateRef.current = true;
    }, [activeFrameIndex]);

    return {
        saveCurrentPSR,
    };
};
