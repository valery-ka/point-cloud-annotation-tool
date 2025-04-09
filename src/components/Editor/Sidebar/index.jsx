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

import { usePCDManager } from "@contexts";
import { useSubscribeFunction } from "@hooks";

import { RenderSidebarTabsButton } from "./RenderSidebarTabsButton";
import { ObjectsTab } from "./ObjectsTab";
import { SettingsTab } from "./SettingsTab";
import { ModerationTab } from "./ModerationTab";
import { HotkeysTab } from "./HotkeysTab";

// const COMPONENT_NAME = "Sidebar.";
const COMPONENT_NAME = "";

export const Sidebar = memo(() => {
    const { pcdFiles } = usePCDManager();

    const [activeTab, setActiveTab] = useState(0);
    const [sidebarVisible, setSidebarVisible] = useState(true);

    const { t } = useTranslation();

    const toggleSidebar = useCallback(() => {
        setSidebarVisible((prev) => !prev);
    }, []);

    useSubscribeFunction("toggleSidebar", toggleSidebar, []);
    useSubscribeFunction("setActiveTab", (data) => setActiveTab(data), []);

    if (!pcdFiles.length) return null;

    const createTab = (icon, title, Component) => ({
        icon,
        title: t(`${COMPONENT_NAME}${title}`),
        component: <Component title={t(`${COMPONENT_NAME}${title}`)} />,
    });

    const tabs = [
        createTab(faList, "objectsTab", ObjectsTab),
        createTab(faCog, "settingsTab", SettingsTab),
        createTab(faCommentAlt, "moderationTab", ModerationTab),
        createTab(faKeyboard, "hotkeysTab", HotkeysTab),
    ];

    // do not umount component when it's hidden
    // it contains shortcuts that shouldn't be unmounted when switching tabs / closing sidebar
    return (
        <>
            <div className={`sidebar ${sidebarVisible ? "active" : ""}`}>
                <div className="sidebar-tabs">
                    <div className="sidebar-tabs-left-buttons-group">
                        {tabs.map((tab, index) => (
                            <RenderSidebarTabsButton
                                key={index}
                                className={`sidebar-tab ${
                                    index === activeTab ? "active" : ""
                                }`}
                                title={tab.title}
                                icon={tab.icon}
                                onClick={() => setActiveTab(index)}
                            />
                        ))}
                    </div>
                </div>

                {tabs.map((tab, index) => (
                    <div
                        key={index}
                        className={`sidebar-tab-panel-containter ${
                            index === activeTab ? "active" : ""
                        }`}
                    >
                        {tab.component}
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
