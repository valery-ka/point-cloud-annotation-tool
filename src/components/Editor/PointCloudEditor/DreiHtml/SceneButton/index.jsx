import React, { memo, useRef, useState, useEffect, useCallback } from "react";
import { useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";

const HIDE_TOOLTIP_TIMEOUT = 50;

export const SceneButton = memo(({ position, setShowTooltip, children }) => {
    const { gl } = useThree();
    const { domElement } = gl;

    const [isMouseDown, setIsMouseDown] = useState(false);

    const hideTimeoutRef = useRef(null);

    const handleMouseEnter = useCallback(() => {
        if (hideTimeoutRef.current) {
            clearTimeout(hideTimeoutRef.current);
            hideTimeoutRef.current = null;
        }
        setShowTooltip?.(true);
    }, [setShowTooltip]);

    const handleMouseLeave = useCallback(() => {
        hideTimeoutRef.current = setTimeout(() => {
            setShowTooltip?.(false);
            hideTimeoutRef.current = null;
        }, HIDE_TOOLTIP_TIMEOUT);
    }, [setShowTooltip]);

    const handleWheel = useCallback(
        (event) => {
            event.stopPropagation();
            domElement.dispatchEvent(new WheelEvent("wheel", event));
        },
        [domElement],
    );

    useEffect(() => {
        const handleMouseDown = () => setIsMouseDown(true);
        const handleMouseUp = () => setIsMouseDown(false);

        domElement.addEventListener("mousedown", handleMouseDown);
        domElement.addEventListener("mouseup", handleMouseUp);

        return () => {
            domElement.removeEventListener("mousedown", handleMouseDown);
            domElement.removeEventListener("mouseup", handleMouseUp);
            if (hideTimeoutRef.current) {
                clearTimeout(hideTimeoutRef.current);
            }
        };
    }, [domElement]);

    return (
        <Html position={position} zIndexRange={[10, 10]} wrapperClass="html-scene-button-wrapper">
            <div
                className="scene-button-wrapper"
                onWheel={handleWheel}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                {React.Children.map(children, (child) => {
                    if (React.isValidElement(child)) {
                        return React.cloneElement(child, {
                            style: { pointerEvents: isMouseDown ? "none" : "auto" },
                        });
                    }
                    return child;
                })}
            </div>
        </Html>
    );
});
