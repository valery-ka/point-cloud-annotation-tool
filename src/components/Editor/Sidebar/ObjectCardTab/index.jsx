import { memo, useEffect, useCallback, useRef } from "react";
import { faClose, faTrash, faPlus, faMinus, faRefresh } from "@fortawesome/free-solid-svg-icons";

import { useEvent, useCuboids, useConfig, useEditor } from "contexts";
import { useSubscribeFunction, useContinuousAction } from "hooks";

import { SidebarIcon } from "../SidebarIcon";
import { ObjectCardInfoBlock } from "./ObjectCardInfoBlock";

import { TABS } from "constants";
import {
    POSITION_HANDLERS,
    SCALE_HANDLERS,
    ROTATION_HANDLERS,
    RESET_HANDLERS,
} from "./handlersConfig";

// const COMPONENT_NAME = "ObjectCardTab.";
const COMPONENT_NAME = "";
const OBJECTS_TAB_INDEX = 0;

export const ObjectCardTab = memo(() => {
    const { publish } = useEvent();
    const { transformControlsRef } = useEditor();
    const {
        setCuboids,
        selectedCuboid,
        setSelectedCuboid,
        selectedCuboidRef,
        isCuboidTransformingRef,
    } = useCuboids();
    const { config } = useConfig();
    const { objects } = config;
    const { startContinuousAction } = useContinuousAction({ delay: 100 });

    const pointsInsideCuboidRef = useRef(0);

    useEffect(() => {
        selectedCuboid
            ? publish("setActiveTab", TABS.OBJECT_CARD)
            : publish("setActiveTab", OBJECTS_TAB_INDEX);
    }, [selectedCuboid?.id]);

    useEffect(() => {
        if (selectedCuboid?.insidePoints) {
            pointsInsideCuboidRef.current = selectedCuboid.insidePoints.length;
        }
    }, [selectedCuboid?.insidePoints]);

    const updateCuboidState = useCallback(() => {
        isCuboidTransformingRef.current = true;
        transformControlsRef.current.dispatchEvent({ type: "change" });
    }, []);

    const removeCuboid = useCallback((data) => {
        const cuboidId = data.index;
        setCuboids((prevCuboids) => prevCuboids.filter((cuboid) => cuboid.id !== cuboidId));
        setSelectedCuboid(null);
    }, []);

    useSubscribeFunction("removeCuboid", removeCuboid, []);

    const handleAction = useCallback(
        (type, op) => (data) => {
            startContinuousAction(() => {
                const cuboid = selectedCuboidRef.current;
                const handlerMap = {
                    position: POSITION_HANDLERS,
                    scale: SCALE_HANDLERS,
                    rotation: ROTATION_HANDLERS,
                };
                handlerMap[type][op](cuboid, data.index);
                updateCuboidState();
            });
        },
        [],
    );

    const resetUnit = useCallback(
        (data) => {
            const { action, index } = data;
            const cuboid = selectedCuboidRef.current;
            const label = selectedCuboid.type;
            const unit = objects[0][label];
            RESET_HANDLERS[action]?.(cuboid, index, unit);
            updateCuboidState();
        },
        [objects, selectedCuboid],
    );

    const getButtons = useCallback(
        (type) => ({
            plus: {
                icon: faPlus,
                callback: handleAction(type, "plus"),
                continuous: true,
            },
            minus: {
                icon: faMinus,
                callback: handleAction(type, "minus"),
                continuous: true,
            },
            reset: {
                icon: faRefresh,
                callback: resetUnit,
                continuous: false,
            },
        }),
        [resetUnit],
    );

    const getData = useCallback(
        (type) => {
            if (!selectedCuboid) return {};

            const valueMap = {
                points: {
                    "Точек внутри бокса": pointsInsideCuboidRef.current,
                    "Покрашенных точек": 0,
                },
                position: {
                    "Позиция X": selectedCuboid.position[0],
                    "Позиция Y": selectedCuboid.position[1],
                    "Позиция Z": selectedCuboid.position[2] - selectedCuboid.scale[2] / 2,
                },
                scale: {
                    Длина: selectedCuboid.scale[0],
                    Ширина: selectedCuboid.scale[1],
                    Высота: selectedCuboid.scale[2],
                },
                rotation: {
                    Крен: selectedCuboid.rotation[0] * (180 / Math.PI),
                    Тангаж: selectedCuboid.rotation[1] * (180 / Math.PI),
                    Рыскание: selectedCuboid.rotation[2] * (180 / Math.PI),
                },
            };

            return valueMap[type] || {};
        },
        [selectedCuboid],
    );

    const infoBlocksConfig = [
        { title: "Точки", type: "points", decimals: 0 },
        { title: "Позиция коробки", type: "position", action: "position", unit: " m" },
        { title: "Размеры коробки", type: "scale", action: "scale", unit: " m" },
        { title: "Вращение коробки", type: "rotation", action: "rotation", unit: "°" },
    ];

    return (
        <div className="sidebar-tab-panel">
            <div className="tab-header-container">
                <h2 className="tab-header">ID: {selectedCuboid?.id}</h2>
                <div className="tab-header-buttons">
                    <SidebarIcon
                        className="icon-style"
                        size="20px"
                        title="Удалить кубоид со всех кадров"
                        icon={faTrash}
                        action={"removeCuboid"}
                        type={"removeCuboid"}
                        index={selectedCuboid?.id}
                    />
                    <SidebarIcon
                        className="icon-style"
                        size="20px"
                        title="Закрыть карточку"
                        icon={faClose}
                        type="setActiveTab"
                        index={OBJECTS_TAB_INDEX}
                    />
                </div>
            </div>
            <div className="sidebar-content">
                <div className="object-info-container">
                    <div className="object-label-item">
                        <div
                            className="color-box"
                            style={{ backgroundColor: selectedCuboid?.color }}
                        ></div>
                        <div className="object-label-button">
                            <h3 className="classes-label">{selectedCuboid?.type}</h3>
                        </div>
                    </div>
                    <div className="object-card-info-block-container">
                        {infoBlocksConfig.map(({ title, type, action, unit, decimals }) => (
                            <ObjectCardInfoBlock
                                key={type}
                                title={title}
                                action={action}
                                data={getData(type)}
                                buttons={action ? getButtons(action) : undefined}
                                unit={unit}
                                decimals={decimals}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
});
