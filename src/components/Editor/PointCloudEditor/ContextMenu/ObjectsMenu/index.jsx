import { useEffect, useCallback, useMemo } from "react";
import { Tooltip } from "react-tooltip";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faQuestionCircle, faCaretRight } from "@fortawesome/free-solid-svg-icons";

import { useConfig, useCuboids, useEditor } from "contexts";
import { useMousetrapPause } from "hooks";

import { addCuboid } from "utils/cuboids";
import { getChildObjects, getChildTypes, formatObjectData } from "utils/shared";

export const ObjectsMenu = ({
    menuRef,
    isOpened,
    resetContextMenu,
    contextMenuPosition,
    pointIndex,
    isSubMenuOpened,
    setIsSubMenuOpened,
}) => {
    const { config } = useConfig();
    const { objects } = config;
    const { cuboidsGeometriesRef, setCuboids, setSelectedCuboid } = useCuboids();
    const { sceneRef } = useEditor();

    const objectList = useMemo(() => {
        if (!objects) return [];
        const result = [];
        const childTypes = getChildTypes(objects);

        for (const obj of objects) {
            for (const [type, data] of Object.entries(obj)) {
                if (childTypes.has(type)) continue;
                result.push(formatObjectData(type, data, objects));
            }
        }

        return result;
    }, [objects]);

    const addCuboidOnScene = useCallback((cuboid) => {
        const toSelect = { id: cuboid.id, label: cuboid.label, color: cuboid.color };
        const cuboidGeometry = addCuboid(sceneRef.current, cuboid);
        cuboidsGeometriesRef.current[cuboid.id] = cuboidGeometry;
        setSelectedCuboid(toSelect);
    }, []);

    const addObject = useCallback(
        (object) => {
            const color = object.color;
            const label = object.type;
            const clickedPosition = pointIndex.current.position;
            const dimensions = object.dimensions;
            const scale = [dimensions.length, dimensions.width, dimensions.height];
            const position = [
                clickedPosition[0],
                clickedPosition[1],
                clickedPosition[2] + scale[2] / 2,
            ];
            const rotation = [0, 0, 0]; // клонировать предыдущее...?

            setCuboids((prevCuboids = []) => {
                const maxId = prevCuboids.reduce((max, obj) => {
                    const idNum = parseInt(obj.id, 10);
                    return isNaN(idNum) ? max : Math.max(max, idNum);
                }, -1);

                const newId = String(maxId + 1);

                const cuboid = { id: newId, label, color, position, scale, rotation };

                addCuboidOnScene(cuboid);

                const newObject = {
                    id: newId,
                    label: label,
                    color,
                };

                return [...prevCuboids, newObject];
            });

            resetContextMenu();
        },
        [resetContextMenu, pointIndex],
    );

    const handleOpenSubMenu = useCallback(
        (parentObject) => {
            const children = getChildObjects(parentObject.type, objects);
            setIsSubMenuOpened({
                isOpen: true,
                parentObject,
                childrenObjects: children,
            });
        },
        [objects],
    );

    const handleBackToParent = useCallback(() => {
        setIsSubMenuOpened(false);
    }, []);

    const handleContextMenuClick = useCallback(
        (e, object) => {
            if (!object.children) {
                addObject(object);
            } else {
                handleOpenSubMenu(object);
            }
        },
        [addObject, handleOpenSubMenu],
    );

    const handleKeyDown = useCallback(
        (event) => {
            if (!isOpened) return;

            if (event.key === "Escape" && isSubMenuOpened.isOpen) {
                handleBackToParent();
                return;
            }

            if (event.key >= "1" && event.key <= "9") {
                const currentList = isSubMenuOpened.isOpen
                    ? isSubMenuOpened.childrenObjects
                    : objectList;
                const object = currentList[+event.key - 1];
                if (!object) return;

                if (!object.children || isSubMenuOpened.isOpen) {
                    addObject(object);
                } else {
                    handleOpenSubMenu(object);
                }
            }
        },
        [isOpened, objectList, isSubMenuOpened, addObject, handleOpenSubMenu, handleBackToParent],
    );

    useEffect(() => {
        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [handleKeyDown]);

    useMousetrapPause(isOpened);

    if (!objectList?.length) return null;

    return (
        <div
            ref={menuRef}
            className={`editor-context-menu ${isOpened ? "" : "editor-context-menu-hidden"}`}
            style={{
                left: `${contextMenuPosition.x}px`,
                top: `${contextMenuPosition.y}px`,
            }}
        >
            <div className="editor-context-menu-content">
                {(isSubMenuOpened.isOpen ? isSubMenuOpened.childrenObjects : objectList)?.map(
                    (object, index) => (
                        <div key={`object-${index}`} className="editor-context-menu-item-container">
                            <div
                                className="editor-context-menu-item"
                                onClick={(e) => handleContextMenuClick(e, object)}
                            >
                                <div className="editor-context-menu-item-key">{index + 1}</div>
                                <div className="editor-context-menu-item-title">{object.title}</div>
                                <div
                                    className="editor-context-menu-item-info"
                                    data-tooltip-id={`tooltip-${object.title}`}
                                    data-tooltip-html={object?.description}
                                >
                                    <FontAwesomeIcon icon={faQuestionCircle} className="icon" />
                                </div>
                                <Tooltip
                                    id={`tooltip-${object.title}`}
                                    place="bottom"
                                    effect="solid"
                                    delayShow={300}
                                />
                                {object.children && !isSubMenuOpened.isOpen && (
                                    <div className="editor-context-menu-item-tree">
                                        <FontAwesomeIcon icon={faCaretRight} className="icon" />
                                    </div>
                                )}
                            </div>
                        </div>
                    ),
                )}
                {isSubMenuOpened.isOpen && (
                    <div className="editor-context-menu-item-container">
                        <div className="editor-context-menu-item" onClick={handleBackToParent}>
                            <div className="editor-context-menu-item-key back">{`Esc`}</div>
                            <div className="editor-context-menu-item-title">{`Назад`}</div>
                            <div
                                className="editor-context-menu-item-info"
                                data-tooltip-id={`tooltip-${123}`}
                                data-tooltip-html={123}
                            ></div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
