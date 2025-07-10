import { memo } from "react";
import { faHandPointer, faSignOutAlt, faSatellite } from "@fortawesome/free-solid-svg-icons";

import { useTranslation } from "react-i18next";
import { useEditor, useCuboids, useTools } from "contexts";

import { ToolsButtons } from "./ToolsButtons";
import { TransformControlsButtons } from "./TransformControlsButtons";
import { RenderEditorButton } from "../RenderEditorButton";

import * as APP_CONSTANTS from "constants";

// const COMPONENT_NAME = "EditorSideLeftControls.";
const COMPONENT_NAME = "";
const { DEFAULT_TOOL } = APP_CONSTANTS;

export const EditorSideLeftControls = memo(() => {
    const { t } = useTranslation();

    const { selectedClassIndex, hasFilterSelectionPoint } = useEditor();
    const { selectedTool, setSelectedTool, savedPolygonState } = useTools();
    const { selectedCuboid } = useCuboids();

    return (
        <div className="controls-side-left">
            <div className="tool-3d-controls-group--horizontal">
                <RenderEditorButton
                    className={`tool-3d-control-button single ${
                        selectedTool === DEFAULT_TOOL ? "selected" : ""
                    }`}
                    title={t(`${COMPONENT_NAME}${DEFAULT_TOOL}`)}
                    actionType={"tools"}
                    action={DEFAULT_TOOL}
                    icon={faHandPointer}
                    onClick={() => setSelectedTool(DEFAULT_TOOL)}
                />
                <RenderEditorButton
                    className={`tool-3d-control-button single ${
                        savedPolygonState && typeof selectedClassIndex === "number"
                            ? ""
                            : "disabled"
                    }`}
                    title={t(`${COMPONENT_NAME}propagateLastPolygon`)}
                    actionType={"tools"}
                    action="propagateLastPolygon"
                    icon={faSatellite}
                />
            </div>

            {selectedClassIndex !== null && <ToolsButtons />}
            {selectedCuboid && <TransformControlsButtons />}

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
