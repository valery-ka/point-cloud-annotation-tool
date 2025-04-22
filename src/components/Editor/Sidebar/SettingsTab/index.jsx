import React, { memo } from "react";
import { useTranslation } from "react-i18next";

import { useConfig } from "contexts";

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
                        setting={"general"}
                        settingType={"language"}
                        options={["en", "ru"]}
                        alias={["English", "Русский"]}
                    />
                    <RadioButtonGroup
                        title={t(`${COMPONENT_NAME}theme`)}
                        setting={"general"}
                        settingType={"theme"}
                        options={["light", "dark"]}
                        alias={[t(`${COMPONENT_NAME}light`), t(`${COMPONENT_NAME}dark`)]}
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
                <Spoiler title={t(`${COMPONENT_NAME}cameraProjections`)} defaultIsOpen={false}>
                    <RadioButtonGroup
                        title={t(`${COMPONENT_NAME}visibleVOID`)}
                        action={"visibleVOID"}
                        setting={"editorSettings"}
                        settingType={"images"}
                        settingKey={"visibleVOID"}
                        options={[true, false]}
                        alias={[t(`${COMPONENT_NAME}showVOID`), t(`${COMPONENT_NAME}hideVOID`)]}
                        name="project"
                    />
                    <SettingsSlider
                        title={t(`${COMPONENT_NAME}generalPointSize`)}
                        action={"imagesPointSize"}
                        setting={"editorSettings"}
                        settingType={"images"}
                        settingKey={"imagesPointSize"}
                        min={1}
                        max={5}
                        step={0.1}
                        decimals={1}
                    />
                    <SettingsSlider
                        title={t(`${COMPONENT_NAME}highlightedPointSize`)}
                        action={"highlightedPointSizeImage"}
                        setting={"editorSettings"}
                        settingType={"images"}
                        settingKey={"highlightedPointSize"}
                        min={1}
                        max={5}
                        step={0.1}
                        decimals={1}
                    />
                </Spoiler>
                <Spoiler title={t(`${COMPONENT_NAME}pointHighlighter`)} defaultIsOpen={false}>
                    <RadioButtonGroup
                        title={t(`${COMPONENT_NAME}isEnabled`)}
                        action={"enabled"}
                        setting={"editorSettings"}
                        settingType={"highlighter"}
                        settingKey={"enabled"}
                        options={[true, false]}
                        alias={[t(`${COMPONENT_NAME}enabled`), t(`${COMPONENT_NAME}disabled`)]}
                        name="project"
                    />
                    <SettingsSlider
                        title={t(`${COMPONENT_NAME}highlighterSize`)}
                        action={"highlighterSize"}
                        setting={"editorSettings"}
                        settingType={"highlighter"}
                        settingKey={"highlighterSize"}
                        min={150}
                        max={300}
                        step={10}
                        decimals={0}
                    />
                    <SettingsSlider
                        title={t(`${COMPONENT_NAME}highlighterZoom`)}
                        action={"highlighterZoom"}
                        setting={"editorSettings"}
                        settingType={"highlighter"}
                        settingKey={"highlighterZoom"}
                        min={0.5}
                        max={5}
                        step={0.1}
                        decimals={1}
                    />
                    <SettingsSlider
                        title={t(`${COMPONENT_NAME}generalPointSize`)}
                        action={"pointSizeHighlighter"}
                        setting={"editorSettings"}
                        settingType={"highlighter"}
                        settingKey={"generalPointSize"}
                        min={0.1}
                        max={2}
                        step={0.1}
                        decimals={2}
                    />
                    <SettingsSlider
                        title={t(`${COMPONENT_NAME}highlightedPointSize`)}
                        action={"highlightedPointSizeHighlighter"}
                        setting={"editorSettings"}
                        settingType={"highlighter"}
                        settingKey={"highlightedPointSize"}
                        min={1}
                        max={10}
                        step={0.1}
                        decimals={1}
                    />
                    <SettingsSlider
                        title={t(`${COMPONENT_NAME}searchingRadius`)}
                        action={"searchingRadius"}
                        setting={"editorSettings"}
                        settingType={"highlighter"}
                        settingKey={"searchingRadius"}
                        min={0.1}
                        max={5}
                        step={0.1}
                        decimals={1}
                    />
                </Spoiler>
            </div>
        </div>
    );
});
