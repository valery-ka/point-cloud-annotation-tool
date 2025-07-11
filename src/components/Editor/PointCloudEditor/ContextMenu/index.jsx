import { Plane, Vector2, Vector3, Raycaster } from "three";
import { useEffect, useState, useRef, useCallback } from "react";

import { useHoveredPoint, useTools, useConfig, useEditor } from "contexts";
import { useSubscribeFunction } from "hooks";

import { ModerationMenu } from "./ModerationMenu";
import { ObjectsMenu } from "./ObjectsMenu";

const OPEN_OBJECTS_MENU = (event, isDetectionTask) =>
    event.button === 0 && event.ctrlKey && isDetectionTask;
const OPEN_MODERATION_MENU = (event) => event.button === 2 && event.ctrlKey;
const CONTEXT_MENU_CONTAINER = ".tool-3d-container";
const CONTEXT_MENU_RESET_POSITION = { x: -1000, y: -1000 };

export const EditorContextMenu = () => {
    const { cameraRef } = useEditor();
    const { highlightedPoint } = useHoveredPoint();
    const { selectedTool } = useTools();
    const { isModerationJob, isDetectionTask } = useConfig();

    const menuRefs = useRef({});

    const [isTextInputOpened, setIsTextInputOpened] = useState(false);
    const [isSubMenuOpened, setIsSubMenuOpened] = useState(false);
    const [contextMenuPosition, setContextMenuPosition] = useState(CONTEXT_MENU_RESET_POSITION);

    const clickedInfoRef = useRef(null);

    const [isModerationMenuOpened, setIsModerationMenuOpened] = useState(false);
    const [isObjectsMenuOpened, setIsObjectsMenuOpened] = useState(false);

    const raycasterRef = useRef(new Raycaster());

    const getDefaultContextMenuContainer = useCallback(() => {
        return document.querySelector(CONTEXT_MENU_CONTAINER);
    }, []);

    const resetContextMenu = useCallback(() => {
        clickedInfoRef.current = null;
        setIsSubMenuOpened(false);
        setIsTextInputOpened(false);
        setIsModerationMenuOpened(false);
        setIsObjectsMenuOpened(false);
        setContextMenuPosition(CONTEXT_MENU_RESET_POSITION);
    }, []);

    const updateMenuPosition = useCallback(({ position, container, menuKey }) => {
        const padding = 2;

        const menuEl = menuRefs.current[menuKey];
        if (!container || !menuEl) return;

        const containerRect = container.getBoundingClientRect();
        const { offsetWidth, offsetHeight } = menuEl;

        const maxX = containerRect.width - offsetWidth - padding;
        const maxY = containerRect.height - offsetHeight - padding;

        const adjustedPosition = {
            x: Math.max(padding, Math.min(position.x, maxX)) + 1,
            y: Math.max(padding, Math.min(position.y, maxY)) + 1,
        };

        setContextMenuPosition(adjustedPosition);
    }, []);

    useEffect(() => {
        const { x, y } = contextMenuPosition;
        const container = getDefaultContextMenuContainer();

        if (isTextInputOpened) {
            requestAnimationFrame(() => {
                updateMenuPosition({
                    position: { x, y },
                    container: container,
                    menuKey: "moderation",
                });
            });
        }
    }, [isTextInputOpened]);

    const handleModerationMenuOpen = useCallback(
        (event) => {
            if (selectedTool !== "handPointer" || !isModerationJob) return;
            setIsObjectsMenuOpened(false);

            const container = getDefaultContextMenuContainer();

            if (container && container.contains(event.target)) {
                if (highlightedPoint) {
                    const { left, top } = container.getBoundingClientRect();
                    const x = event.clientX - left;
                    const y = event.clientY - top;

                    requestAnimationFrame(() => {
                        updateMenuPosition({
                            position: { x, y },
                            container: container,
                            menuKey: "moderation",
                        });
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

            const container = getDefaultContextMenuContainer();

            if (container && container.contains(event.target)) {
                const { left, top, width, height } = container.getBoundingClientRect();
                const x = event.clientX - left;
                const y = event.clientY - top;

                requestAnimationFrame(() => {
                    updateMenuPosition({
                        position: { x, y },
                        container: container,
                        menuKey: "objects",
                    });
                });

                setIsObjectsMenuOpened(true);

                if (highlightedPoint) {
                    clickedInfoRef.current = {
                        id: highlightedPoint.index,
                        position: [highlightedPoint.x, highlightedPoint.y, highlightedPoint.z],
                    };
                } else {
                    const mouse = new Vector2();
                    mouse.x = (x / width) * 2 - 1;
                    mouse.y = -(y / height) * 2 + 1;

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
            if (data && !isTextInputOpened) {
                const { event, cuboid, menuContainer } = data;
                setIsModerationMenuOpened(false);

                const container = menuContainer || getDefaultContextMenuContainer();

                if (container && container.contains(event.target)) {
                    const { left, top } = container.getBoundingClientRect();
                    const x = event.clientX - left;
                    const y = event.clientY - top;

                    requestAnimationFrame(() => {
                        updateMenuPosition({
                            position: { x, y },
                            container: container,
                            menuKey: "objects",
                        });
                    });

                    setIsObjectsMenuOpened(true);

                    clickedInfoRef.current = cuboid;
                }
            }
        },
        [isTextInputOpened],
    );

    useSubscribeFunction("editCuboidLabel", editCuboidLabel, []);

    const openCuboidIssuesList = useCallback(
        (data) => {
            if (data) {
                if (data && !isTextInputOpened) {
                    const { event, cuboid } = data;
                    setIsObjectsMenuOpened(false);

                    const container = getDefaultContextMenuContainer();

                    if (container && container.contains(event.target)) {
                        const { left, top } = container.getBoundingClientRect();
                        const x = event.clientX - left;
                        const y = event.clientY - top;

                        requestAnimationFrame(() => {
                            updateMenuPosition({
                                position: { x, y },
                                container: container,
                                menuKey: "moderation",
                            });
                        });

                        clickedInfoRef.current = {
                            id: cuboid.id,
                            source: "object",
                        };

                        setIsModerationMenuOpened(true);
                    }
                }
            }
        },
        [isTextInputOpened],
    );

    useSubscribeFunction("openCuboidIssuesList", openCuboidIssuesList, []);

    const handleMouseDown = useCallback(
        (event) => {
            if (isTextInputOpened) return;

            const clickedInsideMenu = Object.values(menuRefs.current).some(
                (menuEl) => menuEl && menuEl.contains(event.target),
            );

            if (clickedInsideMenu) return;

            const container = getDefaultContextMenuContainer();
            const clickedInsideContainer = container && container.contains(event.target);

            if (clickedInsideContainer) {
                if (OPEN_MODERATION_MENU(event)) {
                    handleModerationMenuOpen(event);
                    return;
                }
                if (OPEN_OBJECTS_MENU(event, isDetectionTask)) {
                    handleObjectsMenuOpen(event);
                    return;
                }
            }

            resetContextMenu();
        },
        [
            handleModerationMenuOpen,
            handleObjectsMenuOpen,
            resetContextMenu,
            isTextInputOpened,
            isDetectionTask,
        ],
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
