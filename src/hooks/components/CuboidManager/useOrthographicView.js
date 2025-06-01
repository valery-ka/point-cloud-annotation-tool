import { useEffect, useRef, useCallback } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import { Euler } from "three";

import { useCuboids, useFileManager } from "contexts";
import { useSideViewsRenderer, useBatchEditor } from "hooks";

import {
    getCuboidHandlesPositions,
    setupCamera,
    getOrientationQuaternion,
    updateCamera,
} from "utils/cuboids";

export const useOrthographicView = (handlers) => {
    const { size } = useThree();

    const { pcdFiles } = useFileManager();
    const {
        sideViews,
        setSideViews,
        selectedCuboidGeometryRef,
        setHandlePositions,
        sideViewsCamerasNeedUpdateRef,
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

            sideViews.forEach(({ camera, scaleOrder, getOrientation }) => {
                updateCamera(camera, mesh, scaleOrder, getOrientation, aspectRef.current, zooms);
            });

            updateHandlePositions(mesh, sideViews);
        },
        [updateCamera, updateHandlePositions, sideViews],
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
    }, [pcdFiles]);

    useFrame(() => {
        if (sideViewsCamerasNeedUpdateRef.current) {
            updateAllCameras(selectedCuboidGeometryRef.current);
        }
        sideViewsCamerasNeedUpdateRef.current = false;
    });

    useSideViewsRenderer({ aspectRef });
    useBatchEditor({ handlers, views: VIEW_CONFIGS });
};
