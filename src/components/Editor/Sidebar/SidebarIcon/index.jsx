import React, { useCallback, useState, memo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Tooltip } from "react-tooltip";

import { useEvent } from "contexts";
import { useSubscribeFunction, useBindHotkey } from "hooks";

import { ACTIONS } from "utils/editor";

export const SidebarIcon = memo(
    ({
        icon,
        size = "16px",
        title,
        className,
        index,
        type,
        action,
        hotkey,
        toggleable = false,
        altIcon,
    }) => {
        const { publish } = useEvent();

        const [isActive, setIsActive] = useState(false);

        const buttonAction = useCallback(() => {
            publish(type || action, type ? { index, action } : undefined);
            if (toggleable) {
                setIsActive((prev) => !prev);
            }
        }, [index, action, publish]);

        useBindHotkey(hotkey, buttonAction);

        const handleIsActive = useCallback(
            (data) => {
                const handler = ACTIONS[data.action]?.isActive;
                if (handler) {
                    setIsActive(handler(action));
                }
            },
            [action],
        );

        useSubscribeFunction("filterClass", handleIsActive, []);

        const tooltipTitle =
            hotkey !== undefined
                ? `<span class="tooltip-hotkey">${hotkey}</span> — <span class="title">${title}</span>`
                : title;

        return (
            <div className="icon-wrapper">
                <FontAwesomeIcon
                    icon={isActive && altIcon ? altIcon : icon}
                    className={className}
                    width={size}
                    height={size}
                    fontSize={size}
                    onMouseUp={buttonAction}
                    onClick={(e) => e.stopPropagation()}
                    data-tooltip-id={`tooltip-${title}-${index}`}
                    data-tooltip-html={tooltipTitle}
                />
                <Tooltip
                    id={`tooltip-${title}-${index}`}
                    place="top"
                    effect="solid"
                    delayShow={300}
                />
            </div>
        );
    },
);
