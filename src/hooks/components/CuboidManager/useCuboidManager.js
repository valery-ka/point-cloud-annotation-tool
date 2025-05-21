import { useThree } from "@react-three/fiber";

import { memo, useEffect, useRef, useCallback } from "react";

import { useCuboids, useEditor } from "contexts";
import { useTransformControls, useRaycastClickSelect, useOrthographicView } from "hooks";

import { addCuboid, removeCuboid } from "utils/cuboids";

export const useCuboidManager = () => {
    const { scene } = useThree();

    const { transformControlsRef } = useEditor();
    const {
        cuboids,
        cuboidsRef,
        selectedCuboid,
        selectedCuboidRef,
        sideViewsCamerasNeedUpdate,
        setSelectedCuboid,
    } = useCuboids();

    useOrthographicView();
    useTransformControls();

    const onCuboidSelect = useCallback(
        (id) => {
            const mesh = cuboidsRef.current[id];
            selectedCuboidRef.current = mesh;
            transformControlsRef.current.detach();
            setSelectedCuboid(cuboids[id]);
            sideViewsCamerasNeedUpdate.current = true;
        },
        [cuboids],
    );

    useEffect(() => {
        const id = selectedCuboid?.id;
        const cuboid = cuboids.findIndex((obj) => obj.id === id);
        if (cuboid !== -1) {
            onCuboidSelect(cuboid);
        } else {
            transformControlsRef.current.detach();
            selectedCuboidRef.current = null;
        }
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
