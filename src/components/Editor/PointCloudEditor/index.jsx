import React from "react";
import * as HOOKS from "hooks";

import { ModerationComments } from "./ModerationComments";
import { CuboidsLabels } from "./CuboidsLabels";

export const PointCloudEditor = () => {
    const { THEME_COLORS } = HOOKS.useEditorTheme();

    const updateGlobalBox = HOOKS.useEditorHelpers();

    HOOKS.usePointCloudLoader(THEME_COLORS);

    const glSize = HOOKS.useCanvasResize(() => requestPixelProjectionsUpdate());

    const requestPixelProjectionsUpdate = HOOKS.useUpdatePixelProjections(glSize);

    HOOKS.useCameraControls(requestPixelProjectionsUpdate);

    HOOKS.useHighlightedPoint();

    const requestSaveFrame = HOOKS.useSaveOutput(() => updateUndoRedoState());

    const { filterFramePoints, filterSelectedPoints } =
        HOOKS.useFramePointsVisibility(updateGlobalBox);

    const { handlePointsSize, handleSelectedPointsSize } = HOOKS.useFramePointsSize();

    const { handlePointCloudColors, paintSelectedPoints, handleCuboidPointsColor } =
        HOOKS.usePaintFramePoints(updateGlobalBox);

    const selectorTools = HOOKS.useSelectorTools(
        paintSelectedPoints,
        filterSelectedPoints,
        handleSelectedPointsSize,
        requestSaveFrame,
    );

    HOOKS.useToolsMouseEvents(selectorTools);

    HOOKS.useEditorFrameSwitcher(() => {
        filterFramePoints();
        handlePointCloudColors();
        handlePointsSize();
    });

    const updateUndoRedoState = HOOKS.useUndoRedo(requestSaveFrame, () => {
        filterFramePoints();
        handlePointCloudColors();
        handlePointsSize();
    });

    HOOKS.useStats();

    HOOKS.useCuboidManager({
        handlePointCloudColors,
        handlePointsSize,
        filterFramePoints,
        handleCuboidPointsColor,
    });

    return (
        <>
            <ModerationComments />
            <CuboidsLabels />
        </>
    );
};
