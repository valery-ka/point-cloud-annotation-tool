import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";

import { useEditor } from "contexts";

import { TransformControls } from "utils/cuboids";

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
        const geometry = new THREE.BoxGeometry();
        const material = new THREE.MeshBasicMaterial({
            color: new THREE.Color(color),
            transparent: true,
            opacity: 0.025,
            side: THREE.DoubleSide,
        });
        const edgesMaterial = new THREE.LineBasicMaterial({
            color: new THREE.Color(color),
            linewidth: 2,
        });

        const cube = new THREE.Mesh(geometry, material);
        cube.position.set(...position);
        cube.scale.set(...scale);
        cube.rotation.set(...rotation);
        cubeRef.current = cube;

        const edgesGeometry = new THREE.EdgesGeometry(geometry);
        const edges = new THREE.LineSegments(edgesGeometry, edgesMaterial);
        edgesRef.current = edges;

        cube.add(edges);
        scene.add(cube);

        const transformControls = new TransformControls(camera, gl.domElement);
        transformControlsRef.current = transformControls;
        scene.add(transformControls);

        const onMouseDown = () => transformStart();
        const onMouseUp = () => transformFinished();

        transformControls.addEventListener("mouseDown", onMouseDown);
        transformControls.addEventListener("mouseUp", onMouseUp);

        return () => {
            transformControls.removeEventListener("mouseDown", onMouseDown);
            transformControls.removeEventListener("mouseUp", onMouseUp);
            transformControls.detach();

            scene.remove(cube);
            scene.remove(transformControls);

            geometry.dispose();
            material.dispose();
            edgesGeometry.dispose();
            edgesMaterial.dispose();
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
