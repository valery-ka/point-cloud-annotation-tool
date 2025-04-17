import React, { memo, useRef, useEffect } from "react";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMinus, faExpandAlt, faCompressAlt } from "@fortawesome/free-solid-svg-icons";

import { useImages, useFrames } from "contexts";
import { useImageResize, useImageLoader, useImageSelector, useFetchCalibrations } from "hooks";

import { TopLoader, ContextMenu } from "components";
import { ImageCanvas } from "./ImageCanvas";

export const CameraImages = memo(() => {
    const {
        imageSize,
        imageMaximized,
        cameraWrapperRef,
        loadedImages,
        selectedImagePath,
        imagesByCamera,
    } = useImages();
    const { arePointCloudsLoading } = useFrames();

    const loadingBarRef = useRef(null);

    useFetchCalibrations();
    useImageLoader(loadingBarRef);

    const {
        handleMouseUp,
        isContextMenuVisible,
        contextMenuPosition,
        handleSelectCamera,
        handleCloseContextMenu,
        setMenuDimensions,
    } = useImageSelector(cameraWrapperRef);

    const { handleResizeStart, toggleImageSize } = useImageResize();

    if (arePointCloudsLoading) return;

    return (
        <div className="camera-wrapper" ref={cameraWrapperRef}>
            <TopLoader loadingBarRef={loadingBarRef} />
            {selectedImagePath && (
                <div className="camera-image-container" style={imageSize}>
                    <div className="camera-image-resize" onMouseDown={handleResizeStart}>
                        <FontAwesomeIcon icon={faMinus} className="camera-image-resize-icon" />
                    </div>
                    <div className="camera-image-max" onClick={toggleImageSize}>
                        <FontAwesomeIcon
                            icon={imageMaximized ? faCompressAlt : faExpandAlt}
                            className="camera-image-max-icon"
                        />
                    </div>
                    <div className="camera-image" onMouseUp={handleMouseUp}>
                        <ImageCanvas image={loadedImages[selectedImagePath]} size={imageSize} />
                    </div>
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
