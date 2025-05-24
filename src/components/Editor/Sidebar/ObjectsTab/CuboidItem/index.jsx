import React, { useCallback, memo } from "react";
import { useTranslation } from "react-i18next";
import { faEyeSlash, faBullseye, faEye, faBan } from "@fortawesome/free-solid-svg-icons";

import { useEvent } from "contexts";

import { SidebarIcon } from "../../SidebarIcon";

import { TABS } from "constants";

// const COMPONENT_NAME = "CuboidItem.";
const COMPONENT_NAME = "";

export const CuboidItem = memo(({ obj, index, action, isSelected, isVisible }) => {
    const { publish } = useEvent();
    const { t } = useTranslation();

    const getTargetPosition = useCallback((obj) => {
        const position = obj.position;
        const scale = obj.scale;
        const target = [position[0], position[1], position[2] - scale[2] / 2];
        return target;
    }, []);

    const selectCuboid = useCallback(() => {
        if (action) {
            const target = getTargetPosition(obj);

            publish(action);
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
                <h3 className="classes-label">{obj.type}</h3>
            </div>
            <SidebarIcon
                className="icon-style"
                title={t(`${COMPONENT_NAME}showObject`)}
                icon={faBullseye}
                index={index}
                type={"filterObject"}
                action={"show"}
                toggleable={true}
                altIcon={faBan}
            />
            <SidebarIcon
                className="icon-style"
                title={t(`${COMPONENT_NAME}hideObject`)}
                icon={faEyeSlash}
                index={index}
                type={"filterObject"}
                action={"hide"}
                toggleable={true}
                altIcon={faEye}
            />
        </div>
    );
});
