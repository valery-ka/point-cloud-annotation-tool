import { useEffect, useRef, useCallback } from "react";

import {
    useEditor,
    useFileManager,
    useSettings,
    useFrames,
    useConfig,
    useHoveredPoint,
    useImages,
} from "contexts";
import { useSubscribeFunction } from "hooks";

import {
    updatePointsSize,
    updateSelectedPointsSize,
    updateHighlightedPointSize,
} from "utils/editor";

export const useFramePointsSize = () => {
    const { pcdFiles } = useFileManager();
    const { nonHiddenClasses } = useConfig();
    const { activeFrameIndex } = useFrames();
    const { highlightedPoint } = useHoveredPoint();
    const { settings } = useSettings();
    const { selectedClassIndex, pointCloudRefs, pointLabelsRef } = useEditor();
    const { imagePointsSizeNeedsUpdateRef } = useImages();

    const highlightedIndex = useRef(null);
    const prevHighlightedIndex = useRef(null);
    const pointSizeRef = useRef([]);
    const selectedClassRef = useRef(null);

    const handlePointsSize = useCallback(
        (data, points) => {
            if (data) {
                const { value, settingKey } = data;
                pointSizeRef.current[settingKey].value = value;
            }

            const activeFrameFilePath = pcdFiles[activeFrameIndex];

            const activeFrameCloud = pointCloudRefs.current[activeFrameFilePath];
            const activeFrameLabels = pointLabelsRef.current[activeFrameFilePath];

            if (activeFrameCloud?.geometry?.attributes?.size) {
                const cloudData = {
                    cloud: activeFrameCloud,
                    labels: activeFrameLabels,
                };
                const sizesData = {
                    pointSizes: pointSizeRef.current,
                    selectedClass: selectedClassRef.current,
                };

                points
                    ? updateSelectedPointsSize({
                          cloudData,
                          sizesData,
                          selectionData: { selectedPoints: points },
                      })
                    : updatePointsSize({
                          cloudData,
                          sizesData,
                      });

                updateHighlightedPointSize({
                    cloudData,
                    sizesData,
                    highlightedPoint: {
                        current: highlightedIndex.current,
                        previous: prevHighlightedIndex.current,
                    },
                });

                imagePointsSizeNeedsUpdateRef.current = true;
            }
        },
        [pcdFiles, activeFrameIndex],
    );

    const handleSelectedPointsSize = useCallback(
        (points) => handlePointsSize(null, points),
        [handlePointsSize],
    );

    useSubscribeFunction("pointSize", handlePointsSize, []);

    useEffect(() => {
        const originalClassIndex = nonHiddenClasses[selectedClassIndex]?.originalIndex;
        selectedClassRef.current = originalClassIndex;
        handlePointsSize(null, null);
    }, [nonHiddenClasses, selectedClassIndex]);

    useEffect(() => {
        const activeFrameFilePath = pcdFiles[activeFrameIndex];

        const activeFrameCloud = pointCloudRefs.current[activeFrameFilePath];
        const activeFrameLabels = pointLabelsRef.current[activeFrameFilePath];

        highlightedIndex.current = highlightedPoint?.index;

        if (activeFrameCloud?.geometry?.attributes?.size) {
            updateHighlightedPointSize({
                cloudData: {
                    cloud: activeFrameCloud,
                    labels: activeFrameLabels,
                },
                highlightedPoint: {
                    current: highlightedIndex.current,
                    previous: prevHighlightedIndex.current,
                },
                sizesData: {
                    selectedClass: selectedClassRef.current,
                    pointSizes: pointSizeRef.current,
                },
            });

            prevHighlightedIndex.current = highlightedPoint?.index;
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
    }, [settings.editorSettings.sizes, nonHiddenClasses]);

    return { handlePointsSize, handleSelectedPointsSize };
};
