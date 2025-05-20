import { useThree } from "@react-three/fiber";

import { memo, useEffect, useRef, useCallback } from "react";

import { useObjects, useEditor } from "contexts";
import { useTransformControls, useRaycastClickSelect, useOrthographicView } from "hooks";

import { addCuboid, removeCuboid } from "utils/cuboids";

export const CuboidManager = memo(() => {
    const { scene } = useThree();

    const { transformControlsRef } = useEditor();
    const { cuboids, selectedCuboidRef, sideViewsCamerasNeedUpdate } = useObjects();

    const cubeRefs = useRef({});

    useOrthographicView();
    useTransformControls();

    const onCuboidSelect = useCallback((id) => {
        const mesh = cubeRefs.current[id];
        selectedCuboidRef.current = mesh;

        transformControlsRef.current.detach();

        sideViewsCamerasNeedUpdate.current = true;
    }, []);

    useRaycastClickSelect({
        getMeshMap: () => cubeRefs.current,
        onSelect: onCuboidSelect,
        groupKey: "cuboid",
    });

    useEffect(() => {
        if (!cuboids) return;

        const createdCubes = cuboids.map((cuboid) => addCuboid(scene, cuboid));
        cubeRefs.current = createdCubes.map(({ cube }) => cube.mesh);

        return () => {
            createdCubes.forEach((cuboid) => {
                removeCuboid(scene, cuboid);
            });
        };
    }, [cuboids, scene]);
});
