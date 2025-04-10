import React, { memo } from "react";
import { faCog } from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";

import { useSettings, useConfig } from "@contexts";

import { HotkeyConfiguratorDialog } from "./HotkeysConfiguratorDialog";
import { SidebarIcon } from "../SidebarIcon";

import { getTranslatedCommand } from "@utils/settings";

// const COMPONENT_NAME = "HotkeysTab.";
const COMPONENT_NAME = "";

export const HotkeysTab = memo(({ title }) => {
    const { t } = useTranslation();

    const { nonHiddenClasses } = useConfig();

    const { settings } = useSettings();
    const { hotkeys } = settings;

    return (
        <>
            <div className="sidebar-tab-panel">
                <div className="tab-header-container">
                    <h2 className="tab-header">{title}</h2>
                    <div className="tab-header-buttons">
                        <SidebarIcon
                            className="icon-style"
                            size="20px"
                            title={t("openConfigurator")}
                            icon={faCog}
                            action={"openHotkeyConfigurator"}
                        />
                    </div>
                </div>
                <div className="sidebar-content">
                    {Object.entries(hotkeys)
                        .filter(([category]) => category !== "fixed")
                        .map(([category, commands]) => (
                            <div key={category} className="hotkey-group">
                                <div className="hotkey-group-title">
                                    {t(`${COMPONENT_NAME}${category}`)}
                                </div>
                                <div className="hotkey-group-keys">
                                    {Object.entries(commands).map(([command, hotkey]) => (
                                        <div key={command} className="hotkey-group-item">
                                            <div className="hotkey-group-key">
                                                {hotkey.split("+").map((part, index) => (
                                                    <div
                                                        key={index}
                                                        className="hotkey-group-button"
                                                    >
                                                        {part === "shift" ? "⇧" : part}
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="hotkey-group-desc">
                                                {getTranslatedCommand(command, nonHiddenClasses, t)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                </div>
            </div>
            <HotkeyConfiguratorDialog />
        </>
    );
});
