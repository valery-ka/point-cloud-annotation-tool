import { useThree } from "@react-three/fiber";

import { useEffect, useCallback } from "react";

import { useCuboids, useEditor, useFileManager, useFrames, useEvent } from "contexts";
import { useTransformControls, useRaycastClickSelect, useOrthographicView } from "hooks";

import { addCuboid, extractPsrFromObject, getPointsInsideCuboid } from "utils/cuboids";

import { TABS } from "constants";

export const useCuboidManager = () => {
    const { scene } = useThree();

    const { pcdFiles } = useFileManager();
    const { activeFrameIndex } = useFrames();
    const { publish } = useEvent();
    const { pointCloudRefs, transformControlsRef } = useEditor();
    const {
        cuboids,
        cuboidsRef,
        selectedCuboid,
        selectedCuboidRef,
        sideViewsCamerasNeedUpdate,
        setSelectedCuboid,
    } = useCuboids();

    useOrthographicView();

    const selectPointsByCuboid = useCallback(() => {
        if (!selectedCuboidRef.current) return;

        const cuboid = selectedCuboidRef.current;
        const { position, scale, rotation } = extractPsrFromObject(cuboid);

        sideViewsCamerasNeedUpdate.current = true;

        const activeFrameFilePath = pcdFiles[activeFrameIndex];
        const activeFrame = pointCloudRefs.current[activeFrameFilePath];
        if (!activeFrame) return;

        const positions = activeFrame.geometry.attributes.position.array;

        const insidePoints = getPointsInsideCuboid(positions, position, cuboid.quaternion, scale);

        setSelectedCuboid((prevCuboid) => ({
            ...prevCuboid,
            ...{ position, scale, rotation, insidePoints },
        }));
    }, [pcdFiles, activeFrameIndex]);

    useTransformControls({ selectPointsByCuboid });

    const onCuboidSelect = useCallback(
        (id) => {
            const cuboid = cuboidsRef.current[id];
            selectedCuboidRef.current = cuboid;
            transformControlsRef.current.detach();
            sideViewsCamerasNeedUpdate.current = true;

            const cuboidData = cuboids[id];
            const { position, scale, rotation } = extractPsrFromObject(cuboid);

            const activeFrameFilePath = pcdFiles[activeFrameIndex];
            const activeFrame = pointCloudRefs.current[activeFrameFilePath];
            const insidePoints = activeFrame
                ? getPointsInsideCuboid(
                      activeFrame.geometry.attributes.position.array,
                      position,
                      cuboid.quaternion,
                      scale,
                  )
                : [];

            setSelectedCuboid({
                ...cuboidData,
                position,
                scale,
                rotation,
                insidePoints,
            });

            publish("setActiveTab", TABS.OBJECT_CARD);
        },
        [cuboids, pcdFiles, activeFrameIndex],
    );

    const unselectCuboid = useCallback(() => {
        transformControlsRef.current.detach();
        selectedCuboidRef.current = null;
    }, []);

    useEffect(() => {
        const id = selectedCuboid?.id;
        const cuboid = cuboids.findIndex((obj) => obj.id === id);
        cuboid !== -1 ? onCuboidSelect(cuboid) : unselectCuboid();
    }, [selectedCuboid?.id]);

    useRaycastClickSelect({
        getMeshMap: () => cuboidsRef.current,
        onSelect: onCuboidSelect,
        groupKey: "cuboid",
    });

    useEffect(() => {
        if (!cuboids) return;

        const currentIds = new Set(Object.keys(cuboidsRef.current));
        const newIds = new Set(cuboids.map((c) => c.id));

        cuboids.forEach((cuboid) => {
            if (!cuboidsRef.current[cuboid.id]) {
                const { cube } = addCuboid(scene, cuboid);
                cuboidsRef.current[cuboid.id] = cube.mesh;
                selectedCuboidRef.current = cuboid.id;
                onCuboidSelect(selectedCuboidRef.current);
            }
        });

        currentIds.forEach((id) => {
            if (!newIds.has(id)) {
                const mesh = cuboidsRef.current[id];
                scene.remove(mesh);
                delete cuboidsRef.current[id];
            }
        });
    }, [cuboids, scene]);
};
