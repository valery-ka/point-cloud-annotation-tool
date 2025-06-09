import { useImages } from "contexts";
import { useContextMenuSelector } from "hooks";

export const useImageSelector = (cameraWrapperRef) => {
    const { setSelectedCamera } = useImages();

    const {
        handleMouseUp,
        contextMenuPosition,
        handleSelect,
        handleCloseContextMenu,
        setMenuDimensions,
        openContextMenu,
    } = useContextMenuSelector({
        wrapperRef: cameraWrapperRef,
        onSelect: setSelectedCamera,
    });

    return {
        handleMouseUp,
        contextMenuPosition,
        handleSelectCamera: handleSelect,
        handleCloseContextMenu,
        setMenuDimensions,
        openContextMenu,
    };
};
