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
    } = useCuboids();
    const { updateBatchCuboidRef } = useBatch();

    const { imagePointsAlphaNeedsUpdateRef } = useImages();

    useFrame(() => {
        if (updateSingleCuboidRef.current || updateBatchCuboidRef.current) {
            const mesh = selectedCuboidGeometryRef.current;
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

                const { position, scale, quaternion } = object.psr;

                const positions = cloud.geometry.attributes.position.array;

                colors[filePath] = colors[filePath] || {};
                const points = getPointsInsideCuboid(positions, position, quaternion, scale);
                colors[filePath][id] = new Uint32Array(points);
            }

            labels[id] = label;

            cloudPointsColorNeedsUpdateRef.current = true;
            imagePointsAlphaNeedsUpdateRef.current = true;

            updateSingleCuboidRef.current = false;
            updateBatchCuboidRef.current = false;
        }
    });
};
