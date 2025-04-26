import { useEffect, useRef, useCallback } from "react";

import { useFileManager, useSettings, useEditor, useFrames, useConfig, useImages } from "contexts";
import { useSubscribeFunction } from "hooks";

import { hexToRgb, changeClassOfSelection, updatePointCloudColors } from "utils/editor";

export const usePaintFramePoints = (updateGlobalBox) => {
    const classColorsCache = useRef({});
    const selectedClassColor = useRef(null);

    const { settings } = useSettings();
    const pointColorRef = useRef(settings.editorSettings.colors);

    const { pcdFiles } = useFileManager();
    const { nonHiddenClasses } = useConfig();
    const { activeFrameIndex, arePointCloudsLoading } = useFrames();
    const { pointCloudRefs, selectedClassIndex, pointLabelsRef, classesVisibilityRef, minMaxZRef } =
        useEditor();

    const { imagePointsColorNeedsUpdateRef, imagePointsAlphaNeedsUpdateRef } = useImages();

    useEffect(() => {
        if (selectedClassIndex === null) return;
        const originalClassIndex = nonHiddenClasses[selectedClassIndex]?.originalIndex;
        selectedClassColor.current = classColorsCache.current[originalClassIndex];
    }, [selectedClassIndex, nonHiddenClasses]);

    useEffect(() => {
        if (!pcdFiles.length || arePointCloudsLoading) return;

        const newColorMap = nonHiddenClasses.reduce((map, cls) => {
            const hex = cls.color;
            const idx = cls.originalIndex;
            const rgb = hexToRgb(hex);

            map[idx] = rgb;
            return map;
        }, {});
        classColorsCache.current = newColorMap;
    }, [arePointCloudsLoading, nonHiddenClasses, pcdFiles]);

    const paintSelectedPoints = useCallback(
        (mode, points) => {
            const activeFrameFilePath = pcdFiles[activeFrameIndex];

            const activeFrameCloud = pointCloudRefs.current[activeFrameFilePath];
            const activeFrameLabels = pointLabelsRef.current[activeFrameFilePath];

            if (!activeFrameCloud?.geometry.attributes.color.array || !selectedClassColor.current)
                return;

            const originalClassIndex = nonHiddenClasses[selectedClassIndex].originalIndex;
            const classVisible = classesVisibilityRef.current[originalClassIndex].visible;

            changeClassOfSelection({
                cloudData: {
                    cloud: activeFrameCloud,
                    labels: activeFrameLabels,
                },
                colorData: {
                    pointColor: pointColorRef.current,
                    selectedClassColor: selectedClassColor.current,
                    originalClassIndex: originalClassIndex,
                },
                selectionData: {
                    selectionMode: mode,
                    selectedPoints: points,
                },
                visibilityData: {
                    classVisible,
                    minMaxZ: minMaxZRef.current,
                },
                callbacks: {
                    updateGlobalBox: updateGlobalBox,
                },
            });

            imagePointsColorNeedsUpdateRef.current = true;
            imagePointsAlphaNeedsUpdateRef.current = true;
        },
        [pcdFiles, activeFrameIndex, selectedClassIndex, nonHiddenClasses],
    );

    const handlePointCloudColors = useCallback(
        (data) => {
            if (data) {
                const { value, settingKey } = data;
                pointColorRef.current[settingKey] = value;
            }
            const activeFrameFilePath = pcdFiles[activeFrameIndex];

            const activeFrameCloud = pointCloudRefs.current[activeFrameFilePath];
            const activeFrameLabels = pointLabelsRef.current[activeFrameFilePath];

            if (activeFrameCloud?.geometry?.attributes?.color) {
                updatePointCloudColors({
                    cloudData: {
                        cloud: activeFrameCloud,
                        labels: activeFrameLabels,
                    },
                    colorData: {
                        classColorsCache,
                        pointColor: pointColorRef.current,
                    },
                });
                imagePointsColorNeedsUpdateRef.current = true;
            }
        },
        [pcdFiles, activeFrameIndex],
    );

    useSubscribeFunction("pointColor", handlePointCloudColors, []);

    return { handlePointCloudColors, paintSelectedPoints };
};
