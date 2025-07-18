import { useEffect, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Tooltip } from "react-tooltip";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faQuestionCircle, faCaretRight } from "@fortawesome/free-solid-svg-icons";

import { useConfig, useCuboids } from "contexts";
import { useMousetrapPause, useAddRemoveRestoreCuboid } from "hooks";

import { getChildObjects, getChildTypes, formatObjectData } from "utils/shared";

export const ObjectsMenu = ({
    menuRef,
    isOpened,
    resetContextMenu,
    contextMenuPosition,
    clickedInfoRef,
    isSubMenuOpened,
    setIsSubMenuOpened,
}) => {
    const { t } = useTranslation();

    const { config } = useConfig();
    const { objects } = config;

    const { selectedCuboid } = useCuboids();

    const { addNewObject, cloneObject, updateExistingObject } = useAddRemoveRestoreCuboid();

    const isCloningAvailable = clickedInfoRef.current?.position && selectedCuboid;

    const objectList = useMemo(() => {
        if (!objects) return [];
        const result = [];
        const childTypes = getChildTypes(objects);

        for (const obj of objects) {
            for (const [label, data] of Object.entries(obj)) {
                if (childTypes.has(label)) continue;
                result.push(formatObjectData(label, data, objects));
            }
        }

        return result;
    }, [objects]);

    const handleObjectAction = useCallback(
        (object) => {
            const { position, id } = clickedInfoRef.current;
            position ? addNewObject(object, position) : updateExistingObject(id, object);
            resetContextMenu();
        },
        [addNewObject, updateExistingObject, resetContextMenu],
    );

    const handleOpenSubMenu = useCallback(
        (parentObject) => {
            const children = getChildObjects(parentObject.label, objects);
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
                handleObjectAction(object);
            } else {
                handleOpenSubMenu(object);
            }
        },
        [handleObjectAction, handleOpenSubMenu],
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
                    handleObjectAction(object);
                } else {
                    handleOpenSubMenu(object);
                }
            }

            if (event.code === "KeyC" && isCloningAvailable) {
                cloneObject(clickedInfoRef, resetContextMenu);
            }
        },
        [
            isOpened,
            isSubMenuOpened,
            resetContextMenu,
            objectList,
            cloneObject,
            handleObjectAction,
            handleOpenSubMenu,
            handleBackToParent,
        ],
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
                                    style={{
                                        visibility: object?.description ? "visible" : "hidden",
                                    }}
                                >
                                    <FontAwesomeIcon icon={faQuestionCircle} className="icon" />
                                </div>
                                {object?.description && (
                                    <Tooltip
                                        id={`tooltip-${object.title}`}
                                        place="bottom"
                                        effect="solid"
                                        delayShow={300}
                                    />
                                )}
                                {object.children && !isSubMenuOpened.isOpen && (
                                    <div className="editor-context-menu-item-tree">
                                        <FontAwesomeIcon icon={faCaretRight} className="icon" />
                                    </div>
                                )}
                            </div>
                        </div>
                    ),
                )}
                {isCloningAvailable && (
                    <div className="editor-context-menu-item-container">
                        <div className="editor-context-menu-item" onClick={cloneObject}>
                            <div className="editor-context-menu-item-key back">{"C"}</div>
                            <div className="editor-context-menu-item-title">{t("cloneObject")}</div>
                            <div
                                className="editor-context-menu-item-info"
                                data-tooltip-id={"tooltip-clone-object"}
                                data-tooltip-html={"clone-object"}
                            ></div>
                        </div>
                    </div>
                )}
                {isSubMenuOpened.isOpen && (
                    <div className="editor-context-menu-item-container">
                        <div className="editor-context-menu-item" onClick={handleBackToParent}>
                            <div className="editor-context-menu-item-key back">{`Esc`}</div>
                            <div className="editor-context-menu-item-title">{t("back")}</div>
                            <div
                                className="editor-context-menu-item-info"
                                data-tooltip-id={"tooltip-back-to-parent"}
                                data-tooltip-html={"back-to-parent"}
                            ></div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
