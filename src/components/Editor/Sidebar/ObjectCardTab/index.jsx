import { memo, useEffect, useCallback } from "react";
import { faPlus, faMinus, faRefresh } from "@fortawesome/free-solid-svg-icons";

import { useTranslation } from "react-i18next";
import { useEvent, useCuboids, useConfig, useEditor } from "contexts";
import { useContinuousAction } from "hooks";

import { ObjectCardInfoBlock } from "./ObjectCardInfoBlock";
import { ObjectCardButtons } from "./ObjectCardButtons";

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
    const { t } = useTranslation();

    const { publish } = useEvent();
    const { transformControlsRef } = useEditor();
    const {
        selectedCuboid,
        selectedCuboidGeometryRef,
        isCuboidTransformingRef,
        selectedCuboidInfoRef,
    } = useCuboids();
    const { config } = useConfig();
    const { objects } = config;

    const { startContinuousAction } = useContinuousAction({ delay: 200 });

    useEffect(() => {
        selectedCuboid
            ? publish("setActiveTab", TABS.OBJECT_CARD)
            : publish("setActiveTab", OBJECTS_TAB_INDEX);
    }, [selectedCuboid?.id]);

    const updateCuboidState = useCallback(() => {
        isCuboidTransformingRef.current = true;
        transformControlsRef.current.dispatchEvent({ type: "change" });
    }, []);

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
            const label = selectedCuboid.label;
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
                [t("pointsInsideCount")]: info.insidePointsCount,
                [t("paintedPointsCount")]: 0,
            },
            position: {
                [t("positionX")]: info.position[0],
                [t("positionY")]: info.position[1],
                [t("positionZ")]: info.position[2] - info.scale[2] / 2,
            },
            scale: {
                [t("length")]: info.scale[0],
                [t("width")]: info.scale[1],
                [t("height")]: info.scale[2],
            },
            rotation: {
                [t("roll")]: info.rotation[0] * (180 / Math.PI),
                [t("pitch")]: info.rotation[1] * (180 / Math.PI),
                [t("yaw")]: info.rotation[2] * (180 / Math.PI),
            },
        };

        return valueMap[type] || {};
    }, []);

    const infoBlocksConfig = [
        { title: [t("points")], type: "points", decimals: 0 },
        { title: [t("cuboidPosition")], type: "position", action: "position", unit: " m" },
        { title: [t("cuboidScale")], type: "scale", action: "scale", unit: " m" },
        { title: [t("cuboidRotation")], type: "rotation", action: "rotation", unit: "°" },
    ];

    return (
        <div className="sidebar-tab-panel">
            <div className="tab-header-container">
                <h2 className="tab-header">ID: {selectedCuboid?.id}</h2>
                <ObjectCardButtons />
            </div>
            <div className="sidebar-content">
                <div className="object-info-container">
                    <div className="object-label-item">
                        <div
                            className="color-box"
                            style={{ backgroundColor: selectedCuboid?.color }}
                        ></div>
                        <div className="object-label-button">
                            <h3 className="classes-label">{selectedCuboid?.label}</h3>
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
