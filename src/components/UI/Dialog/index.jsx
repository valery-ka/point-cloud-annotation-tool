import React, { useCallback } from "react";
import { createPortal } from "react-dom";

import { useEvent } from "contexts";
import { useMousetrapPause } from "hooks";

export const Dialog = ({
    isOpen,
    onClose,
    children,
    size = "small",
    title,
    initiator,
    buttons,
    closeOnOutsideClick = false,
}) => {
    const { publish } = useEvent();

    const getSizeClass = useCallback(() => {
        switch (size) {
            case "large":
                return "size-large";
            case "medium":
                return "size-medium";
            case "small":
                return "size-small";
        }
    }, []);

    const handleOutsideClick = useCallback((e) => {
        if (closeOnOutsideClick && e.target === e.currentTarget) {
            onClose();
        }
    }, []);

    useMousetrapPause(isOpen);

    if (!isOpen) return null;

    return createPortal(
        <div className="dialog-overlay" onClick={handleOutsideClick}>
            <div className={`dialog-content ${getSizeClass()}`}>
                <div className="dialog-header">
                    <div className="dialog-title">{title}</div>
                </div>
                <div className="dialog-body">{children}</div>
                <div className="dialog-bottom">
                    <div className="dialog-buttons-group">
                        {Object.entries(buttons).map(([key, { label }]) => (
                            <button
                                key={key}
                                className="dialog-button"
                                onClick={() => publish(initiator, key)}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>,
        document.getElementById("root"),
    );
};
