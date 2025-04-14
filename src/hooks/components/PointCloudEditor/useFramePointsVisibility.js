import { useEffect, useCallback } from "react";

import { useFileManager, useEditor, useFrames, useConfig } from "contexts";
import { useSubscribeFunction } from "hooks";

import {
    filterPoints,
    updateClassFilter,
    filterPointsBySelection,
    showFilterPointsBySelection,
} from "utils/editor";
import * as APP_CONSTANTS from "constants";

const { SELECTION } = APP_CONSTANTS.HIDDEN_POSITION;

export const useFramePointsVisibility = (updateGlobalBox) => {
    const { pcdFiles } = useFileManager();
    const { nonHiddenClasses } = useConfig();
    const { activeFrameIndex, arePointCloudsLoading } = useFrames();
    const {
        pointCloudRefs,
        classesVisibilityRef,
        pointLabelsRef,
        activeFramePositionsRef,
        originalPositionsRef,
        minMaxZRef,
        setHasFilterSelectionPoint,
    } = useEditor();

    const filterFramePoints = useCallback(() => {
        const activeFrameFilePath = pcdFiles[activeFrameIndex];
        const activeFrameRef = pointCloudRefs.current[activeFrameFilePath];
        const activeFrameLabels = pointLabelsRef.current[activeFrameFilePath];

        if (activeFrameRef && originalPositionsRef.current[activeFrameFilePath]) {
            filterPoints(
                activeFrameRef.geometry,
                activeFramePositionsRef.current,
                originalPositionsRef.current[activeFrameFilePath],
                activeFrameLabels,
                classesVisibilityRef.current,
                minMaxZRef.current[0],
                minMaxZRef.current[1],
            );
            updateGlobalBox();
        }
    }, [pcdFiles, activeFrameIndex]);

    const filterSelectedPoints = useCallback(
        (mode, points) => {
            const activeFrameFilePath = pcdFiles[activeFrameIndex];
            const activeFrameRef = pointCloudRefs.current[activeFrameFilePath];
            const activeFrameLabels = pointLabelsRef.current[activeFrameFilePath];

            if (activeFrameRef && originalPositionsRef.current[activeFrameFilePath]) {
                filterPointsBySelection(
                    activeFrameRef.geometry,
                    activeFramePositionsRef.current,
                    originalPositionsRef.current[activeFrameFilePath],
                    points,
                    mode,
                    minMaxZRef.current[0],
                    minMaxZRef.current[1],
                    false, // isSelection
                    updateGlobalBox,
                    activeFrameLabels,
                    classesVisibilityRef.current,
                    showFilterPointsBySelection,
                );

                const hasFilterSelectionPoint = activeFramePositionsRef.current.some(
                    (coord) => coord === SELECTION,
                );

                setHasFilterSelectionPoint(hasFilterSelectionPoint);
            }
        },
        [pcdFiles, activeFrameIndex],
    );

    const showFilterSelectedPoints = useCallback(() => {
        const activeFrameFilePath = pcdFiles[activeFrameIndex];
        const activeFrameRef = pointCloudRefs.current[activeFrameFilePath];
        const activeFrameLabels = pointLabelsRef.current[activeFrameFilePath];

        if (activeFrameRef && originalPositionsRef.current[activeFrameFilePath]) {
            for (let i = 0; i < activeFramePositionsRef.current.length; i += 3) {
                showFilterPointsBySelection(
                    activeFrameRef.geometry,
                    activeFramePositionsRef.current,
                    originalPositionsRef.current[activeFrameFilePath],
                    activeFrameLabels,
                    classesVisibilityRef.current,
                    minMaxZRef.current[0],
                    minMaxZRef.current[1],
                    i,
                );
            }
            updateGlobalBox();
            setHasFilterSelectionPoint(false);
        }
    }, [pcdFiles, activeFrameIndex]);

    useSubscribeFunction("showFilteredPoints", showFilterSelectedPoints, [
        pcdFiles,
        activeFrameIndex,
    ]);

    useEffect(() => {
        if (arePointCloudsLoading || !pcdFiles.length || !nonHiddenClasses.length) return;

        nonHiddenClasses.forEach(({ originalIndex }) => {
            if (!(originalIndex in classesVisibilityRef.current)) {
                classesVisibilityRef.current[originalIndex] = {
                    hide: false,
                    show: false,
                    visible: true,
                };
            }
        });

        if (!(0 in classesVisibilityRef.current)) {
            classesVisibilityRef.current[0] = {
                hide: false,
                show: false,
                visible: true,
            };
        }
    }, [arePointCloudsLoading, pcdFiles, nonHiddenClasses]);

    const updateMinMaxZ = useCallback(
        (data) => {
            if (data) {
                minMaxZRef.current = data;
            }
            filterFramePoints();
        },
        [pcdFiles, activeFrameIndex],
    );

    useSubscribeFunction("minMaxZ", updateMinMaxZ, [pcdFiles, activeFrameIndex]);

    const updateClassesVisibility = useCallback(
        (data) => {
            if (data) {
                const action = data.action;
                const classIndex = data.index;

                updateClassFilter(action, classIndex, classesVisibilityRef);
            }
            filterFramePoints();
        },
        [pcdFiles, activeFrameIndex],
    );

    useSubscribeFunction("filterClass", updateClassesVisibility, [pcdFiles, activeFrameIndex]);

    return { filterFramePoints, filterSelectedPoints };
};
