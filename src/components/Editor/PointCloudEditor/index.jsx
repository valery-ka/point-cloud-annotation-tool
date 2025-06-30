import { memo } from "react";

import * as HOOKS from "hooks";

import { PointsHtml } from "./DreiHtml/PointsHtml";
import { CuboidsHtml } from "./DreiHtml/CuboidsHtml";

export const PointCloudEditor = memo(() => {
    const { THEME_COLORS } = HOOKS.useEditorTheme();

    const updateGlobalBox = HOOKS.useEditorHelpers();

    HOOKS.usePointCloudLoader(THEME_COLORS);

    const glSize = HOOKS.useCanvasResize(() => requestPixelProjectionsUpdate());

    const requestPixelProjectionsUpdate = HOOKS.useUpdatePixelProjections(glSize);

    HOOKS.useCameraControls(requestPixelProjectionsUpdate);

    HOOKS.useHighlightedPoint();

    const { requestSaveLabels } = HOOKS.useSaveOutput(() => updateUndoRedoState());

    const { filterFramePoints, filterSelectedPoints } =
        HOOKS.useFramePointsVisibility(updateGlobalBox);

    const { handlePointsSize, handleSelectedPointsSize } = HOOKS.useFramePointsSize();

    const { handlePointCloudColors, paintSelectedPoints } =
        HOOKS.usePaintFramePoints(updateGlobalBox);

    const selectorTools = HOOKS.useSelectorTools(
        paintSelectedPoints,
        filterSelectedPoints,
        handleSelectedPointsSize,
        requestSaveLabels,
    );

    HOOKS.useToolsMouseEvents(selectorTools);

    HOOKS.useEditorFrameSwitcher(() => {
        filterFramePoints();
        handlePointCloudColors();
        handlePointsSize();
    });

    const { updateUndoRedoState } = HOOKS.useUndoRedo(requestSaveLabels, () => {
        filterFramePoints();
        handlePointCloudColors();
        handlePointsSize();
    });

    HOOKS.useStats();

    HOOKS.useCuboidManager({
        handlePointCloudColors,
        handlePointsSize,
        filterFramePoints,
    });

    return (
        <>
            <PointsHtml />
            <CuboidsHtml />
        </>
    );
});
