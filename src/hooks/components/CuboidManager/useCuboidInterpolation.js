import { useCallback } from "react";
import { useCuboids, useFrames, useFileManager } from "contexts";

import { writePSRToSolution, interpolateBetweenFrames } from "utils/cuboids";

export const useCuboidInterpolation = () => {
    const { pcdFiles } = useFileManager();
    const { activeFrameIndex } = useFrames();
    const {
        cuboidsSolutionRef,
        cuboidsGeometriesRef,
        sideViewsCamerasNeedUpdateRef,
        selectedCuboidGeometryRef,
        setFrameMarkers,
    } = useCuboids();

    const interpolatePSR = useCallback(() => {
        const selectedCuboid = selectedCuboidGeometryRef.current;
        if (!selectedCuboid?.name) return;

        interpolateBetweenFrames({
            cuboidsGeometriesRef,
            cuboidsSolutionRef,
            totalFrames: pcdFiles.length,
            selectedId: selectedCuboid.name,
        });
    }, [pcdFiles]);

    const updateCuboidPSR = useCallback(() => {
        const geometries = cuboidsGeometriesRef.current;
        const frameSolution = cuboidsSolutionRef.current[activeFrameIndex] ?? [];

        const solutionMap = {};
        for (const cuboid of frameSolution) {
            solutionMap[cuboid.id] = cuboid;
        }

        Object.entries(geometries).forEach(([id, entry]) => {
            const cube = entry.cube?.mesh;
            if (!cube) return;

            const cuboidData = solutionMap[id];
            if (!cuboidData || !cuboidData.psr) return;

            const { position, rotation, scale } = cuboidData.psr;

            cube.position.set(position.x, position.y, position.z);
            cube.scale.set(scale.x, scale.y, scale.z);
            cube.rotation.set(rotation.x, rotation.y, rotation.z);

            cube.visible = cuboidData.visible !== false;
        });

        sideViewsCamerasNeedUpdateRef.current = true;
    }, [activeFrameIndex]);

    const findFrameMarkers = useCallback(() => {
        const selectedCuboid = selectedCuboidGeometryRef.current;
        if (!selectedCuboid) return;

        const id = selectedCuboid.name;
        const keyframes = [];
        const visibility = [];

        const solution = cuboidsSolutionRef.current;
        for (const [frameIndexStr, frameSolution] of Object.entries(solution)) {
            const frameIndex = Number(frameIndexStr);

            for (const cuboid of Object.values(frameSolution)) {
                if (cuboid.id === id) {
                    if (cuboid.manual) keyframes.push(frameIndex);
                    if (cuboid.visible === false) visibility.push(frameIndex);
                    break;
                }
            }
        }

        setFrameMarkers([keyframes, visibility]);
    }, []);

    const saveCurrentPSR = useCallback(({ manual = true, activeFrameIndex }) => {
        const selectedCuboid = selectedCuboidGeometryRef.current;
        if (!selectedCuboid?.name) return;

        const geometries = cuboidsGeometriesRef.current;
        const id = selectedCuboid.name;
        const solution = cuboidsSolutionRef.current;

        solution[activeFrameIndex] = solution[activeFrameIndex] || [];

        Object.values(geometries).forEach((entry) => {
            const cube = entry.cube?.mesh;
            if (!cube || cube.name !== id) return;

            writePSRToSolution({
                mesh: cube,
                frameIndices: [activeFrameIndex],
                cuboidsSolutionRef,
                manual: manual,
            });
        });

        sideViewsCamerasNeedUpdateRef.current = true;
    }, []);

    return { interpolatePSR, updateCuboidPSR, findFrameMarkers, saveCurrentPSR };
};
