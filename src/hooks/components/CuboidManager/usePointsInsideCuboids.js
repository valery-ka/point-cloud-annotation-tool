import { useFrame } from "@react-three/fiber";

import { useCuboids, useEditor, useFileManager, useBatch, useImages } from "contexts";

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
    const { updateBatchCuboidRef } = useBatch();

    const { imagePointsAlphaNeedsUpdateRef } = useImages();

    useFrame(() => {
        const updateSingle = updateSingleCuboidRef.current.needsUpdate;
        const updateBatch = updateBatchCuboidRef.current;

        if (!updateSingle && !updateBatch) return;

        const requestedId = updateSingleCuboidRef.current.id;
        const requestedMesh = cuboidsGeometriesRef.current?.[requestedId]?.cube?.mesh;
        const selectedMesh = selectedCuboidGeometryRef.current;

        const mesh = requestedMesh || selectedMesh;

        if (!mesh) return;

        const id = mesh.name;
        const label = mesh.userData.label;

        const colors = pointsInsideCuboidsRef.current;
        const labels = cuboidIdToLabelRef.current;

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

            colors[filePath] = colors[filePath] || {};
            const points = getPointsInsideCuboid(positions, position, quaternion, scale, visible);
            colors[filePath][id] = new Uint32Array(points);
        }

        labels[id] = label;

        cloudPointsColorNeedsUpdateRef.current = true;
        imagePointsAlphaNeedsUpdateRef.current = true;

        updateSingleCuboidRef.current = { needsUpdate: false, id: null };
        updateBatchCuboidRef.current = false;
    });
};
