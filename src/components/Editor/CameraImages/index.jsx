import React, { memo, useRef, useMemo, useState } from "react";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMinus, faExpandAlt, faCompressAlt } from "@fortawesome/free-solid-svg-icons";

import { useFileManager, useImages, useFrames } from "contexts";
import { useImageResize, useImageLoader, useImageSelector } from "hooks";

import { TopLoader, ContextMenu } from "components";

export const CameraImages = memo(() => {
    const { images } = useFileManager();
    const { selectedImage } = useImages();
    const { activeFrameIndex, arePointCloudsLoading } = useFrames();

    const loadingBarRef = useRef(null);

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
    } = useImageResize(loadedImages, selectedImagePath);

    useImageLoader(selectedImagePath, setLoadedImages, setAspectRatio, loadingBarRef);

    const {
        handleMouseUp,
        isContextMenuVisible,
        contextMenuPosition,
        handleSelectCamera,
        handleCloseContextMenu,
        setMenuDimensions,
    } = useImageSelector(wrapperRef);

    if (arePointCloudsLoading) return;

    return (
        <div className="camera-wrapper" ref={wrapperRef}>
            <TopLoader loadingBarRef={loadingBarRef} />
            {selectedImagePath && (
                <div
                    className="camera-image-container"
                    style={{ height: imageHeight, width: width }}
                >
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
                        src={loadedImages[selectedImagePath]?.src}
                        draggable="false"
                        onMouseUp={handleMouseUp}
                    />
                </div>
            )}
            {isContextMenuVisible && (
                <ContextMenu
                    position={contextMenuPosition}
                    itemsList={imagesByCamera}
                    onSelect={handleSelectCamera}
                    onClose={handleCloseContextMenu}
                    setMenuDimensions={setMenuDimensions}
                />
            )}
        </div>
    );
});
