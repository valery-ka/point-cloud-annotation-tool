import { useMemo } from "react";
import { useFrame } from "@react-three/fiber";

import { useCuboids, useEditor, useFileManager, useBatch, useImages, useSettings } from "contexts";

import { getPointsInsideCuboid } from "utils/cuboids";

export const usePointsInsideCuboids = () => {
    const { pcdFiles } = useFileManager();
    const { pointCloudRefs, cloudPointsColorNeedsUpdateRef } = useEditor();

    const {
        selectedCuboidGeometryRef,
        pointsInsideCuboidsRef,
        cuboidIdToLabelRef,
        updateSingleCuboidRef,
        cuboidsSolutionRef,
        cuboidsGeometriesRef,
    } = useCuboids();
    const { selectedCuboidBatchGeometriesRef, updateBatchCuboidRef } = useBatch();

    const { imagePointsAlphaNeedsUpdateRef } = useImages();

    const { settings } = useSettings();

    const fastBoxEditing = useMemo(() => {
        return settings.editorSettings.performance.fastBoxEditing;
    }, [settings.editorSettings.performance.fastBoxEditing]);

    useFrame(() => {
        const updateSingle = updateSingleCuboidRef.current.needsUpdate;
        const updateBatch = updateBatchCuboidRef.current.needsUpdate;

        if (!updateSingle && !updateBatch) return;

        const frame = updateBatchCuboidRef.current.frame ?? updateSingleCuboidRef.current.frame;

        const requestedId = updateSingleCuboidRef.current.id;
        const requestedMesh = cuboidsGeometriesRef.current?.[requestedId]?.cube?.mesh;
        const selectedMesh = selectedCuboidGeometryRef.current;

        const mesh = requestedMesh || selectedMesh;
        const batchMesh = selectedCuboidBatchGeometriesRef.current?.[frame];

        if (!mesh) return;

        const id = mesh.name;
        const label = mesh.userData.label;

        const updateSingleFrameCuboid = (frameIndex) => {
            if (!fastBoxEditing) return;

            const filePath = pcdFiles[frameIndex];
            const cloud = pointCloudRefs.current[filePath];
            if (!cloud) return;

            const solution = cuboidsSolutionRef.current;
            const object = solution[frameIndex]?.find((obj) => obj.id === id);
            if (!object) return;

            const { visible } = object;
            const { position, scale, quaternion } = batchMesh ?? mesh;
            const positions = cloud.geometry.attributes.position.array;

            pointsInsideCuboidsRef.current[filePath] =
                pointsInsideCuboidsRef.current[filePath] || {};
            const points = getPointsInsideCuboid(positions, position, quaternion, scale, visible);
            pointsInsideCuboidsRef.current[filePath][id] = new Uint32Array(points);
        };

        const updateAllFramesCuboid = () => {
            for (let i = 0; i < pcdFiles.length; i++) {
                const filePath = pcdFiles[i];
                const cloud = pointCloudRefs.current[filePath];
                if (!cloud) continue;

                const solution = cuboidsSolutionRef.current;
                const object = solution[i]?.find((obj) => obj.id === id);
                if (!object) continue;

                const { visible } = object;
                const { position, scale, quaternion } = object.psr;
                const positions = cloud.geometry.attributes.position.array;

                pointsInsideCuboidsRef.current[filePath] =
                    pointsInsideCuboidsRef.current[filePath] || {};
                const points = getPointsInsideCuboid(
                    positions,
                    position,
                    quaternion,
                    scale,
                    visible,
                );
                pointsInsideCuboidsRef.current[filePath][id] = new Uint32Array(points);
            }
        };

        if (typeof frame === "number") {
            updateSingleFrameCuboid(frame);
        } else {
            updateAllFramesCuboid();
        }

        cuboidIdToLabelRef.current[id] = label;

        cloudPointsColorNeedsUpdateRef.current = true;
        imagePointsAlphaNeedsUpdateRef.current = true;

        updateSingleCuboidRef.current = { needsUpdate: false, frame: null, id: null };
        updateBatchCuboidRef.current = { needsUpdate: false, frame: null, id: null };
    });
};
