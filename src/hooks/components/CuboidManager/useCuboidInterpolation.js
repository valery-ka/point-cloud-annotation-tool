import { useCallback } from "react";

import { useCuboids, useFrames, useFileManager, useBatch } from "contexts";
import { useSaveSolution } from "hooks";

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
        cuboidEditingFrameRef,
        cuboidsVisibilityRef,
    } = useCuboids();

    const {
        batchViewsCamerasNeedUpdateRef,
        selectedCuboidBatchGeometriesRef,
        batchEditingFrameRef,
        batchMode,
    } = useBatch();

    const { saveObjectsSolution } = useSaveSolution();

    const requestSave = useCallback(
        ({ updateStack = true, id = null }) => {
            saveObjectsSolution({ updateStack: updateStack, isAutoSave: false, id: id });
        },
        [saveObjectsSolution],
    );

    const interpolatePSR = useCallback(
        ({ updateStack = true, cuboidId = null } = {}) => {
            const selectedCuboid = selectedCuboidGeometryRef.current;
            const id = cuboidId ?? selectedCuboid?.name;

            if (!id) return;

            interpolateBetweenFrames({
                cuboidsGeometriesRef,
                cuboidsSolutionRef,
                totalFrames: pcdFiles.length,
                selectedId: id,
            });

            requestSave({ updateStack, id });
        },
        [requestSave, pcdFiles],
    );

    const interpolatePSRBatch = useCallback(
        ({ updateStack = true } = {}) => {
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

            const id = geometries[0].name;

            requestSave({ updateStack, id });
            batchViewsCamerasNeedUpdateRef.current = true;
        },
        [requestSave, pcdFiles],
    );

    const updateCuboidPSR = useCallback(
        ({ frame = null } = {}) => {
            if (batchMode) return;

            const geometries = cuboidsGeometriesRef.current;

            const frameIndex = frame ?? activeFrameIndex;
            const frameSolution = cuboidsSolutionRef.current[frameIndex] ?? [];
            const cuboidsVisibility = cuboidsVisibilityRef.current;

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
                const globalVisible = cuboidsVisibility[id].visible;

                cube.position.set(position.x, position.y, position.z);
                cube.scale.set(scale.x, scale.y, scale.z);
                cube.rotation.set(rotation.x, rotation.y, rotation.z);

                cube.visible = (cuboidData.visible && globalVisible) === true;
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

    const saveCurrentPSR = useCallback(({ manual = true, frame, cuboidId = null }) => {
        const selectedCuboid = selectedCuboidGeometryRef.current;
        const id = cuboidId ?? selectedCuboid?.name;

        if (!id) return;

        const geometries = cuboidsGeometriesRef.current;
        const solution = cuboidsSolutionRef.current;

        solution[frame] = solution[frame] || [];
        cuboidEditingFrameRef.current = frame;

        Object.values(geometries).forEach((entry) => {
            const cube = entry.cube?.mesh;
            if (!cube || cube.name !== id) return;

            writePSRToSolution({
                mesh: cube,
                frameIndices: [frame],
                cuboidsSolutionRef,
                manual: manual,
            });
        });

        sideViewsCamerasNeedUpdateRef.current = true;
    }, []);

    const saveCurrentPSRBatch = useCallback(({ keyFrameToRemove = null } = {}) => {
        const geometries = selectedCuboidBatchGeometriesRef.current;
        if (!geometries) return;

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

            if (!frameSolution) continue;

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
