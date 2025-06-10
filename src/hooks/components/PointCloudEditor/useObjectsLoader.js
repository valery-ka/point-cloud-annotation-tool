import { useEffect, useRef, useState } from "react";
import { useThree } from "@react-three/fiber";

import { useFileManager, useEditor, useConfig, useCuboids } from "contexts";

import { loadObjects } from "utils/editor";
import { addCuboid, getPointsInsideCuboid } from "utils/cuboids";

export const useObjectsLoader = () => {
    const { scene } = useThree();

    const { config } = useConfig();
    const { pointCloudRefs } = useEditor();
    const { pcdFiles, folderName } = useFileManager();
    const {
        cuboidIdToLabelRef,
        pointsInsideCuboidsRef,
        cuboidsGeometriesRef,
        cuboidsSolutionRef,
        setCuboids,
        prevCuboidsRef,
    } = useCuboids();

    const objectsCacheRef = useRef({});
    const [areObjectsLoaded, setAreObjectsLoaded] = useState(false);

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
                const { id, type: label, psr, visible } = cuboid;
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
        if (!config.objects) return;

        const loadAllObjects = async () => {
            if (!objectsCacheRef.current[folderName]) {
                try {
                    const objects = await loadObjects(folderName);
                    cuboidsSolutionRef.current = structuredClone(objects);
                    prevCuboidsRef.current = structuredClone(objects);
                    console.log("objects", objects);
                } catch (error) {
                    console.error(`Error loading objects for ${folderName}`, error);
                }

                const solution = cuboidsSolutionRef.current[0];

                if (!solution) {
                    setAreObjectsLoaded(true);
                    return;
                }

                const objectsConfig = config.objects[0];

                setCuboids((prev = []) => {
                    const newCuboids = [];

                    Object.values(solution).forEach(({ id, type: label, psr }) => {
                        const { position, scale, rotation } = psr;
                        const cuboidToAdd = {
                            id,
                            label,
                            color: objectsConfig[label].color,
                            position: [position.x, position.y, position.z],
                            scale: [scale.x, scale.y, scale.z],
                            rotation: [rotation.x, rotation.y, rotation.z],
                        };

                        const cuboidGeometry = addCuboid(scene, cuboidToAdd);
                        cuboidGeometry.cube.mesh.visible = false;
                        cuboidsGeometriesRef.current[cuboidToAdd.id] = cuboidGeometry;

                        newCuboids.push({
                            id,
                            label,
                            color: cuboidToAdd.color,
                        });
                    });

                    return [...prev, ...newCuboids];
                });
            }
            setAreObjectsLoaded(true);
        };

        if (folderName.length) {
            loadAllObjects();
        }
    }, [folderName, config]);

    return { areObjectsLoaded, findPointsInsideCuboids };
};
