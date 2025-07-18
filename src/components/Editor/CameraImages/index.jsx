import { memo } from "react";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMinus, faExpandAlt, faCompressAlt, faCamera } from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";

import { useImages, useLoading } from "contexts";
import { useImageResize, useImageLoader, useImageSelector, useFetchCalibrations } from "hooks";

import { TopLoader, ContextMenu } from "components";
import { ImageCanvas } from "./ImageCanvas";
import { RenderEditorButton } from "../EditorControls/RenderEditorButton";

export const CameraImages = memo(() => {
    const { t } = useTranslation();
    const { imageSize, imageMaximized, loadedImages, selectedImagePath, imagesByCamera } =
        useImages();
    const { globalIsLoading } = useLoading();

    useFetchCalibrations();
    useImageLoader();

    const { cameraWrapperRef, handleResizeStart, toggleImageSize } = useImageResize();

    const {
        handleMouseUp,
        contextMenuPosition,
        handleSelectCamera,
        handleCloseContextMenu,
        setMenuDimensions,
        openContextMenu,
    } = useImageSelector(cameraWrapperRef);

    if (globalIsLoading) return;

    return (
        <div className="camera-wrapper" ref={cameraWrapperRef}>
            <TopLoader />
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
