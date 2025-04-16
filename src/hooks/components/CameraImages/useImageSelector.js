import { useCallback, useState } from "react";
import { useImages } from "contexts";

export const useImageSelector = (cameraWrapperRef) => {
    const { setSelectedImage } = useImages();

    const [contextMenuPosition, setContextMenuPosition] = useState(null);
    const [isContextMenuVisible, setIsContextMenuVisible] = useState(false);
    const [menuDimensions, setMenuDimensions] = useState({ width: 0, height: 0 });

    const handleMouseUp = useCallback(
        (e) => {
            if (e.button === 2 && cameraWrapperRef.current) {
                e.preventDefault();

                const wrapperRect = cameraWrapperRef.current.getBoundingClientRect();
                const { width: menuWidth, height: menuHeight } = menuDimensions;

                let x = e.clientX - wrapperRect.left;
                let y = e.clientY - wrapperRect.top;

                if (x + menuWidth > wrapperRect.width) {
                    x = wrapperRect.width - menuWidth;
                }

                if (y + menuHeight > wrapperRect.height) {
                    y = wrapperRect.height - menuHeight;
                }

                setContextMenuPosition({ x, y });
                setIsContextMenuVisible(true);
            }
        },
        [menuDimensions],
    );

    const handleSelectCamera = (cameraName) => {
        setSelectedImage(cameraName);
        setIsContextMenuVisible(false);
    };

    const handleCloseContextMenu = () => {
        setIsContextMenuVisible(false);
    };

    return {
        handleMouseUp,
        isContextMenuVisible,
        contextMenuPosition,
        handleSelectCamera,
        handleCloseContextMenu,
        setMenuDimensions,
    };
};
