import React, { useCallback, memo } from "react";
import { Tooltip } from "react-tooltip";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { useEvent } from "@contexts";

export const RenderSidebarTabsButton = memo(
    ({ className, title, icon, onClick, action }) => {
        const { publish } = useEvent();
        const buttonAction = useCallback(() => {
            if (action) {
                publish(action);
            }
            if (onClick) {
                onClick();
            }
        }, [action, onClick, publish]);

        return (
            <>
                <button
                    className={className}
                    data-tooltip-id={`tooltip-${title}`}
                    data-tooltip-content={title}
                    onClick={buttonAction}
                    onMouseDown={(e) => e.preventDefault()}
                >
                    <FontAwesomeIcon icon={icon} />
                </button>
                <Tooltip
                    id={`tooltip-${title}`}
                    place="top"
                    effect="solid"
                    delayShow={300}
                />
            </>
        );
    }
);
