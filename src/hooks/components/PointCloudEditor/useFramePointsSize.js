import { useEffect, useRef, useCallback } from "react";

import {
    useEditor,
    usePCDManager,
    useSettings,
    useFrames,
    useConfig,
    useHoveredPoint,
} from "contexts";
import { useSubscribeFunction } from "hooks";

import {
    updatePointsSize,
    updateSelectedPointsSize,
    updateHighlightedPointSize,
} from "utils/editor";

export const useFramePointsSize = () => {
    const { pcdFiles } = usePCDManager();
    const { nonHiddenClasses } = useConfig();
    const { activeFrameIndex } = useFrames();
    const { highlightedPoint } = useHoveredPoint();
    const { settings } = useSettings();
    const { selectedClassIndex, pointCloudRefs, pointLabelsRef } = useEditor();

    const highlightedIndex = useRef(null);
    const prevIndex = useRef(null);
    const pointSizeRef = useRef([]);
    const selectedClassRef = useRef(null);

    const handlePointsSize = useCallback(
        (data, points) => {
            if (data) {
                const { value, settingKey } = data;
                pointSizeRef.current[settingKey].value = value;
            }

            const activeFrameFilePath = pcdFiles[activeFrameIndex];
            const activeFrameRef = pointCloudRefs.current[activeFrameFilePath];
            const activeFrameLabels = pointLabelsRef.current[activeFrameFilePath];

            if (activeFrameRef?.geometry?.attributes?.size) {
                if (points) {
                    updateSelectedPointsSize(
                        activeFrameRef,
                        activeFrameLabels,
                        pointSizeRef.current,
                        selectedClassRef.current,
                        points,
                    );
                } else {
                    updatePointsSize(
                        activeFrameRef,
                        activeFrameLabels,
                        pointSizeRef.current,
                        selectedClassRef.current,
                    );
                }

                updateHighlightedPointSize(
                    activeFrameRef,
                    activeFrameLabels,
                    pointSizeRef.current,
                    highlightedIndex.current,
                    prevIndex.current,
                    selectedClassRef.current,
                );
            }
        },
        [pcdFiles, activeFrameIndex],
    );

    const handleSelectedPointsSize = useCallback(
        (points) => handlePointsSize(null, points),
        [handlePointsSize],
    );

    useSubscribeFunction("pointSize", handlePointsSize, [activeFrameIndex, pcdFiles]);

    useEffect(() => {
        const selectedClass = nonHiddenClasses[selectedClassIndex]?.originalIndex;
        selectedClassRef.current = selectedClass;
        handlePointsSize(null, null);
    }, [nonHiddenClasses, selectedClassIndex]);

    useEffect(() => {
        const activeFrameFilePath = pcdFiles[activeFrameIndex];
        const activeFrameRef = pointCloudRefs.current[activeFrameFilePath];
        const activeFrameLabels = pointLabelsRef.current[activeFrameFilePath];

        highlightedIndex.current = highlightedPoint?.index;

        if (activeFrameRef?.geometry?.attributes?.size) {
            updateHighlightedPointSize(
                activeFrameRef,
                activeFrameLabels,
                pointSizeRef.current,
                highlightedIndex.current,
                prevIndex.current,
                selectedClassRef.current,
            );

            prevIndex.current = highlightedPoint?.index;
        }
    }, [highlightedPoint]);

    useEffect(() => {
        const sizes = settings.editorSettings.sizes;

        pointSizeRef.current = Object.keys(sizes).reduce((acc, key) => {
            const classData = nonHiddenClasses.find((cls) =>
                key.toLowerCase().includes(cls.label.toLowerCase()),
            );

            acc[key] = {
                originalIndex: classData ? classData.originalIndex : 0,
                value: sizes[key],
            };
            return acc;
        }, {});
    }, [settings.editorSettings.sizes]);

    return { handlePointsSize, handleSelectedPointsSize };
};
