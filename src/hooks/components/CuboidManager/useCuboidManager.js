import { useEffect, useCallback } from "react";

import { useCuboids, useEditor, useEvent, useFrames } from "contexts";
import {
    useTransformControls,
    useRaycastClickSelect,
    useOrthographicView,
    useHoveredCuboid,
    useCuboidInterpolation,
    useCuboidsVisibility,
    useUpdateCuboidInfoCard,
    usePointsInsideCuboids,
    useWorldShifting,
} from "hooks";

import { TABS } from "constants";

export const useCuboidManager = (handlers) => {
    const { publish } = useEvent();

    const { arePointCloudsLoading } = useFrames();
    const { cameraControlsRef, transformControlsRef } = useEditor();

    const {
        cuboids,
        cuboidsGeometriesRef,
        selectedCuboid,
        selectedCuboidGeometryRef,
        sideViewsCamerasNeedUpdateRef,
        setSelectedCuboid,
        setFrameMarkers,
    } = useCuboids();

    const { updateCuboidPSR, findFrameMarkers } = useCuboidInterpolation();

    useOrthographicView(handlers);
    useTransformControls();
    useCuboidsVisibility();

    const onCuboidSelect = useCallback(
        (id) => {
            const geometry = cuboidsGeometriesRef.current[id].cube.mesh;
            selectedCuboidGeometryRef.current = geometry;
            transformControlsRef.current.detach();
            cameraControlsRef.current.enabled = true;
            sideViewsCamerasNeedUpdateRef.current = true;
            setSelectedCuboid(cuboids.find((cube) => cube.id === id));
            findFrameMarkers();
            publish("setActiveTab", TABS.OBJECT_CARD);
        },
        [cuboids],
    );

    const unselectCuboid = useCallback(() => {
        transformControlsRef.current.detach();
        selectedCuboidGeometryRef.current = null;
        cameraControlsRef.current.enabled = true;
        setFrameMarkers([]);
    }, []);

    useHoveredCuboid({
        meshMap: () => {
            const meshMap = {};
            for (const id in cuboidsGeometriesRef.current) {
                meshMap[id] = cuboidsGeometriesRef.current[id].cube.mesh;
            }
            return meshMap;
        },
    });

    useRaycastClickSelect({
        getMeshMap: () => {
            const meshMap = {};
            for (const id in cuboidsGeometriesRef.current) {
                meshMap[id] = cuboidsGeometriesRef.current[id].cube.mesh;
            }
            return meshMap;
        },
        onSelect: onCuboidSelect,
        groupKey: "cuboid",
    });

    useEffect(() => {
        const id = selectedCuboid?.id;
        id ? onCuboidSelect(id) : unselectCuboid();
    }, [selectedCuboid?.id, unselectCuboid]);

    useEffect(() => {
        updateCuboidPSR();
    }, [arePointCloudsLoading, updateCuboidPSR]);

    useUpdateCuboidInfoCard(handlers);
    usePointsInsideCuboids();

    useWorldShifting();
};
