import React, { useCallback, useState, memo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Tooltip } from "react-tooltip";

import { useEvent, useSettings } from "@contexts";
import { useBindHotkey } from "@hooks";

export const RenderFrameSwitcherButton = memo(
    ({
        className,
        title,
        action,
        actionType = "playback",
        icon,
        onClick,
        toggleable,
    }) => {
        const { publish } = useEvent();
        const { settings } = useSettings();

        const [isActive, setIsActive] = useState(false);

        const toggleButtonState = useCallback(() => {
            if (action) {
                publish(action);
            }
            if (onClick) {
                onClick();
            }
            if (toggleable) {
                setIsActive((prev) => !prev);
            }
        }, [onClick, publish]);

        const currentHotkey = settings.hotkeys[actionType][action];

        useBindHotkey(currentHotkey, toggleButtonState);

        const tooltipTitle =
            currentHotkey !== undefined
                ? `<span class="tooltip-hotkey">${currentHotkey}</span> — <span class="title">${title}</span>`
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
                    place="top"
                    effect="solid"
                    delayShow={300}
                />
            </>
        );
    }
);
