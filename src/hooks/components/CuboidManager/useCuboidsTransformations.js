import { useEffect, useCallback } from "react";
import { useCuboids, useFrames } from "contexts";

import { writePSRToSolution } from "utils/cuboids";

export const useCuboidsTransformations = () => {
    const { activeFrameIndex } = useFrames();
    const { cuboidsSolutionRef, cuboidsGeometriesRef, sideViewsCamerasNeedUpdateRef } =
        useCuboids();

    const saveCurrentPSR = useCallback(() => {
        const geometries = cuboidsGeometriesRef.current;

        cuboidsSolutionRef.current[activeFrameIndex] = [];

        Object.values(geometries).forEach((entry) => {
            const cube = entry.cube?.mesh;
            if (!cube) return;

            writePSRToSolution({
                mesh: cube,
                frameIndices: [activeFrameIndex],
                cuboidsSolutionRef,
                manual: true,
            });
        });

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
