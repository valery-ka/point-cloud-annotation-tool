import React, { memo, useEffect, useMemo, useState } from "react";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMinus, faExpandAlt, faCompressAlt } from "@fortawesome/free-solid-svg-icons";

import { useFileManager, useImages, useFrames } from "contexts";
import { useImageResize } from "hooks";

const MIN_IMAGE_HEIGHT = 250;

export const CameraImages = memo(() => {
    const { images } = useFileManager();
    const { selectedImage } = useImages();
    const {
        activeFrameIndex,
        arePointCloudsLoading,
        setAreImagesLoading,
        areImagesLoading,
        setLoadingProgress,
    } = useFrames();

    const [loadedImages, setLoadedImages] = useState({});
    const imagesByCamera = useMemo(() => {
        return Object.keys(images) ?? {};
    }, [images]);
    const selectedImagePath = useMemo(() => {
        return images[selectedImage]?.[activeFrameIndex] ?? null;
    }, [images, selectedImage, activeFrameIndex]);

    const {
        imageHeight,
        width,
        handleResizeStart,
        toggleImageSize,
        wrapperRef,
        setAspectRatio,
        imageMaximized,
    } = useImageResize(1, MIN_IMAGE_HEIGHT);

    useEffect(() => {
        if (arePointCloudsLoading) return;
        setAreImagesLoading(true);

        const loaded = {};
        const allUrls = Object.values(images).flat();
        const total = allUrls.length;
        let loadedCount = 0;

        if (total === 0) {
            setAreImagesLoading(false);
            return;
        }

        allUrls.forEach((url) => {
            if (!loaded[url]) {
                const img = new Image();
                img.src = url;

                img.onload = () => {
                    loadedCount++;
                    setLoadingProgress(loadedCount / total);

                    if (url === selectedImagePath) {
                        const ratio = img.width / img.height;
                        setAspectRatio(ratio);
                    }

                    if (loadedCount === total) {
                        setAreImagesLoading(false);
                    }
                };

                loaded[url] = img;
            }
        });

        setLoadedImages(loaded);
    }, [images, arePointCloudsLoading]);

    if (arePointCloudsLoading || areImagesLoading) return;

    return (
        <div className="camera-wrapper" ref={wrapperRef}>
            {selectedImagePath && (
                <div className="camera-image-container" style={{ height: imageHeight, width }}>
                    <div className="camera-image-resize" onMouseDown={handleResizeStart}>
                        <FontAwesomeIcon icon={faMinus} className="camera-image-resize-icon" />
                    </div>
                    <div className="camera-image-max" onClick={toggleImageSize}>
                        <FontAwesomeIcon
                            icon={imageMaximized ? faCompressAlt : faExpandAlt}
                            className="camera-image-max-icon"
                        />
                    </div>
                    <img
                        className="camera-image"
                        alt="Camera view"
                        src={loadedImages[selectedImagePath]?.src || selectedImagePath}
                        draggable="false"
                    />
                </div>
            )}
        </div>
    );
});
