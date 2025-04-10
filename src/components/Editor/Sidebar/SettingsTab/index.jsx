import React, { memo } from "react";
import { useTranslation } from "react-i18next";

import { useConfig } from "@contexts";

import { Spoiler } from "./Spoiler";
import { SettingsSlider } from "./Slider";
import { RadioButtonGroup } from "./RadioButtonGroup";

// const COMPONENT_NAME = "SettingsTab.";
const COMPONENT_NAME = "";

export const SettingsTab = memo(({ title }) => {
    const { nonHiddenClasses } = useConfig();

    const { t } = useTranslation();

    return (
        <div className="sidebar-tab-panel">
            <div className="tab-header-container">
                <h2 className="tab-header">{title}</h2>
            </div>
            <div className="sidebar-content">
                <Spoiler title={t(`${COMPONENT_NAME}general`)} defaultIsOpen={true}>
                    <RadioButtonGroup
                        title="Language / Язык"
                        settingType={"general"}
                        options={["en", "ru"]}
                        alias={["English", "Русский"]}
                        name="language"
                    />
                    <RadioButtonGroup
                        title={t(`${COMPONENT_NAME}theme`)}
                        settingType={"general"}
                        options={["light", "dark"]}
                        alias={[t(`${COMPONENT_NAME}light`), t(`${COMPONENT_NAME}dark`)]}
                        name="theme"
                    />
                </Spoiler>
                <Spoiler title={t(`${COMPONENT_NAME}navigation`)} defaultIsOpen={false}>
                    <SettingsSlider
                        title={t(`${COMPONENT_NAME}zoomSpeed`)}
                        action={"navigationChange"}
                        setting={"editorSettings"}
                        settingType={"navigation"}
                        settingKey={"zoomSpeed"}
                        min={3}
                        max={15}
                        step={0.5}
                        decimals={1}
                    />
                    <SettingsSlider
                        title={t(`${COMPONENT_NAME}keyPanSpeed`)}
                        action={"navigationChange"}
                        setting={"editorSettings"}
                        settingType={"navigation"}
                        settingKey={"keyPanSpeed"}
                        min={0}
                        max={50}
                        step={1}
                        decimals={1}
                    />
                </Spoiler>
                <Spoiler title={t(`${COMPONENT_NAME}pointSize`)} defaultIsOpen={false}>
                    <SettingsSlider
                        title={t(`${COMPONENT_NAME}generalPointSize`)}
                        action={"pointSize"}
                        setting={"editorSettings"}
                        settingType={"sizes"}
                        settingKey={"generalPointSize"}
                        min={1}
                        max={5}
                        step={0.1}
                        decimals={1}
                    />
                    <SettingsSlider
                        title={t(`${COMPONENT_NAME}highlightedPointSize`)}
                        action={"pointSize"}
                        setting={"editorSettings"}
                        settingType={"sizes"}
                        settingKey={"highlightedPointSize"}
                        min={1}
                        max={5}
                        step={0.1}
                        decimals={1}
                    />
                    <SettingsSlider
                        title={t(`${COMPONENT_NAME}selectedClassSize`)}
                        action={"pointSize"}
                        setting={"editorSettings"}
                        settingType={"sizes"}
                        settingKey={"selectedClassSize"}
                        min={0}
                        max={5}
                        step={0.1}
                        decimals={1}
                    />
                    {nonHiddenClasses.map((cls) => {
                        return (
                            <SettingsSlider
                                key={cls.label}
                                title={`${cls.label} ${t(`${COMPONENT_NAME}sizeIncrement`)}`}
                                action={"pointSize"}
                                setting={"editorSettings"}
                                settingType={"sizes"}
                                settingKey={`${
                                    cls.label[0].toLowerCase() + cls.label.slice(1)
                                }PointSize`}
                                min={0}
                                max={5}
                                step={0.1}
                                decimals={1}
                            />
                        );
                    })}
                </Spoiler>
                <Spoiler title={t(`${COMPONENT_NAME}pointColor`)} defaultIsOpen={false}>
                    <SettingsSlider
                        title={t(`${COMPONENT_NAME}pointBrightness`)}
                        action={"pointColor"}
                        setting={"editorSettings"}
                        settingType={"colors"}
                        settingKey={"pointBrightness"}
                        min={0}
                        max={1}
                        step={0.01}
                        decimals={2}
                    />
                    <SettingsSlider
                        title={t(`${COMPONENT_NAME}pointIntensity`)}
                        action={"pointColor"}
                        setting={"editorSettings"}
                        settingType={"colors"}
                        settingKey={"pointIntensity"}
                        min={0}
                        max={1}
                        step={0.01}
                        decimals={2}
                    />
                </Spoiler>
                <Spoiler title={t(`${COMPONENT_NAME}editorSettings`)} defaultIsOpen={false}>
                    <SettingsSlider
                        title={t(`${COMPONENT_NAME}paintDepth`)}
                        action={"paintDepth"}
                        setting={"editorSettings"}
                        settingType={"editor"}
                        settingKey={"paintDepth"}
                        min={0}
                        max={5}
                        step={0.01}
                        decimals={2}
                    />
                </Spoiler>
            </div>
        </div>
    );
});
