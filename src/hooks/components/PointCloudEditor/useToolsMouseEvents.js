import { useCallback, useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";

import { useTools } from "@contexts";

export const useToolsMouseEvents = (selectorTools) => {
    const { gl } = useThree();
    const canvasElement = gl.domElement;

    const { selectedTool } = useTools();

    const mouseRef = useRef({
        down: 0,
        downX: NaN,
        downY: NaN,
        x: 0,
        y: 0,
    });

    const screenRef = useRef({
        left: gl.domElement.offsetLeft,
        top: gl.domElement.offsetTop,
        width: gl.domElement.clientWidth,
        height: gl.domElement.clientHeight,
    });

    const handleMouseDown = useCallback(
        (event) => {
            mouseRef.current.down = event.which;
            mouseRef.current.downX = event.pageX;
            mouseRef.current.downY = event.pageY;

            selectorTools[selectedTool]?.handleMouseDown?.(event);
        },
        [selectedTool],
    );

    const handleMouseUp = useCallback(
        (event) => {
            mouseRef.current.down = 0;
            selectorTools[selectedTool]?.handleMouseUp?.(event);
            mouseRef.current.downX = NaN;
            mouseRef.current.downY = NaN;
        },
        [selectedTool],
    );

    const handleMouseMove = useCallback(
        (event) => {
            const ev = {
                offsetX: event.offsetX,
                offsetY: event.offsetY,
                pageX: event.pageX,
                pageY: event.pageY,
                which: mouseRef.current.down,
            };

            mouseRef.current.x =
                ((ev.pageX - screenRef.current.left) / screenRef.current.width) * 2 - 1;
            mouseRef.current.y =
                -((ev.pageY - screenRef.current.top) / screenRef.current.height) * 2 + 1;

            selectorTools[selectedTool]?.handleMouseMove?.(ev);

            if (mouseRef.current.down) {
                selectorTools[selectedTool]?.handleMouseDrag?.(ev);
            }

            if (selectedTool === "brushTool") {
                canvasElement.classList.add("invisible-cursor");
            } else {
                canvasElement.classList.remove("invisible-cursor");
            }
        },
        [selectedTool],
    );

    const handleMouseWheel = useCallback(
        (event) => {
            selectorTools[selectedTool]?.handleMouseWheel?.(event);
        },
        [selectedTool],
    );

    const handleMouseEnter = useCallback(
        (event) => {
            // if (event.buttons === 1) {
            //     mouseRef.current.down = event.which;
            //     mouseRef.current.downX = event.pageX;
            //     mouseRef.current.downY = event.pageY;
            //     selectorTools[selectedTool]?.handleMouseEnter?.(event);
            // }
        },
        [selectedTool],
    );

    const handleMouseLeave = useCallback(
        (event) => {
            mouseRef.current.down = 0;
            selectorTools[selectedTool]?.handleMouseLeave?.(event);
            mouseRef.current.downX = NaN;
            mouseRef.current.downY = NaN;
            canvasElement.classList.remove("invisible-cursor");
        },
        [selectedTool],
    );

    useEffect(() => {
        canvasElement.addEventListener("mousedown", handleMouseDown, false);
        canvasElement.addEventListener("mouseup", handleMouseUp, false);
        canvasElement.addEventListener("mousemove", handleMouseMove, false);
        canvasElement.addEventListener("wheel", handleMouseWheel, false);
        canvasElement.addEventListener("mouseleave", handleMouseLeave, false);
        canvasElement.addEventListener("mouseenter", handleMouseEnter, false);

        return () => {
            canvasElement.removeEventListener("mousedown", handleMouseDown, false);
            canvasElement.removeEventListener("mouseup", handleMouseUp, false);
            canvasElement.removeEventListener("mousemove", handleMouseMove, false);
            canvasElement.removeEventListener("wheel", handleMouseWheel, false);
            canvasElement.removeEventListener("mouseleave", handleMouseLeave, false);
            canvasElement.removeEventListener("mouseenter", handleMouseEnter, false);
        };
    }, [
        handleMouseDown,
        handleMouseUp,
        handleMouseMove,
        handleMouseWheel,
        handleMouseLeave,
        handleMouseEnter,
        gl.domElement,
    ]);

    return null;
};
