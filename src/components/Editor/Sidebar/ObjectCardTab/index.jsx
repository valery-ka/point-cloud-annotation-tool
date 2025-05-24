import { memo, useEffect, useCallback, useRef, useMemo } from "react";
import {
    faClose,
    faTrash,
    faPlus,
    faMinus,
    faRefresh,
    faAngleDoubleLeft,
    faAngleDoubleRight,
} from "@fortawesome/free-solid-svg-icons";

import { useEvent, useCuboids, useConfig, useEditor } from "contexts";
import { useSubscribeFunction, useContinuousAction, useForceUpdate } from "hooks";

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
        cuboids,
        setCuboids,
        selectedCuboid,
        setSelectedCuboid,
        selectedCuboidGeometryRef,
        isCuboidTransformingRef,
        selectedCuboidInfoRef,
    } = useCuboids();
    const { config } = useConfig();
    const { objects } = config;

    const { startContinuousAction } = useContinuousAction({ delay: 100 });

    const pointsInsideCuboidRef = useRef(0);

    const { isPrevButtonActive, isNextButtonActive } = useMemo(() => {
        if (!selectedCuboid?.id || cuboids.length === 0) {
            return { isPrevButtonActive: false, isNextButtonActive: false };
        }

        const sorted = [...cuboids].sort((a, b) => Number(a.id) - Number(b.id));
        const index = sorted.findIndex((c) => c.id === selectedCuboid.id);

        return {
            isPrevButtonActive: index > 0,
            isNextButtonActive: index >= 0 && index < sorted.length - 1,
        };
    }, [selectedCuboid?.id, cuboids]);

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

    const getTargetPosition = useCallback((obj) => {
        const position = obj.position;
        const scale = obj.scale;
        const target = [position[0], position[1], position[2] - scale[2] / 2];
        return target;
    }, []);

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

    const prevCuboid = useCallback(() => {
        if (!selectedCuboid?.id) return;

        const sorted = [...cuboids].sort((a, b) => Number(a.id) - Number(b.id));
        const index = sorted.findIndex((c) => c.id === selectedCuboid.id);

        if (index > 0) {
            const prevCuboid = sorted[index - 1];
            const target = getTargetPosition(prevCuboid);
            publish("switchCameraToPoint", target);
            setSelectedCuboid(prevCuboid);
        }
    }, [selectedCuboid?.id, cuboids]);

    useSubscribeFunction("prevCuboid", prevCuboid, []);

    const nextCuboid = useCallback(() => {
        if (!selectedCuboid?.id) return;

        const sorted = [...cuboids].sort((a, b) => Number(a.id) - Number(b.id));
        const index = sorted.findIndex((c) => c.id === selectedCuboid.id);

        if (index !== -1 && index < sorted.length - 1) {
            const nextCuboid = sorted[index + 1];
            const target = getTargetPosition(nextCuboid);
            publish("switchCameraToPoint", target);
            setSelectedCuboid(nextCuboid);
        }
    }, [selectedCuboid?.id, cuboids]);

    useSubscribeFunction("nextCuboid", nextCuboid, []);

    const handleAction = useCallback(
        (type, op) => (data) => {
            startContinuousAction(() => {
                const cuboid = selectedCuboidGeometryRef.current;
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
            const cuboid = selectedCuboidGeometryRef.current;
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

    const getData = useCallback((type) => {
        const info = selectedCuboidInfoRef.current;
        if (!info) return {};

        const valueMap = {
            points: {
                "Точек внутри бокса": info.insidePointsCount,
                "Покрашенных точек": 0,
            },
            position: {
                "Позиция X": info.position[0],
                "Позиция Y": info.position[1],
                "Позиция Z": info.position[2] - info.scale[2] / 2,
            },
            scale: {
                Длина: info.scale[0],
                Ширина: info.scale[1],
                Высота: info.scale[2],
            },
            rotation: {
                Крен: info.rotation[0] * (180 / Math.PI),
                Тангаж: info.rotation[1] * (180 / Math.PI),
                Рыскание: info.rotation[2] * (180 / Math.PI),
            },
        };

        return valueMap[type] || {};
    }, []);

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
                        className={`icon-style ${isPrevButtonActive ? "" : "disabled"}`}
                        size="20px"
                        title={"Предыдущий объект"}
                        icon={faAngleDoubleLeft}
                        action={"prevCuboid"}
                    />
                    <SidebarIcon
                        className={`icon-style ${isNextButtonActive ? "" : "disabled"}`}
                        size="20px"
                        title={"Следующий объект"}
                        icon={faAngleDoubleRight}
                        action={"nextCuboid"}
                    />
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
