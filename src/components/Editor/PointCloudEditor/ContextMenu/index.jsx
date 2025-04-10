import { useEffect, useState, useRef, useCallback } from "react";

import { useHoveredPoint, useTools } from "contexts";

import { ModerationMenu } from "./ModerationMenu";

const OPEN_OBJECTS_MENU = (event) => event.button === 2 && event.ctrlKey;
const OPEN_MODERATION_MENU = (event) => event.button === 0 && event.ctrlKey;
const CONTEXT_MENU_CONTAINER = ".tool-3d-container";
const CONTEXT_MENU_RESET_POSITION = { x: -1000, y: -1000 };

export const ContextMenu = () => {
    const { highlightedPoint } = useHoveredPoint();
    const { selectedTool } = useTools();

    const menuRef = useRef(null);
    const [isTextInputOpened, setIsTextInputOpened] = useState(false);
    const [contextMenuPosition, setContextMenuPosition] = useState(CONTEXT_MENU_RESET_POSITION);

    const pointIndexRef = useRef(null);
    const [isModerationMenuOpened, setIsModerationMenuOpened] = useState(false);

    const resetContextMenu = useCallback(() => {
        pointIndexRef.current = null;
        setIsModerationMenuOpened(false);
        setContextMenuPosition(CONTEXT_MENU_RESET_POSITION);
    }, []);

    const updateMenuPosition = useCallback((x, y) => {
        const container = document.querySelector(CONTEXT_MENU_CONTAINER);
        const padding = 10;

        if (!container || !menuRef.current) return;

        const containerRect = container.getBoundingClientRect();
        const { offsetWidth, offsetHeight } = menuRef.current;

        const maxX = containerRect.width - offsetWidth - padding;
        const maxY = containerRect.height - offsetHeight - padding;

        const adjustedPosition = {
            x: Math.max(padding, Math.min(x, maxX)),
            y: Math.max(padding, Math.min(y, maxY)),
        };

        setContextMenuPosition(adjustedPosition);
    }, []);

    useEffect(() => {
        const { x, y } = contextMenuPosition;
        if (isTextInputOpened) {
            requestAnimationFrame(() => {
                updateMenuPosition(x, y);
            });
        }
    }, [isTextInputOpened]);

    const handleModerationMenuOpen = useCallback(
        (event) => {
            if (selectedTool !== "handPointer") return;

            const container = document.querySelector(CONTEXT_MENU_CONTAINER);

            if (container && container.contains(event.target)) {
                if (highlightedPoint) {
                    const { left, top } = container.getBoundingClientRect();
                    const clientX = event.clientX - left;
                    const clientY = event.clientY - top;

                    requestAnimationFrame(() => {
                        updateMenuPosition(clientX, clientY);
                    });

                    const { x, y, z, index } = highlightedPoint;

                    pointIndexRef.current = {
                        index: index,
                        position: [x, y, z],
                    };

                    setIsModerationMenuOpened(true);
                }
            }
        },
        [highlightedPoint],
    );

    const handleObjectsMenuOpen = useCallback((event) => {
        const container = document.querySelector(CONTEXT_MENU_CONTAINER);

        if (container && container.contains(event.target)) {
            if (OPEN_OBJECTS_MENU(event)) {
                console.log("Будет меню объектов");

                // const { left, top } = container.getBoundingClientRect();
                // const x = event.clientX - left;
                // const y = event.clientY - top;

                // requestAnimationFrame(() => {
                //     updateMenuPosition(x, y);
                // });

                // resetContextMenu();
            }
        }
    }, []);

    const handleMouseDown = useCallback(
        (event) => {
            if (isTextInputOpened) return;
            const container = document.querySelector(CONTEXT_MENU_CONTAINER);

            if (container && container.contains(event.target)) {
                if (OPEN_MODERATION_MENU(event)) {
                    handleModerationMenuOpen(event);
                } else if (OPEN_OBJECTS_MENU(event)) {
                    handleObjectsMenuOpen(event);
                } else if (menuRef.current && !menuRef.current.contains(event.target)) {
                    resetContextMenu();
                }
            }
        },
        [handleModerationMenuOpen, isTextInputOpened],
    );

    useEffect(() => {
        document.addEventListener("mousedown", handleMouseDown);
        return () => {
            document.removeEventListener("mousedown", handleMouseDown);
        };
    }, [handleMouseDown]);

    return (
        <ModerationMenu
            menuRef={menuRef}
            isOpened={isModerationMenuOpened}
            resetContextMenu={resetContextMenu}
            contextMenuPosition={contextMenuPosition}
            pointIndex={pointIndexRef}
            isTextInputOpened={isTextInputOpened}
            setIsTextInputOpened={setIsTextInputOpened}
        />
    );
};
