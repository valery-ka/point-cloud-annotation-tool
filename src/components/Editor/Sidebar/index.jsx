import React, { memo, useState, useCallback } from "react";
import {
    faList,
    faCog,
    faCommentAlt,
    faKeyboard,
    faCaretRight,
    faCaretLeft,
} from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";

import { useFileManager, useFrames } from "contexts";
import { useSubscribeFunction } from "hooks";

import { RenderSidebarTabsButton } from "./RenderSidebarTabsButton";
import { ObjectsTab } from "./ObjectsTab";
import { SettingsTab } from "./SettingsTab";
import { ModerationTab } from "./ModerationTab";
import { HotkeysTab } from "./HotkeysTab";
import { ObjectCardTab } from "./ObjectCardTab";

// const COMPONENT_NAME = "Sidebar.";
const COMPONENT_NAME = "";

export const Sidebar = memo(() => {
    const { pcdFiles } = useFileManager();
    const { arePointCloudsLoading } = useFrames();

    const [activeTab, setActiveTab] = useState(0);
    const [sidebarVisible, setSidebarVisible] = useState(true);

    const { t } = useTranslation();

    const toggleSidebar = useCallback(() => {
        setSidebarVisible((prev) => !prev);
    }, []);

    useSubscribeFunction("toggleSidebar", toggleSidebar, []);

    const setTab = useCallback((data) => {
        if (typeof data === "object" && data.index !== undefined) {
            setActiveTab(data.index);
        } else {
            setActiveTab(data);
        }
    }, []);

    useSubscribeFunction("setActiveTab", (data) => setTab(data), []);

    if (!pcdFiles.length || arePointCloudsLoading) return null;

    const createTab = (icon, title, Component, hasTabButton = true) => ({
        icon,
        title: t(`${COMPONENT_NAME}${title}`),
        component: <Component title={t(`${COMPONENT_NAME}${title}`)} />,
        hasTabButton,
    });

    const tabs = [
        createTab(faList, "objectsTab", ObjectsTab),
        createTab(faCog, "settingsTab", SettingsTab),
        createTab(faCommentAlt, "moderationTab", ModerationTab),
        createTab(faKeyboard, "hotkeysTab", HotkeysTab),
        createTab(faList, "ObjectCardTab", ObjectCardTab, false),
    ];

    // do not umount component when it's hidden
    // it contains shortcuts that shouldn't be unmounted when switching tabs / closing sidebar
    return (
        <>
            <div className={`sidebar ${sidebarVisible ? "active" : ""}`}>
                <div className="sidebar-tabs">
                    <div className="sidebar-tabs-left-buttons-group">
                        {tabs.map(
                            ({ title, icon, hasTabButton }, index) =>
                                hasTabButton && (
                                    <RenderSidebarTabsButton
                                        key={index}
                                        className={`sidebar-tab ${index === activeTab ? "active" : ""}`}
                                        title={title}
                                        icon={icon}
                                        onClick={() => setActiveTab(index)}
                                    />
                                ),
                        )}
                    </div>
                </div>

                {tabs.map(({ component }, index) => (
                    <div
                        key={index}
                        className={`sidebar-tab-panel-containter ${
                            index === activeTab ? "active" : ""
                        }`}
                    >
                        {component}
                    </div>
                ))}
            </div>

            <RenderSidebarTabsButton
                className="sidebar-toggle-button"
                title={t(`${COMPONENT_NAME}togglePanel`)}
                icon={sidebarVisible ? faCaretRight : faCaretLeft}
                action="toggleSidebar"
            />
        </>
    );
});
