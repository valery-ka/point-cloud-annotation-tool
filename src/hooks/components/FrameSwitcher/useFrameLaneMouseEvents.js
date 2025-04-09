import React, { useCallback, useState, useEffect } from "react";
import { usePCDManager, useFrames } from "@contexts";

export const useFrameLaneMouseEvents = (frameLaneRef) => {
    const { pcdFiles } = usePCDManager();
    const { activeFrameIndex, setActiveFrameIndex } = useFrames();

    const [isDragging, setIsDragging] = useState(false);
    const [laneStartX, setLaneStartX] = useState(0);
    const [laneWidth, setLaneWidth] = useState(0);

    const updateFrameIndexFromPosition = useCallback(
        (clientX) => {
            if (laneWidth > 0) {
                const cursorX = clientX - laneStartX;
                const normalizedPosition = Math.max(
                    0,
                    Math.min(cursorX / laneWidth, 1)
                );

                const adjustedIndex = normalizedPosition * pcdFiles.length;

                return Math.min(pcdFiles.length - 1, Math.floor(adjustedIndex));
            }
            return activeFrameIndex;
        },
        [laneStartX, laneWidth, pcdFiles.length, activeFrameIndex]
    );

    const handleMouseDownLane = useCallback(
        (event) => {
            if (event.button === 0) {
                if (frameLaneRef.current) {
                    const rect = frameLaneRef.current.getBoundingClientRect();
                    setLaneStartX(rect.left);
                    setLaneWidth(rect.width);
                    frameLaneRef.current.classList.add("grabbing-cursor");
                }

                const newIndex = updateFrameIndexFromPosition(event.clientX);
                setActiveFrameIndex(newIndex);
                setIsDragging(true);
            }
        },
        [updateFrameIndexFromPosition, frameLaneRef]
    );

    const handleMouseMoveLane = useCallback(
        (event) => {
            if (isDragging) {
                const newIndex = updateFrameIndexFromPosition(event.clientX);
                if (newIndex !== activeFrameIndex) {
                    setActiveFrameIndex(newIndex);
                }
            }
        },
        [isDragging, updateFrameIndexFromPosition, activeFrameIndex]
    );

    const handleMouseUpLane = useCallback(() => {
        setIsDragging(false);
        if (frameLaneRef.current) {
            frameLaneRef.current.classList.remove("grabbing-cursor");
        }
    }, []);

    useEffect(() => {
        document.addEventListener("mousemove", handleMouseMoveLane);
        document.addEventListener("mouseup", handleMouseUpLane);

        return () => {
            document.removeEventListener("mousemove", handleMouseMoveLane);
            document.removeEventListener("mouseup", handleMouseUpLane);
        };
    }, [handleMouseMoveLane, handleMouseUpLane]);

    return { handleMouseDownLane };
};
