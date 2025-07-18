import { useEffect } from "react";
import { useFrame } from "@react-three/fiber";

import { useBatch, useCuboids } from "contexts";

import { setupCamera, updateCamera, getCuboidHandlesPositions } from "utils/cuboids";

export const useBatchModeCameras = ({ aspect, views }) => {
    const { sideViewCameraZoomsRef } = useCuboids();
    const {
        viewsCount,
        batchMode,
        batchEditorCameras,
        setBatchEditorCameras,
        setBatchHandlePositions,
        selectedCuboidBatchGeometriesRef,
        batchViewsCamerasNeedUpdateRef,
        currentFrame,
        activeCameraViews,
    } = useBatch();

    useEffect(() => {
        const batchFramesList = {};
        for (let i = currentFrame[0]; i < currentFrame[1] + 1; i++) {
            const filteredViews = views.filter(({ name }) => activeCameraViews[name]);

            batchFramesList[i] = filteredViews.map((config) => {
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
    }, [currentFrame, viewsCount, activeCameraViews]);

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
        batchViewsCamerasNeedUpdateRef.current = true;
    }, [aspect, batchMode, currentFrame, batchEditorCameras]);
};
