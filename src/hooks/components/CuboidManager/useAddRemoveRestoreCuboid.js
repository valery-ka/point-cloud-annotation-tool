import { useCallback } from "react";

import {
    useCuboids,
    useEditor,
    useFrames,
    useConfig,
    useFileManager,
    useEvent,
    useImages,
} from "contexts";
import { useSaveSolution } from "hooks";

import { addCuboid, updateCuboid, removeCuboid, writePSRToSolution } from "utils/cuboids";
import { getNextId } from "utils/shared";

export const useAddRemoveRestoreCuboid = () => {
    const { publish } = useEvent();
    const { config } = useConfig();
    const { pcdFiles } = useFileManager();

    const { activeFrameIndex } = useFrames();
    const { sceneRef, cloudPointsColorNeedsUpdateRef, undoStackRef, redoStackRef } = useEditor();

    const {
        setCuboids,
        setSelectedCuboid,
        cuboidsGeometriesRef,
        cuboidsSolutionRef,
        pointsInsideCuboidsRef,
        deletedCuboidsRef,
        setDeletedObjects,
        selectedCuboidInfoRef,
        updateSingleCuboidRef,
        cuboidIdToLabelRef,
        prevCuboidsRef,
        selectedCuboidGeometryRef,
    } = useCuboids();

    const { imagePointsAlphaNeedsUpdateRef } = useImages();

    const { saveObjectsSolution } = useSaveSolution();

    const resetUndoRedoStacks = useCallback(() => {
        undoStackRef.current = {};
        redoStackRef.current = {};
        prevCuboidsRef.current = structuredClone(cuboidsSolutionRef.current);
        publish("updateUndoRedoState");
    }, [publish]);

    const getDeletedItemsList = useCallback(() => {
        return deletedCuboidsRef.current
            .map((item) => {
                const firstSolution = item.solutions[0];
                if (firstSolution && firstSolution.id && firstSolution.label) {
                    return `ID: ${firstSolution.id} Label: ${firstSolution.label}`;
                }
                return null;
            })
            .filter(Boolean);
    }, []);

    const initializeCuboidPSRForAllFrames = useCallback(
        (mesh) => {
            const allFrames = pcdFiles.map((_, i) => i);
            writePSRToSolution({
                mesh,
                frameIndices: allFrames,
                cuboidsSolutionRef,
            });
        },
        [pcdFiles],
    );

    const addCuboidOnScene = useCallback(
        (cuboid) => {
            const toSelect = {
                id: cuboid.id,
                type: cuboid.type,
                label: cuboid.label,
                color: cuboid.color,
            };
            const cuboidGeometry = addCuboid(sceneRef.current, cuboid);
            cuboidsGeometriesRef.current[cuboid.id] = cuboidGeometry;

            initializeCuboidPSRForAllFrames(cuboidGeometry.cube.mesh);
            setSelectedCuboid(toSelect);

            resetUndoRedoStacks();
            updateSingleCuboidRef.current = { needsUpdate: true, id: cuboid.id };
            saveObjectsSolution({ updateStack: false, isAutoSave: false });
        },
        [saveObjectsSolution, initializeCuboidPSRForAllFrames, resetUndoRedoStacks],
    );

    const addNewObject = useCallback(
        (object, position) => {
            const { color, type, label, dimensions } = object;
            const { selected, scale, position: selPos, rotation } = selectedCuboidInfoRef.current;

            const objectScale = [dimensions.length, dimensions.width, dimensions.height];

            const newPosition = selected
                ? [position[0], position[1], selPos[2] - (scale[2] - objectScale[2]) / 2]
                : [position[0], position[1], position[2] + objectScale[2] / 2];

            setCuboids((prev = []) => {
                const newId = String(getNextId(prev, deletedCuboidsRef.current));
                const cuboid = {
                    id: newId,
                    type,
                    label,
                    color,
                    position: newPosition,
                    scale: objectScale,
                    rotation: selected ? rotation : [0, 0, 0],
                };
                addCuboidOnScene(cuboid);
                return [...prev, { id: newId, type, label, color }];
            });
        },
        [addCuboidOnScene],
    );

    const cloneObject = useCallback(
        (clickedInfoRef, resetContextMenu) => {
            publish("copyObjectTransform");

            const toClone = selectedCuboidGeometryRef.current;

            const color = toClone.userData.color;
            const type = toClone.userData.type;
            const label = toClone.userData.label;
            const dimensions = {
                length: toClone.scale.x,
                width: toClone.scale.y,
                height: toClone.scale.z,
            };

            const object = { color, type, label, dimensions };
            const position = clickedInfoRef.current.position;

            addNewObject(object, position);
            resetContextMenu();
        },
        [publish, addNewObject],
    );

    const updateExistingObject = useCallback(
        (id, object) => {
            const { type, label, color } = object;

            const newAttributesList = config.objects[0][label].attributes;

            updateCuboid({
                cuboid: {
                    id: id,
                    type: type,
                    label: label,
                    color: color,
                    attributes: newAttributesList,
                },
                refs: {
                    geometries: cuboidsGeometriesRef,
                    solution: cuboidsSolutionRef,
                },
            });

            setCuboids((prev) =>
                prev.map((cuboid) =>
                    cuboid.id === id ? { ...cuboid, type, label, color } : cuboid,
                ),
            );
            setSelectedCuboid({ id, type, label, color });

            updateSingleCuboidRef.current = { needsUpdate: true, id: id };
            saveObjectsSolution({ updateStack: false, isAutoSave: false });
        },
        [config, saveObjectsSolution],
    );

    const addRemovedObject = useCallback(
        (cuboid, toRestore) => {
            const { points, solutions } = toRestore;
            const toSelect = {
                id: cuboid.id,
                type: cuboid.type,
                label: cuboid.label,
                color: cuboid.color,
            };

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
                updateSingleCuboidRef.current = { needsUpdate: true, id: cuboid.id };
            };

            restoreToScene();
            restoreSolutions();
            restorePointMap();

            setSelectedCuboid(toSelect);

            resetUndoRedoStacks();
            saveObjectsSolution({ updateStack: false, isAutoSave: false });
        },
        [saveObjectsSolution, resetUndoRedoStacks],
    );

    const restoreObject = useCallback(
        (index) => {
            const objects = config.objects[0];

            const deletedCuboids = deletedCuboidsRef.current;
            const toRestore = deletedCuboids[index];

            const type = toRestore.solutions[activeFrameIndex].type;
            const label = toRestore.solutions[activeFrameIndex].label;
            const color = objects[label].color;

            const { position, scale, rotation } = toRestore.solutions[activeFrameIndex].psr;

            setCuboids((prev = []) => {
                const newId = String(getNextId(prev, deletedCuboids));
                const cuboid = {
                    id: newId,
                    type,
                    label,
                    color,
                    position: [position.x, position.y, position.z],
                    scale: [scale.x, scale.y, scale.z],
                    rotation: [rotation.x, rotation.y, rotation.z],
                };
                addRemovedObject(cuboid, toRestore);

                deletedCuboids.splice(index, 1);
                setDeletedObjects(getDeletedItemsList());

                return [...prev, { id: newId, type, label, color }];
            });
        },
        [activeFrameIndex, config?.objects],
    );

    const removeObject = useCallback(
        (data) => {
            const cuboidId = data.index;
            const deletedObjects = deletedCuboidsRef.current;

            const removed = {
                id: cuboidId,
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

            const removeFromLabelMap = () => {
                delete cuboidIdToLabelRef.current[cuboidId];
            };

            removeFromScene();
            removeFromSolutions();
            removeFromPointMap();
            removeFromLabelMap();

            deletedObjects.push(removed);
            setDeletedObjects(getDeletedItemsList());
            setCuboids((prev) => prev.filter((c) => c.id !== cuboidId));
            setSelectedCuboid(null);

            resetUndoRedoStacks();
            saveObjectsSolution({ updateStack: false, isAutoSave: false });

            cloudPointsColorNeedsUpdateRef.current = true;
            imagePointsAlphaNeedsUpdateRef.current = true;
        },
        [saveObjectsSolution, resetUndoRedoStacks],
    );

    return {
        addNewObject,
        cloneObject,
        updateExistingObject,
        addRemovedObject,
        restoreObject,
        removeObject,
    };
};
