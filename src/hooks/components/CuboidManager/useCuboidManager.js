import { useThree } from "@react-three/fiber";

import { useEffect, useCallback } from "react";

import { useCuboids, useEditor, useFileManager, useFrames, useEvent } from "contexts";
import { useTransformControls, useRaycastClickSelect, useOrthographicView } from "hooks";

import {
    addCuboid,
    removeCuboid,
    extractPsrFromObject,
    getPointsInsideCuboid,
} from "utils/cuboids";

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
        const cuboid = selectedCuboidRef.current;

        if (!cuboid) return;

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
            const cuboid = cuboidsRef.current[id].cube.mesh;
            selectedCuboidRef.current = cuboid;
            transformControlsRef.current.detach();
            sideViewsCamerasNeedUpdate.current = true;

            const cuboidData = cuboids.find((cube) => cube.id === id);
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
        console.log(
            "implement unselecting logic как-то блять чтоб не сломалось нахуй господи помогите",
        );
    }, []);

    useEffect(() => {
        const id = selectedCuboid?.id;
        id ? onCuboidSelect(id) : unselectCuboid();
    }, [selectedCuboid?.id]);

    useRaycastClickSelect({
        getMeshMap: () => {
            const meshMap = {};
            for (const id in cuboidsRef.current) {
                meshMap[id] = cuboidsRef.current[id].cube.mesh;
            }
            return meshMap;
        },
        onSelect: onCuboidSelect,
        groupKey: "cuboid",
    });

    useEffect(() => {
        const currentIds = new Set(Object.keys(cuboidsRef.current));
        const newIds = new Set(cuboids.map((c) => c.id));

        cuboids.forEach((cuboid) => {
            if (!cuboidsRef.current[cuboid.id]) {
                const cuboidObject = addCuboid(scene, cuboid);
                cuboidsRef.current[cuboid.id] = cuboidObject;
                selectedCuboidRef.current = cuboid.id;
                onCuboidSelect(selectedCuboidRef.current);
            }
        });

        currentIds.forEach((id) => {
            if (!newIds.has(id)) {
                const cuboidObject = cuboidsRef.current[id];
                removeCuboid(scene, cuboidObject);
                delete cuboidsRef.current[id];
            }
        });
    }, [cuboids, scene]);
};
