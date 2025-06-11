import { useCallback, useState } from "react";

const CONTEXT_MENU_RESET_POSITION = { x: -1000, y: -1000 };

export const useContextMenuSelector = ({ wrapperRef, onSelect, isEnabled = true }) => {
    const [contextMenuPosition, setContextMenuPosition] = useState(CONTEXT_MENU_RESET_POSITION);
    const [menuDimensions, setMenuDimensions] = useState({ width: 0, height: 0 });

    const handleMouseUp = useCallback(
        (e) => {
            if (e.button === 2 && wrapperRef?.current && isEnabled) {
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
        [menuDimensions, isEnabled],
    );

    const openContextMenu = useCallback(
        ({ offsetX = 0, offsetY = 0, targetElement } = {}) => {
            if (!wrapperRef?.current || !isEnabled) return;

            const wrapperRect = wrapperRef.current.getBoundingClientRect();
            const { width: menuWidth, height: menuHeight } = menuDimensions;
            const padding = 10;

            let x, y;

            if (targetElement) {
                const targetRect = targetElement.getBoundingClientRect();
                const anchorX = targetRect.left - wrapperRect.left;
                const anchorY = targetRect.bottom - wrapperRect.top;

                x = Math.max(
                    padding,
                    Math.min(
                        anchorX - menuWidth + offsetX,
                        wrapperRect.width - menuWidth - padding,
                    ),
                );
                y = Math.max(
                    padding,
                    Math.min(anchorY + offsetY, wrapperRect.height - menuHeight - padding),
                );
            } else {
                x = wrapperRect.width - menuWidth + offsetX;
                y = wrapperRect.height - menuHeight + offsetY;
            }

            setContextMenuPosition({ x, y });
        },
        [menuDimensions, isEnabled],
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
