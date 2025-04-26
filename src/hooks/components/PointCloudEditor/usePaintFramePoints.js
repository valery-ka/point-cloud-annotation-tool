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
    const {
        pointCloudRefs,
        activeFramePositionsRef,
        selectedClassIndex,
        pointLabelsRef,
        classesVisibilityRef,
        minMaxZRef,
    } = useEditor();

    const { selectedCamera, imagePointsColorNeedsUpdateRef, imagePointsAlphaNeedsUpdateRef } =
        useImages();

    useEffect(() => {
        if (selectedClassIndex === null) return;

        const originalIndex = nonHiddenClasses[selectedClassIndex]?.originalIndex;
        selectedClassColor.current = classColorsCache.current[originalIndex];
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
            const activeFrameRef = pointCloudRefs.current[activeFrameFilePath];

            const activeFrameColors = activeFrameRef?.geometry?.attributes?.color?.array;

            if (!activeFrameColors || !selectedClassColor.current) return;

            const activeFrameLabels = pointLabelsRef.current[activeFrameFilePath];
            const originalClassIndex = nonHiddenClasses[selectedClassIndex].originalIndex;
            const classVisible = classesVisibilityRef.current[originalClassIndex].visible;
            const activeFrameIntensity = activeFrameRef?.geometry?.attributes?.intensity?.array;

            changeClassOfSelection({
                selectionData: {
                    selectionMode: mode,
                    selectedPoints: points,
                },
                cloudData: {
                    cloud: activeFrameRef,
                    colors: activeFrameColors,
                    labels: activeFrameLabels,
                    intensity: activeFrameIntensity,
                    positions: activeFramePositionsRef.current,
                },
                colorData: {
                    pointColor: pointColorRef.current,
                    selectedClassColor: selectedClassColor.current,
                    originalClassIndex: originalClassIndex,
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
            const activeFrameRef = pointCloudRefs.current[activeFrameFilePath];
            const activeFrameLabels = pointLabelsRef.current[activeFrameFilePath];

            const activeFrameIntensity = activeFrameRef?.geometry?.attributes?.intensity?.array;

            if (activeFrameRef?.geometry?.attributes?.color) {
                updatePointCloudColors({
                    cloudData: {
                        cloud: activeFrameRef,
                        labels: activeFrameLabels,
                        intensity: activeFrameIntensity,
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

    useSubscribeFunction("pointColor", handlePointCloudColors, [pcdFiles, activeFrameIndex]);

    useEffect(() => {
        handlePointCloudColors();
    }, [selectedCamera]);

    return { handlePointCloudColors, paintSelectedPoints };
};
