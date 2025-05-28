import { useCallback, useState, useEffect } from "react";

import { useFileManager, useFrames } from "contexts";
import { useCuboidInterpolation } from "hooks";

export const useFrameLaneMouseEvents = (frameLaneRef) => {
    const { pcdFiles } = useFileManager();
    const { activeFrameIndex, setActiveFrameIndex } = useFrames();

    const { interpolatePSR, updateCuboidPSR, findFrameMarkers, saveCurrentPSR } =
        useCuboidInterpolation();

    const [isDragging, setIsDragging] = useState(false);
    const [laneStartX, setLaneStartX] = useState(0);
    const [laneWidth, setLaneWidth] = useState(0);

    const updateFrameIndexFromPosition = useCallback(
        (clientX) => {
            if (laneWidth > 0) {
                const cursorX = clientX - laneStartX;
                const normalizedPosition = Math.max(0, Math.min(cursorX / laneWidth, 1));

                const adjustedIndex = normalizedPosition * pcdFiles.length;

                return Math.min(pcdFiles.length - 1, Math.floor(adjustedIndex));
            }
            return activeFrameIndex;
        },
        [laneStartX, laneWidth, pcdFiles.length, activeFrameIndex],
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
        [updateFrameIndexFromPosition, frameLaneRef],
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
        [isDragging, updateFrameIndexFromPosition, activeFrameIndex],
    );

    const handleMouseUpLane = useCallback(() => {
        setIsDragging(false);
        if (frameLaneRef.current) {
            frameLaneRef.current.classList.remove("grabbing-cursor");
        }
    }, []);

    const removeKeyFrame = useCallback(
        (event, frame) => {
            if (event.button === 2) {
                saveCurrentPSR({ manual: false, activeFrameIndex: frame });
                interpolatePSR();
                findFrameMarkers();
                updateCuboidPSR();
            }
        },
        [interpolatePSR, updateCuboidPSR],
    );

    useEffect(() => {
        document.addEventListener("mousemove", handleMouseMoveLane);
        document.addEventListener("pointerup", handleMouseUpLane);

        return () => {
            document.removeEventListener("mousemove", handleMouseMoveLane);
            document.removeEventListener("pointerup", handleMouseUpLane);
        };
    }, [handleMouseMoveLane, handleMouseUpLane]);

    return { handleMouseDownLane, removeKeyFrame };
};
