import { useRef, useEffect, useCallback } from "react";

import { useImages } from "contexts";

import { MIN_IMAGE_HEIGHT } from "constants";

export const useImageResize = () => {
    const {
        selectedCamera,
        aspectRatio,
        setAspectRatio,
        imageHeight,
        setImageHeight,
        imageMaximized,
        setImageMaximized,
        loadedImages,
        selectedImagePath,
    } = useImages();

    const lastManualHeight = useRef(MIN_IMAGE_HEIGHT);
    const isResizing = useRef(false);
    const startY = useRef(0);
    const startHeight = useRef(imageHeight);
    const cameraWrapperRef = useRef(null);

    const updateToMaxSize = useCallback(() => {
        if (!cameraWrapperRef.current) return;
        const wrapperRect = cameraWrapperRef.current.getBoundingClientRect();

        const maxByHeight = wrapperRect.height;
        const maxByWidth = wrapperRect.width / aspectRatio;

        const finalHeight = Math.min(maxByHeight, maxByWidth);
        setImageHeight(Math.max(MIN_IMAGE_HEIGHT, finalHeight));
    }, [aspectRatio]);

    const checkImageBounds = useCallback(() => {
        if (!cameraWrapperRef.current || imageMaximized) return;

        const wrapperRect = cameraWrapperRef.current.getBoundingClientRect();
        const currentWidth = imageHeight * aspectRatio;

        if (currentWidth > wrapperRect.width || imageHeight > wrapperRect.height) {
            updateToMaxSize();
        }
    }, [aspectRatio, imageHeight, imageMaximized, updateToMaxSize]);

    const toggleImageSize = useCallback(
        (e) => {
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
        },
        [imageHeight, updateToMaxSize],
    );

    const handleResizeStart = useCallback(
        (e) => {
            if (imageMaximized) return;
            e.preventDefault();
            isResizing.current = true;
            startY.current = e.clientY;
            startHeight.current = imageHeight;
        },
        [imageMaximized, imageHeight],
    );

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isResizing.current || !cameraWrapperRef.current || imageMaximized) return;

            const delta = startY.current - e.clientY;
            const proposedHeight = startHeight.current + delta;

            const wrapperRect = cameraWrapperRef.current.getBoundingClientRect();
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
        if (!cameraWrapperRef.current) return;

        const observer = new ResizeObserver(() => {
            if (imageMaximized) {
                updateToMaxSize();
            } else {
                checkImageBounds();
            }
        });
        observer.observe(cameraWrapperRef.current);

        return () => observer.disconnect();
    }, [imageMaximized, updateToMaxSize, checkImageBounds]);

    useEffect(() => {
        const { width, height } = loadedImages?.[selectedImagePath] ?? {};
        if (width && height) {
            const ratio = width / height;
            setAspectRatio(ratio);
            checkImageBounds();
        }
    }, [selectedImagePath, checkImageBounds]);

    return {
        cameraWrapperRef,
        handleResizeStart,
        toggleImageSize,
    };
};
