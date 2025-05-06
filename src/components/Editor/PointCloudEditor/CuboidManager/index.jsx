import { Vector2, Vector3, Matrix4, Raycaster } from "three";
import { useThree } from "@react-three/fiber";

import { memo, useState, useCallback, useEffect, useRef } from "react";

import { useEditor, useFrames, useFileManager, useTools } from "contexts";

import { isEmpty } from "lodash";
import {
    TransformControls,
    createCubeGeometry,
    createEdgesGeometry,
    createArrowGeometry,
} from "utils/cuboids";
import { DEFAULT_TOOL } from "constants";

export const CuboidManager = memo(() => {
    const { gl, camera, scene } = useThree();

    const { pcdFiles } = useFileManager();
    const { pointCloudRefs } = useEditor();
    const { activeFrameIndex } = useFrames();
    const { selectedTool } = useTools();

    const [selectedCuboid, setSelectedCuboid] = useState(1);
    const [cuboids, setCuboids] = useState([
        {
            id: "0",
            position: [0, 0, 0],
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

    const cubeRefs = useRef({});
    const raycasterRef = useRef(new Raycaster());
    const mouseRef = useRef(new Vector2());

    useEffect(() => {
        raycasterRef.current.params.Line.threshold = 0;
    }, []);

    useEffect(() => {
        const createdCubes = [];

        cuboids.forEach((cuboid) => {
            const { color, position, scale, rotation } = cuboid;

            const cube = createCubeGeometry(color, position, scale, rotation);
            const edges = createEdgesGeometry(cube.mesh.geometry, color);
            const arrow = createArrowGeometry(color);

            cube.mesh.add(edges.mesh);
            cube.mesh.add(arrow.mesh);
            scene.add(cube.mesh);

            createdCubes.push({ cube, edges, arrow });
        });

        cubeRefs.current = createdCubes.map(({ cube }) => cube.mesh);

        return () => {
            createdCubes.forEach(({ cube, edges, arrow }) => {
                scene.remove(cube.mesh);
                cube.cleanup();
                edges.cleanup();
                arrow.cleanup();
            });
        };
    }, [gl.domElement, camera, scene, cuboids]);

    const { controlsRef } = useEditor();

    const transformControlsRef = useRef(null);
    const isDraggingRef = useRef(false);

    const onDraggingChanged = useCallback((event) => {
        isDraggingRef.current = event.value;
        controlsRef.current.enabled = !event.value;
    }, []);

    const onTransformChange = useCallback(() => {
        if (isDraggingRef.current && cubeRefs.current[selectedCuboid]) {
            if (isEmpty(pcdFiles)) {
                console.log("no points");
                return;
            }

            const cube = cubeRefs.current[selectedCuboid];
            const position = cube.position;
            const scale = cube.scale;

            const activeFrameFilePath = pcdFiles[activeFrameIndex];
            const activeFrame = pointCloudRefs.current[activeFrameFilePath];
            const positions = activeFrame.geometry.attributes.position.array;

            const matrix = new Matrix4();
            matrix.compose(position, cube.quaternion, scale);

            const inverseMatrix = new Matrix4().copy(matrix).invert();

            const halfSize = new Vector3(0.5, 0.5, 0.5);

            const point = new Vector3();
            const localPoint = new Vector3();

            const insidePoints = [];

            for (let i = 0; i < positions.length; i += 3) {
                point.set(positions[i], positions[i + 1], positions[i + 2]);

                localPoint.copy(point).applyMatrix4(inverseMatrix);

                if (
                    Math.abs(localPoint.x) <= halfSize.x &&
                    Math.abs(localPoint.y) <= halfSize.y &&
                    Math.abs(localPoint.z) <= halfSize.z
                ) {
                    insidePoints.push(i / 3);
                }
            }
            console.log("---------------------------");
            console.log("Points inside box", insidePoints);
            console.log("---------------------------");
        }
    }, [pcdFiles, activeFrameIndex, selectedCuboid]);

    const handleMouseDown = useCallback(
        (event) => {
            if (event.button !== 0) return;

            const { current: raycaster } = raycasterRef;
            const { current: mouse } = mouseRef;

            const canvas = event.currentTarget;
            const rect = canvas.getBoundingClientRect();

            mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

            raycaster.setFromCamera(mouse, camera);

            const meshes = Object.values(cubeRefs.current).filter((obj) => obj.isMesh);
            const intersects = raycaster.intersectObjects(meshes);

            mouseRef.current.downIntersect = intersects[0]?.object || null;
        },
        [camera],
    );

    const handleMouseUp = useCallback(
        (event) => {
            const { current: raycaster } = raycasterRef;
            const { current: mouse } = mouseRef;

            if (!mouse.downIntersect) return;

            const canvas = event.currentTarget;
            const rect = canvas.getBoundingClientRect();

            mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

            raycaster.setFromCamera(mouse, camera);

            const meshes = Object.values(cubeRefs.current).filter((obj) => obj.isMesh);
            const intersects = raycaster.intersectObjects(meshes);

            const isSameObject = intersects.some(
                (intersect) => intersect.object === mouse.downIntersect,
            );

            if (isSameObject && selectedTool === DEFAULT_TOOL) {
                const clickedCuboid = Object.entries(cubeRefs.current).find(
                    ([_, obj]) => obj === mouse.downIntersect,
                )?.[0];
                setSelectedCuboid(clickedCuboid);
            }

            mouseRef.current.downIntersect = null;
        },
        [selectedTool, camera],
    );

    useEffect(() => {
        const canvas = gl.domElement;
        canvas.addEventListener("mousedown", handleMouseDown);
        canvas.addEventListener("mouseup", handleMouseUp);

        return () => {
            canvas.removeEventListener("mousedown", handleMouseDown);
            canvas.removeEventListener("mouseup", handleMouseUp);
        };
    }, [handleMouseDown, handleMouseUp, gl.domElement]);

    useEffect(() => {
        const transformControls = new TransformControls(camera, gl.domElement);
        transformControls.setSpace("local");
        transformControlsRef.current = transformControls;
        scene.add(transformControls);

        transformControls.addEventListener("dragging-changed", onDraggingChanged);

        return () => {
            transformControls.removeEventListener("dragging-changed", onDraggingChanged);
            scene.remove(transformControls);
        };
    }, [gl.domElement, camera, scene]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "x") {
                transformControlsRef.current.detach();
            } else if (e.key === "w") {
                const object = cubeRefs.current[selectedCuboid];
                if (object) {
                    transformControlsRef.current.attach(object);
                }
            } else if (e.key === "a") {
                transformControlsRef.current.mode = "translate";
            } else if (e.key === "s") {
                transformControlsRef.current.mode = "scale";
            } else if (e.key === "d") {
                transformControlsRef.current.mode = "rotate";
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        transformControlsRef.current.addEventListener("change", onTransformChange);

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            transformControlsRef.current.removeEventListener("change", onTransformChange);
            transformControlsRef.current.detach();
        };
    }, [onTransformChange]);

    return null;
});
