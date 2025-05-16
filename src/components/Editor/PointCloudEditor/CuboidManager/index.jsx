import { useThree } from "@react-three/fiber";

import { memo, useState, useEffect, useRef, useCallback } from "react";

import { useSideViews } from "contexts";
import { useTransformControls, useRaycastClickSelect, useOrthographicView } from "hooks";

import { addCuboid, removeCuboid } from "utils/cuboids";

export const CuboidManager = memo(() => {
    const { scene } = useThree();
    const { selectedCuboidRef } = useSideViews();

    const cubeRefs = useRef({});
    const [cuboids, setCuboids] = useState([
        {
            id: "0",
            position: [0, -2, 0],
            scale: [4.5, 2, 1.7],
            rotation: [0, 0, 0],
            color: "red",
        },
        {
            id: "1",
            position: [0, 5, 0],
            scale: [6, 2.55, 2.85],
            rotation: [0, 0, 0],
            color: "yellow",
        },
    ]);

    const { updateAllCameras: updateAllSideViewCameras } = useOrthographicView({
        selectedCuboidRef,
    });

    const onTransformFinished = useCallback(() => {
        updateAllSideViewCameras(selectedCuboidRef.current);
    }, [updateAllSideViewCameras]);

    const { transformControlsRef } = useTransformControls({
        selectedCuboidRef,
        onTransformFinished,
        updateAllSideViewCameras,
    });

    const onCuboidSelect = useCallback(
        (id) => {
            const mesh = cubeRefs.current[id];
            selectedCuboidRef.current = mesh;

            transformControlsRef.current.detach();
            transformControlsRef.current.attach(selectedCuboidRef.current);

            updateAllSideViewCameras(selectedCuboidRef.current);
        },
        [updateAllSideViewCameras],
    );

    useRaycastClickSelect({
        getMeshMap: () => cubeRefs.current,
        onSelect: onCuboidSelect,
        groupKey: "cuboid",
    });

    useEffect(() => {
        const createdCubes = cuboids.map((cuboid) => addCuboid(scene, cuboid));
        cubeRefs.current = createdCubes.map(({ cube }) => cube.mesh);

        return () => {
            createdCubes.forEach((cuboid) => {
                removeCuboid(scene, cuboid);
            });
        };
    }, [cuboids, scene]);
});
