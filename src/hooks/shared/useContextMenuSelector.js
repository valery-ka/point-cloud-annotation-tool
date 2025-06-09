import { useCallback, useState } from "react";

const CONTEXT_MENU_RESET_POSITION = { x: -1000, y: -1000 };

export const useContextMenuSelector = ({ wrapperRef, onSelect }) => {
    const [contextMenuPosition, setContextMenuPosition] = useState(CONTEXT_MENU_RESET_POSITION);
    const [menuDimensions, setMenuDimensions] = useState({ width: 0, height: 0 });

    const handleMouseUp = useCallback(
        (e) => {
            if (e.button === 2 && wrapperRef?.current) {
                e.preventDefault();

                const padding = 10;
                const wrapperRect = wrapperRef.current.getBoundingClientRect();
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
        ({ offsetX = 0, offsetY = 0 } = {}) => {
            if (!wrapperRef?.current) return;

            const wrapperRect = wrapperRef.current.getBoundingClientRect();
            const { width: menuWidth, height: menuHeight } = menuDimensions;

            let x = wrapperRect.width - menuWidth + offsetX;
            let y = wrapperRect.height - menuHeight + offsetY;

            setContextMenuPosition({ x, y });
        },
        [menuDimensions],
    );

    const handleSelect = useCallback(
        (value) => {
            onSelect?.(value);
            setContextMenuPosition(CONTEXT_MENU_RESET_POSITION);
        },
        [onSelect],
    );

    const handleCloseContextMenu = useCallback(() => {
        setContextMenuPosition(CONTEXT_MENU_RESET_POSITION);
    }, []);

    return {
        contextMenuPosition,
        handleMouseUp,
        openContextMenu,
        handleCloseContextMenu,
        handleSelect,
        setMenuDimensions,
    };
};
