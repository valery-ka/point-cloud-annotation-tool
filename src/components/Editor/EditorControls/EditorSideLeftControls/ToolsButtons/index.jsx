import { memo } from "react";
import {
    faPaintBrush,
    faDrawPolygon,
    faBezierCurve,
    faVectorSquare,
} from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";

import { MODES } from "tools";
import { useTools } from "contexts";
import * as APP_CONSTANTS from "constants";

import { RenderEditorButton } from "../../RenderEditorButton";

// const COMPONENT_NAME = "ToolsButtons.";
const COMPONENT_NAME = "";
const { DEFAULT_TOOL } = APP_CONSTANTS;

export const ToolsButtons = memo(() => {
    const { t } = useTranslation();

    const { selectedTool, selectionMode, setSelectedTool } = useTools();

    const paintModes = Object.keys(MODES).filter((mode) => MODES[mode].type === "paint");
    const filterModes = Object.keys(MODES).filter((mode) => MODES[mode].type === "filter");

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
                onClick={() => setSelectedTool(tool)}
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
        <div className="tool-3d-controls-group--horizontal">
            <div className="tool-3d-controls-group--vertical">
                {renderToolButton("brushTool", faPaintBrush, "top")}
                {renderToolButton("polygonTool", faDrawPolygon)}
                {renderToolButton("lassoTool", faBezierCurve)}
                {renderToolButton("rectangleTool", faVectorSquare, "bottom")}
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
    );
});
