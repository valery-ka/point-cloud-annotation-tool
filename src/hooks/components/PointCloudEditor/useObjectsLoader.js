import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";

import { useFileManager, useEditor, useConfig, useCuboids, useLoading } from "contexts";

import { loadObjects } from "utils/editor";
import { addCuboid, getPointsInsideCuboid } from "utils/cuboids";

export const useObjectsLoader = () => {
    const { scene } = useThree();

    const { config } = useConfig();
    const { pointCloudRefs } = useEditor();
    const { pcdFiles, folderName } = useFileManager();
    const { loadedData, setLoadedData, setLoadingProgress } = useLoading();

    const {
        cuboidIdToLabelRef,
        pointsInsideCuboidsRef,
        cuboidsGeometriesRef,
        cuboidsSolutionRef,
        setCuboids,
        prevCuboidsRef,
    } = useCuboids();

    const objectsCacheRef = useRef({});

    const findPointsInsideCuboids = () => {
        const colors = pointsInsideCuboidsRef.current;
        const labels = cuboidIdToLabelRef.current;

        Object.keys(colors).forEach((filePath) => {
            colors[filePath] = {};
        });
        Object.keys(labels).forEach((key) => {
            delete labels[key];
        });

        pcdFiles.forEach((filePath, frameIndex) => {
            const cloud = pointCloudRefs.current[filePath];
            if (!cloud) return;

            const positions = cloud.geometry.attributes.position.array;
            const frameSolution = cuboidsSolutionRef.current[frameIndex];
            if (!frameSolution) return;

            colors[filePath] = colors[filePath] || {};

            Object.values(frameSolution).forEach((cuboid) => {
                const { id, label, psr, visible } = cuboid;
                const { position, scale, quaternion } = psr;

                const points = getPointsInsideCuboid(
                    positions,
                    position,
                    quaternion,
                    scale,
                    visible,
                );

                colors[filePath][id] = new Uint32Array(points);
                labels[id] = label;
            });
        });
    };

    useEffect(() => {
        if (!config.objects || !loadedData.odometry) return;
        const message = "loadingObjects";

        const onFinish = () => {
            setLoadingProgress({ message: message, progress: 0, isLoading: false });
            setLoadedData((prev) => ({
                ...prev,
                solution: {
                    ...prev.solution,
                    objects: true,
                },
            }));
        };

        const loadAllObjects = async () => {
            setLoadingProgress({ message: message, progress: 0, isLoading: true });
            if (!objectsCacheRef.current[folderName]) {
                try {
                    const objects = await loadObjects(folderName);
                    cuboidsSolutionRef.current = structuredClone(objects);
                    prevCuboidsRef.current = structuredClone(objects);
                } catch (error) {
                    console.error(`Error loading objects for ${folderName}`, error);
                }

                const solution = cuboidsSolutionRef.current[0];

                if (!solution) {
                    onFinish();
                    return;
                }

                const objectsConfig = config.objects[0];

                setCuboids((prev = []) => {
                    const newCuboids = [];

                    Object.values(solution).forEach(({ id, type, label, psr }) => {
                        const { position, scale, rotation } = psr;
                        const cuboidToAdd = {
                            id,
                            type,
                            label,
                            color: objectsConfig[label]?.color,
                            position: [position.x, position.y, position.z],
                            scale: [scale.x, scale.y, scale.z],
                            rotation: [rotation.x, rotation.y, rotation.z],
                        };

                        const cuboidGeometry = addCuboid(scene, cuboidToAdd);
                        cuboidGeometry.cube.mesh.visible = false;
                        cuboidsGeometriesRef.current[cuboidToAdd.id] = cuboidGeometry;

                        newCuboids.push({
                            id,
                            type,
                            label,
                            color: cuboidToAdd.color,
                        });
                    });

                    return [...prev, ...newCuboids];
                });
            }
            onFinish();
        };

        if (folderName.length) {
            loadAllObjects();
        }
    }, [folderName, config, loadedData.odometry]);

    return { findPointsInsideCuboids };
};
