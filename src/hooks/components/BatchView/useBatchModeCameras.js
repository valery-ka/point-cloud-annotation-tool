import { useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";

import { useCuboids } from "contexts";

import { setupCamera, updateCamera, getCuboidHandlesPositions } from "utils/cuboids";

export const useBatchModeCameras = ({ aspect, views }) => {
    const { batchMode, batchEditorCameras, setBatchEditorCameras } = useCuboids();
    const { selectedCuboid, cuboidsGeometriesRef, cuboidsSolutionRef } = useCuboids();
    const { sideViewCameraZoomsRef, setBatchHandlePositions } = useCuboids();
    const { selectedCuboidBatchGeometriesRef, batchViewsCamerasNeedUpdateRef } = useCuboids();

    const [viewsCount, setViewsCount] = useState(5);

    useEffect(() => {
        const batchFramesList = {};
        for (let i = 0; i < viewsCount; i++) {
            batchFramesList[i] = views.map((config) => {
                const batchName = `batch_${config.name}`;
                return {
                    ...config,
                    name: batchName,
                    camera: setupCamera(batchName),
                    frame: i,
                };
            });
        }
        setBatchEditorCameras(batchFramesList);
    }, [viewsCount]);

    const updateHandlePositions = (frame, mesh, views) => {
        if (!mesh) return;
        const newPositionsForFrame = {};
        views.forEach(({ name, scaleOrder }) => {
            newPositionsForFrame[name] = getCuboidHandlesPositions(mesh, scaleOrder);
        });

        setBatchHandlePositions((prev) => ({
            ...prev,
            [frame]: {
                ...prev?.[frame],
                ...newPositionsForFrame,
            },
        }));
    };

    const updateAllCameras = (mesh, frame) => {
        const zooms = sideViewCameraZoomsRef.current;
        const camerasForFrame = batchEditorCameras[frame];

        if (!camerasForFrame) return;

        camerasForFrame.forEach(({ camera, scaleOrder, getOrientation }) => {
            updateCamera(camera, mesh, scaleOrder, getOrientation, aspect, zooms);
        });

        updateHandlePositions(frame, mesh, camerasForFrame);
    };

    useFrame(() => {
        if (!selectedCuboidBatchGeometriesRef.current || !batchViewsCamerasNeedUpdateRef.current)
            return;

        Object.entries(selectedCuboidBatchGeometriesRef.current).forEach(([frame, mesh]) => {
            updateAllCameras(mesh, parseInt(frame));
        });

        batchViewsCamerasNeedUpdateRef.current = false;
    });

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
    }, [batchEditorCameras, selectedCuboid, batchMode]);

    useEffect(() => {
        batchViewsCamerasNeedUpdateRef.current = true;
    }, [aspect, batchMode]);
};
