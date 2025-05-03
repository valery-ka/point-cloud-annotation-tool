import { useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";

import { useEditor } from "contexts";

import {
    TransformControls,
    createCubeGeometry,
    createEdgesGeometry,
    createArrowGeometry,
} from "utils/cuboids";

export const Cuboid = ({
    id = 0,
    position = [0, 0, 0],
    scale = [1, 1, 1],
    rotation = [0, 0, 0],
    color = "red",
}) => {
    const { gl, scene, camera } = useThree();
    const { controlsRef } = useEditor();

    const cubeRef = useRef();
    const edgesRef = useRef();
    const transformControlsRef = useRef(null);
    const isCuboidEditingRef = useRef(false);

    useEffect(() => {
        const cube = createCubeGeometry(color, position, scale, rotation);
        const edges = createEdgesGeometry(cube.mesh.geometry, color);
        const arrow = createArrowGeometry(color, scale, rotation, -cube.mesh.position.z);

        cube.mesh.add(edges.mesh);
        cube.mesh.add(arrow.mesh);
        scene.add(cube.mesh);

        const transformControls = new TransformControls(camera, gl.domElement);
        transformControlsRef.current = transformControls;
        scene.add(transformControls);

        const onMouseDown = () => transformStart();
        const onMouseUp = () => transformFinished();

        transformControls.addEventListener("mouseDown", onMouseDown);
        transformControls.addEventListener("mouseUp", onMouseUp);

        cubeRef.current = cube.mesh;
        edgesRef.current = edges.mesh;

        return () => {
            transformControls.removeEventListener("mouseDown", onMouseDown);
            transformControls.removeEventListener("mouseUp", onMouseUp);
            transformControls.detach();

            scene.remove(cube.mesh);
            scene.remove(transformControls);

            cube.cleanup();
            edges.cleanup();
            arrow.cleanup();
        };
    }, [camera, color, gl.domElement, position, rotation, scale, scene]);

    const transformStart = () => {
        isCuboidEditingRef.current = true;
        controlsRef.current.enabled = false;
    };

    const transformFinished = () => {
        if (isCuboidEditingRef.current) {
            isCuboidEditingRef.current = false;
            controlsRef.current.enabled = true;

            const cube = cubeRef.current;
            const actualPosition = cube.position.toArray();
            const actualScale = cube.scale.toArray();
            const actualRotation = [cube.rotation.x, cube.rotation.y, cube.rotation.z];

            console.log("finish editing", id);
            console.log("Actual position:", actualPosition);
            console.log("Actual scale:", actualScale);
            console.log("Actual rotation:", actualRotation);
        }
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "x") {
                transformControlsRef.current.detach();
            } else if (e.key === "w") {
                transformControlsRef.current.attach(cubeRef.current);
            } else if (e.key === "a") {
                transformControlsRef.current.mode = "translate";
            } else if (e.key === "s") {
                transformControlsRef.current.mode = "scale";
            } else if (e.key === "d") {
                transformControlsRef.current.mode = "rotate";
            }
        };

        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, []);

    return null;
};
