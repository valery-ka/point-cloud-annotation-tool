import React, { useEffect, useState, useCallback, useRef, memo } from "react";
import { useTranslation } from "react-i18next";
import { faEye, faEyeSlash, faPlus } from "@fortawesome/free-solid-svg-icons";

import {
    useEditor,
    useConfig,
    useEvent,
    useSettings,
    useTools,
    useCuboids,
    useBatch,
} from "contexts";
import {
    useSubscribeFunction,
    useBindHotkey,
    useContextMenuSelector,
    useAddRemoveRestoreCuboid,
    useForceUpdate,
} from "hooks";

import { ContextMenu } from "components";

import { SidebarIcon } from "../SidebarIcon";
import { ClassItem } from "./ClassItem";
import { CuboidItem } from "./CuboidItem";

import * as APP_CONSTANTS from "constants";

// const COMPONENT_NAME = "ObjectsTab.";
const COMPONENT_NAME = "";
const { DEFAULT_TOOL } = APP_CONSTANTS;

export const ObjectsTab = memo(({ title }) => {
    const { t } = useTranslation();

    const { nonHiddenClasses } = useConfig();
    const { subscribe, unsubscribe } = useEvent();
    const { settings } = useSettings();
    const { hotkeys } = settings;

    const { setSelectedTool } = useTools();
    const { classesVisibilityRef, selectedClassIndex, setSelectedClassIndex } = useEditor();

    const { setBatchMode } = useBatch();

    const { cuboids, selectedCuboid, cuboidsVisibilityRef, setSelectedCuboid, deletedObjects } =
        useCuboids();

    const { restoreObject } = useAddRemoveRestoreCuboid();

    //
    // Context Menu Start
    const containerRef = useRef(null);
    const isEnabled = deletedObjects.length > 0;

    useEffect(() => {
        const container = document.getElementsByClassName("tool-3d-scene");
        containerRef.current = container[0];
    }, []);

    const {
        openContextMenu,
        contextMenuPosition,
        handleSelect,
        handleCloseContextMenu,
        setMenuDimensions,
    } = useContextMenuSelector({
        wrapperRef: containerRef,
        onSelect: restoreObject,
        isEnabled: isEnabled,
    });
    // Context Menu End
    //

    //
    // General objects
    const { forceUpdate } = useForceUpdate();

    const getHideShowToggleState = useCallback(() => {
        const allClassesVisible = Object.values(classesVisibilityRef.current).every(
            (cls) => cls.visible === true,
        );
        const allCuboidsVisible = Object.values(cuboidsVisibilityRef.current).every(
            (obj) => obj.visible === true,
        );
        return allClassesVisible && allCuboidsVisible;
    }, []);

    const handleVisibilityState = useCallback(() => {
        forceUpdate();
    }, []);

    useSubscribeFunction("filterObject", handleVisibilityState, []);

    const unselectObject = useCallback(() => {
        setSelectedClassIndex(null);
        setSelectedCuboid(null);
        setBatchMode(false);
        setSelectedTool(DEFAULT_TOOL);
    }, []);

    useBindHotkey(hotkeys["fixed"]["unselectObject"], unselectObject);
    // General objects
    //

    //
    // Classes Subs Start
    const handleIsClassVisible = useCallback((cls) => {
        return classesVisibilityRef.current[cls]?.visible;
    }, []);

    useEffect(() => {
        const subscriptions = nonHiddenClasses.map((cls, index) => {
            const originalIndex = cls.originalIndex;
            const actionName = `selectClass${originalIndex}`;
            const callback = () => {
                setSelectedCuboid(null);
                setSelectedClassIndex(index);
            };
            subscribe(actionName, callback);
            return { actionName, callback };
        });

        return () => {
            subscriptions.forEach(({ actionName, callback }) => {
                unsubscribe(actionName, callback);
            });
        };
    }, [subscribe, unsubscribe, nonHiddenClasses]);
    // Classes Subs End
    //

    //
    // Objects Subs Start
    const handleIsObjectVisible = useCallback((obj) => {
        return cuboidsVisibilityRef.current[obj]?.visible;
    }, []);

    useEffect(() => {
        const subscriptions = cuboids.map((obj, index) => {
            const id = obj.id;
            const actionName = `selectObject${id}`;
            const callback = () => {
                setSelectedClassIndex(null);
                setSelectedCuboid(obj);
            };
            subscribe(actionName, callback);
            return { actionName, callback };
        });

        return () => {
            subscriptions.forEach(({ actionName, callback }) => {
                unsubscribe(actionName, callback);
            });
        };
    }, [subscribe, unsubscribe, cuboids]);
    // Objects Subs End
    //

    useEffect(() => {
        if (selectedCuboid) {
            setSelectedClassIndex(null);
        }
    }, [selectedCuboid]);

    return (
        <div className="sidebar-tab-panel">
            <div className="tab-header-container" onClick={unselectObject}>
                <h2 className="tab-header">{title}</h2>
                <div className="tab-header-buttons">
                    <SidebarIcon
                        className="icon-style"
                        size="20px"
                        title={
                            getHideShowToggleState()
                                ? t(`${COMPONENT_NAME}hideAll`)
                                : t(`${COMPONENT_NAME}showAll`)
                        }
                        icon={getHideShowToggleState() ? faEyeSlash : faEye}
                        type={"filterObject"}
                        action={
                            getHideShowToggleState()
                                ? { filter: "hideAll", unit: "all" }
                                : { filter: "showAll", unit: "all" }
                        }
                        hotkey={hotkeys["misc"]["hideShowAll"]}
                    />
                    <div
                        onMouseUp={(e) =>
                            openContextMenu({
                                targetElement: e.currentTarget,
                            })
                        }
                    >
                        <SidebarIcon
                            className={`icon-style ${isEnabled ? "" : "disabled"}`}
                            size="20px"
                            title={t("removedObjectsList")}
                            icon={faPlus}
                        />
                    </div>
                </div>
            </div>
            <div className="sidebar-content">
                <div className="objects-list">
                    {nonHiddenClasses.length > 0 && (
                        <div className="classes-list">
                            {nonHiddenClasses.map((cls, idx) => (
                                <ClassItem
                                    key={idx}
                                    cls={cls}
                                    index={cls.originalIndex}
                                    action={`selectClass${cls.originalIndex}`}
                                    hotkey={
                                        hotkeys["selectClass"]?.[`selectClass${cls.originalIndex}`]
                                    }
                                    isSelected={selectedClassIndex === idx}
                                    isVisible={handleIsClassVisible(cls.originalIndex)}
                                />
                            ))}
                        </div>
                    )}
                    {cuboids.length > 0 && (
                        <div className="cuboids-list">
                            {cuboids.map((obj, idx) => (
                                <CuboidItem
                                    key={idx}
                                    obj={obj}
                                    index={obj.id}
                                    action={`selectObject${obj.id}`}
                                    isSelected={selectedCuboid?.id === obj?.id}
                                    isVisible={handleIsObjectVisible(obj?.id)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
            <ContextMenu
                position={contextMenuPosition}
                itemsList={deletedObjects}
                onSelect={handleSelect}
                onClose={handleCloseContextMenu}
                setMenuDimensions={setMenuDimensions}
                selectMode={"index"}
                hasNone={false}
            />
        </div>
    );
});
