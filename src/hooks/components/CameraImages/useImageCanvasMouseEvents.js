import { useState, useCallback, useEffect, useRef } from "react";

const CONTAINER = ".camera-image-container";

export const useImageCanvasMouseEvents = () => {
    const [isHovered, setIsHovered] = useState(false);
    const [isMouseDown, setIsMouseDown] = useState(false);
    const [arePointsVisible, setArePointsVisible] = useState(true);

    const handleMouseDown = useCallback(
        (e) => {
            if (e.button === 0) {
                setIsMouseDown(true);
                if (isHovered) {
                    setArePointsVisible(true);
                }
            }
        },
        [isHovered],
    );

    const handleMouseUp = useCallback(
        (e) => {
            if (e.button === 0) {
                setIsMouseDown(false);
                if (isHovered) {
                    setArePointsVisible(false);
                }
            }
        },
        [isHovered],
    );

    const handleMouseEnter = useCallback(() => {
        if (!isMouseDown) {
            setArePointsVisible(false);
        }
        setIsHovered(true);
    }, [isMouseDown]);

    const handleMouseLeave = useCallback(() => {
        if (!isMouseDown) {
            setArePointsVisible(true);
        }
        setIsHovered(false);
    }, [isMouseDown]);

    const imageContainerRef = useRef(null);

    useEffect(() => {
        imageContainerRef.current = document.querySelector(CONTAINER);
        const element = imageContainerRef.current;
        if (!element) return;

        document.addEventListener("mouseup", handleMouseUp);
        element.addEventListener("mousedown", handleMouseDown);
        element.addEventListener("mouseenter", handleMouseEnter);
        element.addEventListener("mouseleave", handleMouseLeave);

        return () => {
            document.removeEventListener("mouseup", handleMouseUp);
            element.removeEventListener("mousedown", handleMouseDown);
            element.removeEventListener("mouseenter", handleMouseEnter);
            element.removeEventListener("mouseleave", handleMouseLeave);
        };
    }, [handleMouseDown, handleMouseUp, handleMouseEnter, handleMouseLeave]);

    return { arePointsVisible };
};
