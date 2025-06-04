import { useEffect } from "react";
import { useFrame } from "@react-three/fiber";

import { useCuboids, useFileManager, useEditor } from "contexts";

import { getPointsInsideCuboid } from "utils/cuboids";

export const useBatchEditorGeometrySelector = (handlers) => {
    const { pcdFiles } = useFileManager();
    const { pointCloudRefs } = useEditor();
    const {
        batchMode,
        selectedCuboid,
        cuboidsGeometriesRef,
        cuboidsSolutionRef,
        selectedCuboidBatchGeometriesRef,
        currentFrame,
        cuboidColorsUpdateRef,
    } = useCuboids();

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

    useFrame(() => {
        const batch = selectedCuboidBatchGeometriesRef.current;

        if (batch && cuboidColorsUpdateRef.current) {
            const { handleCuboidPointsColor } = handlers;

            for (let frame = currentFrame[0]; frame < currentFrame[1] + 1; frame++) {
                const cuboid = batch[frame];
                const { position, scale, quaternion } = cuboid;
                const { label } = cuboid.userData;

                const frameFilePath = pcdFiles[frame];
                const cloud = pointCloudRefs.current[frameFilePath];
                if (!cloud) return;

                const positions = cloud.geometry.attributes.position.array;
                const insidePoints = getPointsInsideCuboid(positions, position, quaternion, scale);

                handleCuboidPointsColor(frame, insidePoints, label);
            }
        }

        cuboidColorsUpdateRef.current = false;
    });
};
