import React, { useEffect, useState, useCallback, useRef, memo } from "react";
import { useTranslation } from "react-i18next";
import { faEye, faEyeSlash, faPlus } from "@fortawesome/free-solid-svg-icons";

import {
    useEditor,
    useConfig,
    useEvent,
    useSettings,
    useTools,
    useCuboids,
    useBatch,
    useFrames,
} from "contexts";
import { useSubscribeFunction, useBindHotkey, useContextMenuSelector } from "hooks";

import { ContextMenu } from "components";

import { SidebarIcon } from "../SidebarIcon";
import { ClassItem } from "./ClassItem";
import { CuboidItem } from "./CuboidItem";

import { addCuboid } from "utils/cuboids";
import { getNextId } from "utils/shared";
import * as APP_CONSTANTS from "constants";

// const COMPONENT_NAME = "ObjectsTab.";
const COMPONENT_NAME = "";
const { DEFAULT_TOOL } = APP_CONSTANTS;

export const ObjectsTab = memo(({ title }) => {
    const { config, nonHiddenClasses } = useConfig();
    const { publish, subscribe, unsubscribe } = useEvent();
    const { sceneRef, classesVisibilityRef, selectedClassIndex, setSelectedClassIndex } =
        useEditor();
    const {
        cuboids,
        setCuboids,
        selectedCuboid,
        setSelectedCuboid,
        deletedObjects,
        deletedCuboidsRef,
        cuboidsGeometriesRef,
        cuboidsSolutionRef,
        pointsInsideCuboidsRef,
    } = useCuboids();
    const { setBatchMode } = useBatch();
    const { setSelectedTool } = useTools();
    const { settings } = useSettings();
    const { hotkeys } = settings;
    const { t } = useTranslation();

    const [visibilityState, setVisibilityState] = useState({});

    const containerRef = useRef(null);

    const handleIsClassVisible = useCallback((cls) => {
        return classesVisibilityRef.current[cls]?.visible;
    }, []);

    const handleIsObjectVisible = useCallback((obj) => {
        return true;
    }, []);

    const getHideShowToggleState = useCallback(() => {
        return Object.values(classesVisibilityRef.current).every((cls) => cls.visible === true);
    }, []);

    const handleVisibilityState = useCallback(() => {
        const newVisibilityState = Object.fromEntries(
            Object.entries(classesVisibilityRef.current).map(([idx, cls]) => [idx, cls.visible]),
        );
        setVisibilityState(newVisibilityState);
    }, []);

    useSubscribeFunction("filterClass", handleVisibilityState, []);

    const unselectObject = useCallback(() => {
        setSelectedClassIndex(null);
        setSelectedCuboid(null);
        setBatchMode(false);
        setSelectedTool(DEFAULT_TOOL);
    }, []);

    useBindHotkey(hotkeys["fixed"]["unselectObject"], unselectObject);

    // вынести восстановление объекта в отдельное место
    // СТАРТ
    const { activeFrameIndex } = useFrames();

    const addCuboidOnScene = useCallback(
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
            publish("saveObjectsSolution", { updateStack: false, isAutoSave: false });
        },
        [publish],
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
                addCuboidOnScene(cuboid, toRestore);
                deletedCuboids.splice(index, 1);
                return [...prev, { id: newId, label, color }];
            });
        },
        [activeFrameIndex, config?.objects],
    );
    // КОНЕЦ
    //

    const {
        openContextMenu,
        contextMenuPosition,
        handleSelect,
        handleCloseContextMenu,
        setMenuDimensions,
    } = useContextMenuSelector({
        wrapperRef: containerRef,
        onSelect: restoreObject,
    });

    useEffect(() => {
        const subscriptions = nonHiddenClasses.map((cls, index) => {
            const originalIndex = cls.originalIndex;
            const actionName = `selectClass${originalIndex}`;
            const callback = () => {
                setSelectedCuboid(null);
                setSelectedClassIndex(index);
            };
            subscribe(actionName, callback);
            return { actionName, callback };
        });

        return () => {
            subscriptions.forEach(({ actionName, callback }) => {
                unsubscribe(actionName, callback);
            });
        };
    }, [subscribe, unsubscribe, nonHiddenClasses]);

    useEffect(() => {
        const subscriptions = cuboids.map((obj, index) => {
            const id = obj.id;
            const actionName = `selectObject${id}`;
            const callback = () => {
                setSelectedClassIndex(null);
                setSelectedCuboid(obj);
            };
            subscribe(actionName, callback);
            return { actionName, callback };
        });

        return () => {
            subscriptions.forEach(({ actionName, callback }) => {
                unsubscribe(actionName, callback);
            });
        };
    }, [subscribe, unsubscribe, cuboids]);

    useEffect(() => {
        if (selectedCuboid) {
            setSelectedClassIndex(null);
        }
    }, [selectedCuboid]);

    return (
        <div className="sidebar-tab-panel" ref={containerRef}>
            <div className="tab-header-container" onClick={unselectObject}>
                <h2 className="tab-header">{title}</h2>
                <div className="tab-header-buttons">
                    <SidebarIcon
                        className="icon-style"
                        size="20px"
                        title={
                            getHideShowToggleState()
                                ? t(`${COMPONENT_NAME}hideAll`)
                                : t(`${COMPONENT_NAME}showAll`)
                        }
                        icon={getHideShowToggleState() ? faEyeSlash : faEye}
                        type={"filterClass"}
                        action={getHideShowToggleState() ? "hideAll" : "showAll"}
                        hotkey={hotkeys["misc"]["hideShowAll"]}
                    />
                    {/* гига криво появляется и вообще пока что без понятия почему */}
                    <div
                        onMouseUp={() =>
                            openContextMenu({
                                offsetX: -40,
                                offsetY: -40,
                            })
                        }
                    >
                        <SidebarIcon
                            className="icon-style"
                            size="20px"
                            title="Список удаленных кубоидов"
                            icon={faPlus}
                        />
                    </div>
                </div>
            </div>
            <div className="sidebar-content">
                <div className="classes-list">
                    {nonHiddenClasses.map((cls, idx) => (
                        <ClassItem
                            key={idx}
                            cls={cls}
                            index={cls.originalIndex}
                            action={`selectClass${cls.originalIndex}`}
                            hotkey={hotkeys["selectClass"]?.[`selectClass${cls.originalIndex}`]}
                            isSelected={selectedClassIndex === idx}
                            isVisible={handleIsClassVisible(cls.originalIndex)}
                        />
                    ))}
                </div>
                <div className="cuboids-list">
                    {cuboids.length > 0 &&
                        cuboids.map((obj, idx) => (
                            <CuboidItem
                                key={idx}
                                obj={obj}
                                index={idx}
                                action={`selectObject${obj.id}`}
                                isSelected={selectedCuboid?.id === obj?.id}
                                isVisible={handleIsObjectVisible(obj?.id)}
                            />
                        ))}
                </div>
            </div>
            <ContextMenu
                position={contextMenuPosition}
                itemsList={deletedObjects}
                onSelect={handleSelect}
                onClose={handleCloseContextMenu}
                setMenuDimensions={setMenuDimensions}
                selectMode={"index"}
            />
        </div>
    );
});
