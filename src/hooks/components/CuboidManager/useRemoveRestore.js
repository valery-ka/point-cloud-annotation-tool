import { useCallback } from "react";

import { useCuboids, useEditor, useFrames, useConfig } from "contexts";
import { useSaveSolution } from "hooks";

import { addCuboid, removeCuboid } from "utils/cuboids";
import { getNextId } from "utils/shared";

export const useRemoveRestore = () => {
    const { config } = useConfig();

    const { activeFrameIndex } = useFrames();
    const { sceneRef, cloudPointsColorNeedsUpdateRef } = useEditor();

    const {
        setCuboids,
        setSelectedCuboid,
        cuboidsGeometriesRef,
        cuboidsSolutionRef,
        pointsInsideCuboidsRef,
        deletedCuboidsRef,
        setDeletedObjects,
    } = useCuboids();

    const { saveObjectsSolution } = useSaveSolution();

    const getDeletedItemsList = useCallback(() => {
        return deletedCuboidsRef.current
            .map((item) => {
                const firstSolution = item.solutions[0];
                if (firstSolution && firstSolution.id && firstSolution.type) {
                    return `${firstSolution.id}_${firstSolution.type}`;
                }
                return null;
            })
            .filter(Boolean);
    }, []);

    const addRemovedObject = useCallback(
        (cuboid, toRestore) => {
            const { points, solutions } = toRestore;
            const toSelect = { id: cuboid.id, label: cuboid.label, color: cuboid.color };

            const restoreToScene = () => {
                const cuboidGeometry = addCuboid(sceneRef.current, cuboid);
                cuboidsGeometriesRef.current[cuboid.id] = cuboidGeometry;
            };

            const restoreSolutions = () => {
                solutions.forEach((frameSolution, frameIndex) => {
                    if (!cuboidsSolutionRef.current[frameIndex]) {
                        cuboidsSolutionRef.current[frameIndex] = [];
                    }

                    const restored = { ...frameSolution, id: cuboid.id };
                    cuboidsSolutionRef.current[frameIndex].push(restored);
                });
            };

            const restorePointMap = () => {
                for (const [filePath, pointData] of Object.entries(points)) {
                    if (!pointsInsideCuboidsRef.current[filePath]) {
                        pointsInsideCuboidsRef.current[filePath] = {};
                    }

                    pointsInsideCuboidsRef.current[filePath][cuboid.id] = new Uint32Array(
                        pointData,
                    );
                }
            };

            restoreToScene();
            restoreSolutions();
            restorePointMap();

            setSelectedCuboid(toSelect);
            saveObjectsSolution({ updateStack: false, isAutoSave: false });
        },
        [saveObjectsSolution],
    );

    const restoreObject = useCallback(
        (index) => {
            const objects = config.objects[0];

            const deletedCuboids = deletedCuboidsRef.current;
            const toRestore = deletedCuboids[index];

            const label = toRestore.solutions[activeFrameIndex].type;
            const color = objects[label].color;

            const position = toRestore.solutions[activeFrameIndex].psr.position;
            const scale = toRestore.solutions[activeFrameIndex].psr.scale;
            const rotation = toRestore.solutions[activeFrameIndex].psr.rotation;

            setCuboids((prev = []) => {
                const newId = String(getNextId(prev));
                const cuboid = {
                    id: newId,
                    label,
                    color,
                    position: [position.x, position.y, position.z],
                    scale: [scale.x, scale.y, scale.z],
                    rotation: [rotation.x, rotation.y, rotation.z],
                };
                addRemovedObject(cuboid, toRestore);

                deletedCuboids.splice(index, 1);
                setDeletedObjects(getDeletedItemsList());

                return [...prev, { id: newId, label, color }];
            });
        },
        [activeFrameIndex, config?.objects],
    );

    const removeObject = useCallback(
        (data) => {
            const cuboidId = data.index;
            const deletedObjects = deletedCuboidsRef.current;

            const removed = {
                geometry: null,
                solutions: [],
                points: {},
            };

            const removeFromScene = () => {
                for (const geometry of Object.values(cuboidsGeometriesRef.current)) {
                    if (geometry?.cube?.mesh?.name === cuboidId) {
                        removeCuboid(sceneRef.current, geometry);
                        removed.geometry = geometry;
                        delete cuboidsGeometriesRef.current[cuboidId];
                        break;
                    }
                }
            };

            const removeFromSolutions = () => {
                for (const [key, solution] of Object.entries(cuboidsSolutionRef.current)) {
                    for (let i = 0; i < solution.length; i++) {
                        if (solution[i]?.id === cuboidId) {
                            removed.solutions.push(solution[i]);
                            solution.splice(i, 1);
                            i--;
                        }
                    }
                }
            };

            const removeFromPointMap = () => {
                const ref = pointsInsideCuboidsRef.current;
                for (const [filePath, cuboidMap] of Object.entries(ref)) {
                    if (cuboidMap?.[cuboidId]) {
                        removed.points[filePath] = cuboidMap[cuboidId];
                        delete cuboidMap[cuboidId];

                        if (Object.keys(cuboidMap).length === 0) {
                            delete ref[filePath];
                        }
                    }
                }
            };

            removeFromScene();
            removeFromSolutions();
            removeFromPointMap();

            deletedObjects.push(removed);
            setDeletedObjects(getDeletedItemsList());

            setCuboids((prev) => prev.filter((c) => c.id !== cuboidId));
            setSelectedCuboid(null);
            saveObjectsSolution({ updateStack: false, isAutoSave: false });
            cloudPointsColorNeedsUpdateRef.current = true;
        },
        [saveObjectsSolution],
    );

    return { addRemovedObject, restoreObject, removeObject };
};
