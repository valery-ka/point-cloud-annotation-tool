import { useCallback } from "react";
import { useCuboids, useFrames, useFileManager, useBatch } from "contexts";

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

    const {
        batchViewsCamerasNeedUpdateRef,
        selectedCuboidBatchGeometriesRef,
        batchEditingFrameRef,
        batchMode,
        updateBatchCuboidRef,
    } = useBatch();

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

    const interpolatePSRBatch = useCallback(() => {
        const geometries = selectedCuboidBatchGeometriesRef.current;
        if (!geometries) return;

        const totalFrames = pcdFiles.length;

        Object.values(geometries).forEach((cube) => {
            if (!cube?.name) return;

            interpolateBetweenFrames({
                cuboidsGeometriesRef,
                cuboidsSolutionRef,
                totalFrames,
                selectedId: cube.name,
            });
        });

        batchViewsCamerasNeedUpdateRef.current = true;
    }, [pcdFiles]);

    const updateCuboidPSR = useCallback(
        (frame) => {
            if (batchMode) return;

            const geometries = cuboidsGeometriesRef.current;

            const frameIndex = frame ?? activeFrameIndex;
            const frameSolution = cuboidsSolutionRef.current[frameIndex] ?? [];

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
        },
        [batchMode, activeFrameIndex],
    );

    const updateCuboidPSRBatch = useCallback(() => {
        const geometries = selectedCuboidBatchGeometriesRef.current;
        const solution = cuboidsSolutionRef.current;

        if (!geometries || !solution) return;

        Object.values(geometries).forEach((cube) => {
            if (!cube) return;

            const id = cube.name;
            const frame = cube.userData.frame;
            const frameSolution = solution[frame];
            if (!frameSolution) return;

            const data = frameSolution.find((c) => c.id === id);
            if (!data || !data.psr) return;

            const { position, rotation, scale } = data.psr;
            cube.position.set(position.x, position.y, position.z);
            cube.scale.set(scale.x, scale.y, scale.z);
            cube.rotation.set(rotation.x, rotation.y, rotation.z);
            cube.visible = data.visible !== false;
        });

        batchViewsCamerasNeedUpdateRef.current = true;
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

    const saveCurrentPSRBatch = useCallback(({ keyFrameToRemove = null } = {}) => {
        const geometries = selectedCuboidBatchGeometriesRef.current;
        const id = selectedCuboidGeometryRef.current.name;

        Object.values(geometries).forEach((cube) => {
            if (!cube || cube.name !== id) return;

            const mesh = cube;
            const frame = cube.userData.frame;

            let manual = frame === batchEditingFrameRef.current;
            let preserveManual = true;

            if (keyFrameToRemove !== null && frame === keyFrameToRemove) {
                manual = false;
                preserveManual = false;
            }

            writePSRToSolution({
                mesh,
                frameIndices: [frame],
                cuboidsSolutionRef,
                manual,
                preserveManual: preserveManual,
            });
        });

        batchViewsCamerasNeedUpdateRef.current = true;
        batchEditingFrameRef.current = null;
    }, []);

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

    return {
        interpolatePSR,
        updateCuboidPSR,
        findFrameMarkers,
        saveCurrentPSR,
        saveCurrentPSRBatch,
        interpolatePSRBatch,
        updateCuboidPSRBatch,
    };
};
