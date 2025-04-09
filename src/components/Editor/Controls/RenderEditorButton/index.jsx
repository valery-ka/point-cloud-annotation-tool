import React, { useEffect, useCallback, useState, memo } from "react";
import { Tooltip } from "react-tooltip";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { useBindHotkey } from "@hooks";
import { useSettings, useEvent } from "@contexts";

export const RenderEditorButton = memo(
    ({
        className,
        title,
        actionType,
        action,
        icon,
        hotkey,
        onClick,
        persistent,
        toggleable,
    }) => {
        const { publish } = useEvent();
        const { settings, updateSettings } = useSettings();

        const [isActive, setIsActive] = useState(() => {
            if (persistent) {
                return settings.activeButtons?.[action] || false;
            }
            return false;
        });

        useEffect(() => {
            if (persistent) {
                updateSettings({
                    activeButtons: {
                        ...settings.activeButtons,
                        [action]: isActive,
                    },
                });
            }
        }, [isActive]);

        const toggleButtonState = useCallback(() => {
            if (action) {
                publish(action);
            }
            if (onClick) {
                onClick();
            }
            if (persistent || toggleable) {
                setIsActive((prev) => !prev);
            }
        }, [onClick, publish]);

        const currentHotkey = settings.hotkeys[actionType][action] ?? hotkey;

        useBindHotkey(currentHotkey, toggleButtonState);

        const tooltipTitle =
            currentHotkey !== undefined
                ? `<span class="tooltip-hotkey">${
                      currentHotkey ?? hotkey
                  }</span> — <span class="title">${title}</span>`
                : title;

        return (
            <>
                <button
                    className={`${className} ${isActive ? "pushed" : ""}`}
                    data-tooltip-id={`tooltip-${action}`}
                    data-tooltip-html={tooltipTitle}
                    onClick={toggleButtonState}
                    onMouseDown={(e) => e.preventDefault()}
                >
                    <FontAwesomeIcon icon={icon} className="icon" />
                </button>
                <Tooltip
                    id={`tooltip-${action}`}
                    place="bottom"
                    effect="solid"
                    delayShow={300}
                />
            </>
        );
    }
);
