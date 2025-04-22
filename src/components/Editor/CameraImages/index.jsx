import React, { memo, useRef } from "react";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMinus, faExpandAlt, faCompressAlt, faCamera } from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";

import { useImages, useFrames } from "contexts";
import { useImageResize, useImageLoader, useImageSelector, useFetchCalibrations } from "hooks";

import { TopLoader, ContextMenu } from "components";
import { ImageCanvas } from "./ImageCanvas";
import { RenderEditorButton } from "../Controls/RenderEditorButton";

export const CameraImages = memo(() => {
    const { t } = useTranslation();
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
        contextMenuPosition,
        handleSelectCamera,
        handleCloseContextMenu,
        setMenuDimensions,
        openContextMenu,
    } = useImageSelector(cameraWrapperRef);

    const { handleResizeStart, toggleImageSize } = useImageResize();

    if (arePointCloudsLoading) return;

    return (
        <div className="camera-wrapper" ref={cameraWrapperRef}>
            <TopLoader loadingBarRef={loadingBarRef} />
            <div
                className={`camera-image-container ${!selectedImagePath ? "hidden" : ""}`}
                style={imageSize}
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
                <div className="camera-image" onMouseUp={handleMouseUp}>
                    <ImageCanvas image={loadedImages[selectedImagePath]} size={imageSize} />
                </div>
            </div>
            {selectedImagePath === null && (
                <RenderEditorButton
                    className={`tool-3d-control-button single`}
                    title={t("setCamera")}
                    actionType={"misc"}
                    icon={faCamera}
                    onClick={() =>
                        openContextMenu({
                            offsetX: -40,
                            offsetY: -40,
                        })
                    }
                />
            )}
            <ContextMenu
                position={contextMenuPosition}
                itemsList={imagesByCamera}
                onSelect={handleSelectCamera}
                onClose={handleCloseContextMenu}
                setMenuDimensions={setMenuDimensions}
            />
        </div>
    );
});
