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
    const isEditingRef = useRef(false);

    useEffect(() => {
        const geometry = new THREE.BoxGeometry();
        const material = new THREE.MeshBasicMaterial({
            color: new THREE.Color(color),
            transparent: true,
            opacity: 0.05,
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
        transformControls.attach(cube);

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
        console.log("start editing", id);
        isEditingRef.current = true;
        controlsRef.current.enabled = false;
    };

    const transformFinished = () => {
        if (isEditingRef.current) {
            console.log("finish editing", id);
            isEditingRef.current = false;
            controlsRef.current.enabled = true;
        }
    };

    return null;
};
