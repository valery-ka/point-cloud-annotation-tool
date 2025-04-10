import React, { useCallback, memo } from "react";
import { useTranslation } from "react-i18next";
import { faEyeSlash, faBullseye, faEye, faBan } from "@fortawesome/free-solid-svg-icons";

import { useBindHotkey } from "hooks";
import { useEvent, useSettings } from "contexts";

import { SidebarIcon } from "../../SidebarIcon";

// const COMPONENT_NAME = "ClassItem.";
const COMPONENT_NAME = "";

export const ClassItem = memo(({ cls, index, action, hotkey, isSelected, isVisible }) => {
    const { publish } = useEvent();
    const { t } = useTranslation();

    const { settings } = useSettings();
    const { hotkeys } = settings;

    const selectClass = useCallback(() => {
        if (action) {
            publish(action);
        }
    }, [action, publish]);

    useBindHotkey(hotkey, selectClass);

    return (
        <div
            className={`classes-item ${isSelected ? "selected" : ""} ${isVisible ? "" : "hidden"}`}
            onClick={selectClass}
        >
            <div className="color-box" style={{ backgroundColor: cls.color }}></div>
            <div className="classes-label-container">
                <h3 className="classes-label">{cls.label}</h3>
            </div>
            <SidebarIcon
                className="icon-style"
                title={t(`${COMPONENT_NAME}showObject`)}
                icon={faBullseye}
                index={index}
                type={"filterClass"}
                action={"show"}
                hotkey={hotkeys["showClass"][`showClass${index}`]}
                toggleable={true}
                altIcon={faBan}
            />
            <SidebarIcon
                className="icon-style"
                title={t(`${COMPONENT_NAME}hideObject`)}
                icon={faEyeSlash}
                index={index}
                type={"filterClass"}
                action={"hide"}
                hotkey={hotkeys["hideClass"][`hideClass${index}`]}
                toggleable={true}
                altIcon={faEye}
            />
        </div>
    );
});
