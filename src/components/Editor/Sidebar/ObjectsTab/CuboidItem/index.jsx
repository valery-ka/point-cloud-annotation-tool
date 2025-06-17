import React, { useCallback, memo } from "react";
import { useTranslation } from "react-i18next";
import { faEyeSlash, faBullseye, faEye, faBan } from "@fortawesome/free-solid-svg-icons";

import { useEvent, useCuboids } from "contexts";

import { SidebarIcon } from "../../SidebarIcon";

import { getCuboidMeshPositionById } from "utils/cuboids";
import { TABS } from "constants";

// const COMPONENT_NAME = "CuboidItem.";
const COMPONENT_NAME = "";

export const CuboidItem = memo(({ obj, index, action, isSelected, isVisible }) => {
    const { t } = useTranslation();

    const { publish } = useEvent();
    const { cuboidsGeometriesRef } = useCuboids();

    const selectCuboid = useCallback(() => {
        if (action) {
            publish(action);
            const target = getCuboidMeshPositionById(cuboidsGeometriesRef, obj.id);
            publish("switchCameraToPoint", target);
            publish("setActiveTab", TABS.OBJECT_CARD);
        }
    }, [action, publish]);

    return (
        <div
            className={`classes-item ${isSelected ? "selected" : ""} ${isVisible ? "" : "hidden"}`}
            onClick={selectCuboid}
        >
            <div className="color-box" style={{ backgroundColor: obj.color }}></div>
            <div className="classes-label-container">
                <h3 className="classes-label">{obj.label}</h3>
            </div>
            <SidebarIcon
                className="icon-style"
                title={t(`${COMPONENT_NAME}showObject`)}
                icon={faBullseye}
                index={index}
                type={"filterObject"}
                action={{ filter: "show", unit: "cuboid" }}
                toggleable={true}
                altIcon={faBan}
            />
            <SidebarIcon
                className="icon-style"
                title={t(`${COMPONENT_NAME}hideObject`)}
                icon={faEyeSlash}
                index={index}
                type={"filterObject"}
                action={{ filter: "hide", unit: "cuboid" }}
                toggleable={true}
                altIcon={faEye}
            />
        </div>
    );
});
