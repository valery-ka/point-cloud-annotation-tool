import { Plane, Vector2, Vector3, Raycaster } from "three";
import { useEffect, useState, useRef, useCallback } from "react";

import { useHoveredPoint, useTools, useConfig, useEditor } from "contexts";
import { useSubscribeFunction } from "hooks";

import { ModerationMenu } from "./ModerationMenu";
import { ObjectsMenu } from "./ObjectsMenu";

const OPEN_OBJECTS_MENU = (event) => event.button === 0 && event.ctrlKey;
const OPEN_MODERATION_MENU = (event) => event.button === 2 && event.ctrlKey;
const CONTEXT_MENU_CONTAINER = ".tool-3d-container";
const CONTEXT_MENU_RESET_POSITION = { x: -1000, y: -1000 };

export const EditorContextMenu = () => {
    const { cameraRef } = useEditor();
    const { highlightedPoint } = useHoveredPoint();
    const { selectedTool } = useTools();
    const { isModerationJob } = useConfig();

    const menuRefs = useRef({});

    const [isTextInputOpened, setIsTextInputOpened] = useState(false);
    const [isSubMenuOpened, setIsSubMenuOpened] = useState(false);
    const [contextMenuPosition, setContextMenuPosition] = useState(CONTEXT_MENU_RESET_POSITION);

    const clickedInfoRef = useRef(null);

    const [isModerationMenuOpened, setIsModerationMenuOpened] = useState(false);
    const [isObjectsMenuOpened, setIsObjectsMenuOpened] = useState(false);

    const raycasterRef = useRef(new Raycaster());

    const resetContextMenu = useCallback(() => {
        clickedInfoRef.current = null;
        setIsSubMenuOpened(false);
        setIsTextInputOpened(false);
        setIsModerationMenuOpened(false);
        setIsObjectsMenuOpened(false);
        setContextMenuPosition(CONTEXT_MENU_RESET_POSITION);
    }, []);

    const updateMenuPosition = useCallback((x, y, menuKey) => {
        const container = document.querySelector(CONTEXT_MENU_CONTAINER);
        const padding = 10;

        const menuEl = menuRefs.current[menuKey];
        if (!container || !menuEl) return;

        const containerRect = container.getBoundingClientRect();
        const { offsetWidth, offsetHeight } = menuEl;

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
                updateMenuPosition(x, y, "moderation");
            });
        }
    }, [isTextInputOpened]);

    const handleModerationMenuOpen = useCallback(
        (event) => {
            if (selectedTool !== "handPointer" || !isModerationJob) return;
            setIsObjectsMenuOpened(false);

            const container = document.querySelector(CONTEXT_MENU_CONTAINER);

            if (container && container.contains(event.target)) {
                if (highlightedPoint) {
                    const { left, top } = container.getBoundingClientRect();
                    const clientX = event.clientX - left;
                    const clientY = event.clientY - top;

                    requestAnimationFrame(() => {
                        updateMenuPosition(clientX, clientY, "moderation");
                    });

                    clickedInfoRef.current = {
                        id: highlightedPoint?.index,
                        position: [highlightedPoint?.x, highlightedPoint?.y, highlightedPoint?.z],
                        source: "point",
                    };

                    setIsModerationMenuOpened(true);
                }
            }
        },
        [highlightedPoint, selectedTool],
    );

    const handleObjectsMenuOpen = useCallback(
        (event) => {
            if (selectedTool !== "handPointer") return;
            setIsModerationMenuOpened(false);

            const container = document.querySelector(CONTEXT_MENU_CONTAINER);

            if (container && container.contains(event.target)) {
                const { left, top, width, height } = container.getBoundingClientRect();
                const clientX = event.clientX - left;
                const clientY = event.clientY - top;

                requestAnimationFrame(() => {
                    updateMenuPosition(clientX, clientY, "objects");
                });

                setIsObjectsMenuOpened(true);

                if (highlightedPoint) {
                    clickedInfoRef.current = {
                        id: highlightedPoint.index,
                        position: [highlightedPoint.x, highlightedPoint.y, highlightedPoint.z],
                    };
                } else {
                    const mouse = new Vector2();
                    mouse.x = ((event.clientX - left) / width) * 2 - 1;
                    mouse.y = -((event.clientY - top) / height) * 2 + 1;

                    raycasterRef.current.setFromCamera(mouse, cameraRef.current);

                    const planeZ = new Plane(new Vector3(0, 0, 1), 0);
                    const intersection = new Vector3();
                    raycasterRef.current.ray.intersectPlane(planeZ, intersection);

                    clickedInfoRef.current = {
                        id: null,
                        position: [intersection.x, intersection.y, intersection.z],
                    };
                }
            }
        },
        [highlightedPoint, selectedTool],
    );

    const editCuboidLabel = useCallback(
        (data) => {
            if (data) {
                const { event, cuboid } = data;
                setIsModerationMenuOpened(false);

                const container = document.querySelector(CONTEXT_MENU_CONTAINER);

                if (container && container.contains(event.target)) {
                    const { left, top } = container.getBoundingClientRect();
                    const clientX = event.clientX - left;
                    const clientY = event.clientY - top;

                    requestAnimationFrame(() => {
                        updateMenuPosition(clientX, clientY, "objects");
                    });

                    setIsObjectsMenuOpened(true);

                    clickedInfoRef.current = cuboid;
                }
            }
        },
        [selectedTool],
    );

    useSubscribeFunction("editCuboidLabel", editCuboidLabel, []);

    const openCuboidIssuesList = useCallback((data) => {
        if (data) {
            const { event, cuboid } = data;
            setIsObjectsMenuOpened(false);

            const container = document.querySelector(CONTEXT_MENU_CONTAINER);

            if (container && container.contains(event.target)) {
                const { left, top } = container.getBoundingClientRect();
                const clientX = event.clientX - left;
                const clientY = event.clientY - top;

                requestAnimationFrame(() => {
                    updateMenuPosition(clientX, clientY, "moderation");
                });

                clickedInfoRef.current = {
                    id: cuboid.id,
                    source: "object",
                };

                setIsModerationMenuOpened(true);
            }
        }
    }, []);

    useSubscribeFunction("openCuboidIssuesList", openCuboidIssuesList, []);

    const handleMouseDown = useCallback(
        (event) => {
            if (isTextInputOpened) return;

            const container = document.querySelector(CONTEXT_MENU_CONTAINER);

            if (container && container.contains(event.target)) {
                if (OPEN_MODERATION_MENU(event)) {
                    handleModerationMenuOpen(event);
                } else if (OPEN_OBJECTS_MENU(event)) {
                    handleObjectsMenuOpen(event);
                } else {
                    const clickedInsideMenu = Object.values(menuRefs.current).some(
                        (menuEl) => menuEl && menuEl.contains(event.target),
                    );

                    if (!clickedInsideMenu) {
                        resetContextMenu();
                    }
                }
            }
        },
        [handleModerationMenuOpen, handleObjectsMenuOpen, isTextInputOpened],
    );

    const handleKeyDown = useCallback(
        (event) => {
            if (event.key === "Escape" && !isSubMenuOpened) {
                resetContextMenu();
                return;
            }
        },
        [isSubMenuOpened],
    );

    useEffect(() => {
        document.addEventListener("mousedown", handleMouseDown);
        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("mousedown", handleMouseDown);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [handleMouseDown, handleKeyDown]);

    return (
        <>
            <ObjectsMenu
                menuRef={(el) => (menuRefs.current["objects"] = el)}
                isOpened={isObjectsMenuOpened}
                resetContextMenu={resetContextMenu}
                contextMenuPosition={contextMenuPosition}
                clickedInfoRef={clickedInfoRef}
                isSubMenuOpened={isSubMenuOpened}
                setIsSubMenuOpened={setIsSubMenuOpened}
            />
            <ModerationMenu
                menuRef={(el) => (menuRefs.current["moderation"] = el)}
                isOpened={isModerationMenuOpened}
                resetContextMenu={resetContextMenu}
                contextMenuPosition={contextMenuPosition}
                clickedInfoRef={clickedInfoRef}
                isTextInputOpened={isTextInputOpened}
                setIsTextInputOpened={setIsTextInputOpened}
            />
        </>
    );
};
