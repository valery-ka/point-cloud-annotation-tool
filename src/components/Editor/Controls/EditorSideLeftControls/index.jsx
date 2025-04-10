import React, { memo } from "react";
import {
    faHandPointer,
    faPaintBrush,
    faDrawPolygon,
    faBezierCurve,
    faVectorSquare,
    faSignOutAlt,
} from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";

import { MODES } from "@tools";
import { useEditor, useTools } from "@contexts";
import * as APP_CONSTANTS from "@constants";

import { RenderEditorButton } from "../RenderEditorButton";

// const COMPONENT_NAME = "EditorSideLeftControls.";
const COMPONENT_NAME = "";
const { DEFAULT_TOOL } = APP_CONSTANTS;

export const EditorSideLeftControls = memo(() => {
    const { selectedClassIndex, hasFilterSelectionPoint } = useEditor();
    const { selectedTool, selectionMode, setSelectedTool } = useTools();
    const { t } = useTranslation();

    const paintModes = Object.keys(MODES).filter((mode) => MODES[mode].type === "paint");
    const filterModes = Object.keys(MODES).filter((mode) => MODES[mode].type === "filter");

    const handleSelectTool = (tool) => {
        setSelectedTool(tool);
    };

    const renderToolButton = (tool, icon, iconPosition = "") => {
        return (
            <RenderEditorButton
                className={`tool-3d-control-button ${iconPosition} ${
                    selectedTool === tool ? "selected" : ""
                } `}
                title={t(`${COMPONENT_NAME}${tool}`)}
                actionType={"tools"}
                action={tool}
                icon={icon}
                onClick={() => handleSelectTool(tool)}
            />
        );
    };

    const renderModesGroup = (modes) => {
        return (
            <div className="tool-3d-controls-group--vertical">
                {modes.map((mode) => {
                    const { title, icon, iconPosition, hotkey } = MODES[mode];
                    return (
                        <RenderEditorButton
                            key={mode}
                            className={`tool-3d-control-button ${iconPosition} ${
                                selectionMode === mode ? "selected" : ""
                            }`}
                            title={t(`${COMPONENT_NAME}${title}`)}
                            actionType={"modes"}
                            action={mode}
                            icon={icon}
                            hotkey={hotkey}
                        />
                    );
                })}
            </div>
        );
    };

    return (
        <div className="controls-side-left">
            <RenderEditorButton
                className={`tool-3d-control-button single ${
                    selectedTool === DEFAULT_TOOL ? "selected" : ""
                }`}
                title={t(`${COMPONENT_NAME}${DEFAULT_TOOL}`)}
                actionType={"tools"}
                action={DEFAULT_TOOL}
                icon={faHandPointer}
                onClick={() => handleSelectTool(DEFAULT_TOOL)}
            />
            <div className="tool-3d-controls-group--horizontal">
                <div className="tool-3d-controls-group--vertical">
                    {selectedClassIndex !== null && (
                        <>
                            {renderToolButton("brushTool", faPaintBrush, "top")}
                            {renderToolButton("polygonTool", faDrawPolygon)}
                            {renderToolButton("lassoTool", faBezierCurve)}
                            {renderToolButton("rectangleTool", faVectorSquare, "bottom")}
                        </>
                    )}
                </div>
                {selectedTool !== DEFAULT_TOOL && (
                    <div className="tool-3d-controls-group">
                        <div className="tool-3d-controls-group--vertical">
                            {renderModesGroup(paintModes)}
                        </div>
                        <div className="tool-3d-controls-group--vertical">
                            {renderModesGroup(filterModes)}
                        </div>
                    </div>
                )}
            </div>
            {hasFilterSelectionPoint && (
                <RenderEditorButton
                    className="tool-3d-control-button single"
                    title={t(`${COMPONENT_NAME}showFilteredPoints`)}
                    actionType={"misc"}
                    action="showFilteredPoints"
                    icon={faSignOutAlt}
                />
            )}
        </div>
    );
});
