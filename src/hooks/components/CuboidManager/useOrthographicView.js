import { useEffect, useRef, useCallback } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import { Euler } from "three";

import { useCuboids } from "contexts";
import { useSideViewsRenderer } from "./useSideViewsRenderer";

import {
    getCuboidHandlesPositions,
    setupCamera,
    getOrientationQuaternion,
    updateCamera,
} from "utils/cuboids";

export const useOrthographicView = () => {
    const { size } = useThree();
    const {
        sideViews,
        setSideViews,
        selectedCuboidGeometryRef,
        setHandlePositions,
        sideViewsCamerasNeedUpdateRef,
        batchMode,
        setBatchMode,
        batchFrames,
        setBatchFrames,
        sideViewCameraZoomsRef,
    } = useCuboids();

    const aspectRef = useRef(null);

    const VIEW_CONFIGS = [
        {
            name: "top",
            scaleOrder: ["x", "y", "z"],
            getOrientation: () => getOrientationQuaternion(new Euler(0, 0, -Math.PI / 2)),
        },
        {
            name: "left",
            scaleOrder: ["z", "x", "y"],
            getOrientation: () => getOrientationQuaternion(new Euler(Math.PI / 2, 0, 0)),
        },
        {
            name: "front",
            scaleOrder: ["y", "z", "x"],
            getOrientation: () => getOrientationQuaternion(new Euler(Math.PI / 2, -Math.PI / 2, 0)),
        },
    ];

    const updateHandlePositions = useCallback((mesh, views) => {
        if (!mesh) return;
        const newPositions = {};
        views.forEach(({ name, scaleOrder }) => {
            newPositions[name] = getCuboidHandlesPositions(mesh, scaleOrder);
        });
        setHandlePositions(newPositions);
    }, []);

    const updateAllCameras = useCallback(
        (mesh) => {
            const zooms = sideViewCameraZoomsRef.current;
            const viewsToUpdate = batchMode ? Object.values(batchFrames).flat() : sideViews;

            viewsToUpdate.forEach(({ camera, scaleOrder, getOrientation }) => {
                updateCamera(camera, mesh, scaleOrder, getOrientation, aspectRef.current, zooms);
            });

            updateHandlePositions(mesh, viewsToUpdate);
        },
        [updateCamera, updateHandlePositions, sideViews, batchFrames, batchMode],
    );

    useEffect(() => {
        sideViewsCamerasNeedUpdateRef.current = true;
    }, [size]);

    useEffect(() => {
        const sideViewsList = VIEW_CONFIGS.map((config) => ({
            ...config,
            camera: setupCamera(config.name),
        }));
        setSideViews(sideViewsList);

        const batchFramesList = {};
        for (let i = 0; i < 10; i++) {
            batchFramesList[i] = VIEW_CONFIGS.map((config) => {
                const batchName = `batch_${config.name}`;
                return {
                    ...config,
                    name: batchName,
                    camera: setupCamera(batchName),
                };
            });
        }
        setBatchFrames(batchFramesList);
    }, []);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.code === "Tab") {
                setBatchMode((prev) => !prev);
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, []);

    useFrame(() => {
        if (sideViewsCamerasNeedUpdateRef.current) {
            updateAllCameras(selectedCuboidGeometryRef.current);
        }
        sideViewsCamerasNeedUpdateRef.current = false;
    });

    useSideViewsRenderer({
        isBatchMode: false,
        canvasId: "side-views-canvas",
        containerId: "side-views-canvas-container",
        refs: {
            canvasRef: useRef(null),
            containerRef: useRef(null),
            rendererRef: useRef(null),
        },
        getViews: () => sideViews,
        aspectRef,
    });

    useSideViewsRenderer({
        isBatchMode: true,
        canvasId: "batch-view-canvas",
        containerId: "batch-view-canvas-container",
        refs: {
            canvasRef: useRef(null),
            containerRef: useRef(null),
            rendererRef: useRef(null),
        },
        getViews: () => Object.values(batchFrames),
        aspectRef,
    });
};
