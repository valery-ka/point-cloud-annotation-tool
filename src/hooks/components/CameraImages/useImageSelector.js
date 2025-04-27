import { useCallback, useState } from "react";
import { useImages } from "contexts";

const CONTEXT_MENU_RESET_POSITION = { x: -1000, y: -1000 };

export const useImageSelector = (cameraWrapperRef) => {
    const { areImagesLoading, setSelectedCamera } = useImages();

    const [contextMenuPosition, setContextMenuPosition] = useState(CONTEXT_MENU_RESET_POSITION);
    const [menuDimensions, setMenuDimensions] = useState({ width: 0, height: 0 });

    const handleMouseUp = useCallback(
        (e) => {
            if (e.button === 2 && cameraWrapperRef.current) {
                e.preventDefault();

                const padding = 10;
                const wrapperRect = cameraWrapperRef.current.getBoundingClientRect();
                const { width: menuWidth, height: menuHeight } = menuDimensions;

                let x = e.clientX - wrapperRect.left;
                let y = e.clientY - wrapperRect.top;

                if (x + menuWidth > wrapperRect.width) {
                    x = wrapperRect.width - menuWidth - padding;
                }

                if (y + menuHeight > wrapperRect.height) {
                    y = wrapperRect.height - menuHeight - padding;
                }

                setContextMenuPosition({ x, y });
            }
        },
        [menuDimensions],
    );

    const openContextMenu = useCallback(
        ({ offsetX = 0, offsetY = 0 }) => {
            if (!cameraWrapperRef.current || areImagesLoading) return;
            const wrapperRect = cameraWrapperRef.current.getBoundingClientRect();
            const { width: menuWidth, height: menuHeight } = menuDimensions;

            let x = wrapperRect.width - menuWidth + offsetX;
            let y = wrapperRect.height - menuHeight + offsetY;

            setContextMenuPosition({ x, y });
        },
        [menuDimensions, areImagesLoading],
    );

    const handleSelectCamera = useCallback(
        (cameraName) => {
            setSelectedCamera(cameraName);
        },
        [setSelectedCamera],
    );

    const handleCloseContextMenu = useCallback(() => {
        setContextMenuPosition(CONTEXT_MENU_RESET_POSITION);
    }, []);

    return {
        handleMouseUp,
        contextMenuPosition,
        handleSelectCamera,
        handleCloseContextMenu,
        setMenuDimensions,
        openContextMenu,
    };
};
