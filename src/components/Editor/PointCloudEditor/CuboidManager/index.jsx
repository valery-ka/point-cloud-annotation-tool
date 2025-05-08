import { useThree } from "@react-three/fiber";

import { memo, useState, useEffect, useRef, useCallback } from "react";

import { useTransformControls, useRaycastClickSelect, useOrthographicView } from "hooks";

import { addCuboid, removeCuboid } from "utils/cuboids";

export const CuboidManager = memo(() => {
    const { scene } = useThree();

    const cubeRefs = useRef({});
    const selectedCuboidRef = useRef(null);
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

    const { updateCamera: updateTopViewCamera } = useOrthographicView({
        viewId: "top-view",
        scaleOrder: ["x", "y", "z"],
        computeCameraOrientation: (camera) => {
            camera.up.set(0, 1, 0);
            camera.rotateZ(-Math.PI / 2);
        },
    });

    const { updateCamera: updateLeftViewCamera } = useOrthographicView({
        viewId: "left-view",
        scaleOrder: ["z", "x", "y"],
        computeCameraOrientation: (camera) => {
            camera.up.set(0, 0, 1);
            camera.rotateX(Math.PI / 2);
        },
    });

    const { updateCamera: updateFrontViewCamera } = useOrthographicView({
        viewId: "front-view",
        scaleOrder: ["y", "z", "x"],
        computeCameraOrientation: (camera) => {
            camera.up.set(0, 1, 0);
            camera.rotateX(Math.PI / 2);
            camera.rotateY(-Math.PI / 2);
        },
    });

    const updateAllSideViewCameras = useCallback((mesh) => {
        updateTopViewCamera(mesh);
        updateLeftViewCamera(mesh);
        updateFrontViewCamera(mesh);
    }, []);

    const onTransformFinished = useCallback(() => {
        const mesh = cubeRefs.current[selectedCuboidRef.current];
        updateAllSideViewCameras(mesh);
    }, []);

    const { transformControlsRef } = useTransformControls({
        cubeRefs,
        selectedCuboidRef,
        onTransformFinished,
        updateAllSideViewCameras,
    });

    const onCuboidSelect = useCallback((id) => {
        const mesh = cubeRefs.current[id];
        selectedCuboidRef.current = id;

        transformControlsRef.current.detach();
        transformControlsRef.current.attach(mesh);

        updateAllSideViewCameras(mesh);
    }, []);

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
