import { useEffect, useRef, useState } from "react";

export const useImageResize = (initialAspectRatio, MIN_IMAGE_HEIGHT) => {
    const [aspectRatio, setAspectRatio] = useState(initialAspectRatio);
    const [imageHeight, setImageHeight] = useState(MIN_IMAGE_HEIGHT);
    const [imageMaximized, setImageMaximized] = useState(false);

    const lastManualHeight = useRef(MIN_IMAGE_HEIGHT);
    const wrapperRef = useRef(null);
    const isResizing = useRef(false);
    const startY = useRef(0);
    const startHeight = useRef(imageHeight);

    const width = imageHeight * aspectRatio;

    const updateToMaxSize = () => {
        if (!wrapperRef.current) return;
        const wrapperRect = wrapperRef.current.getBoundingClientRect();

        const maxByHeight = wrapperRect.height;
        const maxByWidth = wrapperRect.width / aspectRatio;

        const finalHeight = Math.min(maxByHeight, maxByWidth);
        setImageHeight(Math.max(MIN_IMAGE_HEIGHT, finalHeight));
    };

    const toggleImageSize = (e) => {
        e?.preventDefault?.();

        setImageMaximized((prev) => {
            const newValue = !prev;
            if (newValue) {
                lastManualHeight.current = imageHeight;
                updateToMaxSize();
            } else {
                setImageHeight(lastManualHeight.current || MIN_IMAGE_HEIGHT);
            }
            return newValue;
        });
    };

    const handleResizeStart = (e) => {
        if (imageMaximized) return;
        e.preventDefault();
        isResizing.current = true;
        startY.current = e.clientY;
        startHeight.current = imageHeight;
    };

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isResizing.current || !wrapperRef.current || imageMaximized) return;

            const delta = startY.current - e.clientY;
            const proposedHeight = startHeight.current + delta;

            const wrapperRect = wrapperRef.current.getBoundingClientRect();
            const maxHeight = wrapperRect.height;
            const maxWidth = wrapperRect.width;
            const proposedWidth = proposedHeight * aspectRatio;

            if (proposedHeight <= maxHeight && proposedWidth <= maxWidth) {
                setImageHeight(Math.max(MIN_IMAGE_HEIGHT, proposedHeight));
            }
        };

        const handleMouseUp = () => {
            isResizing.current = false;
        };

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [aspectRatio, imageMaximized]);

    useEffect(() => {
        if (!imageMaximized || !wrapperRef.current) return;

        const observer = new ResizeObserver(() => {
            updateToMaxSize();
        });
        observer.observe(wrapperRef.current);

        return () => observer.disconnect();
    }, [imageMaximized, aspectRatio]);

    return {
        imageHeight,
        width,
        handleResizeStart,
        toggleImageSize,
        wrapperRef,
        setAspectRatio,
        imageMaximized,
    };
};
