import { useEffect } from "react";

import { useCuboids, useBatch } from "contexts";

export const useBatchEditorGeometrySelector = () => {
    const { selectedCuboid, cuboidsGeometriesRef, cuboidsSolutionRef } = useCuboids();
    const { batchMode, selectedCuboidBatchGeometriesRef } = useBatch();

    useEffect(() => {
        if (batchMode && selectedCuboid) {
            const originalGeometry = cuboidsGeometriesRef.current[selectedCuboid?.id]?.cube?.mesh;
            if (!originalGeometry) return;

            const cuboids = cuboidsSolutionRef.current;
            const batchGeometries = {};

            Object.entries(cuboids).forEach(([frameKey, cuboidsArray]) => {
                const frame = parseInt(frameKey);
                const cuboid = cuboidsArray.find((c) => c.id === selectedCuboid.id);

                if (cuboid) {
                    const meshClone = originalGeometry.clone();
                    const { position, scale, rotation } = cuboid.psr;
                    meshClone.position.set(position.x, position.y, position.z);
                    meshClone.scale.set(scale.x, scale.y, scale.z);
                    meshClone.rotation.set(rotation.x, rotation.y, rotation.z);

                    meshClone.visible = cuboid.visible;
                    meshClone.userData = {
                        ...originalGeometry.userData,
                        frame: frame,
                    };

                    batchGeometries[frame] = meshClone;
                }
            });

            selectedCuboidBatchGeometriesRef.current = batchGeometries;
        } else {
            selectedCuboidBatchGeometriesRef.current = null;
        }
    }, [selectedCuboid, batchMode]);
};
