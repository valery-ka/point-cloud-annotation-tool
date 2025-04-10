import { useEffect, useRef, useCallback } from "react";

import { usePCDManager, useSettings, useEditor, useFrames, useConfig } from "@contexts";
import { useSubscribeFunction } from "@hooks";

import { hexToRgb, changeClassOfSelection, updatePointCloudColors } from "@utils/editor";

export const usePaintFramePoints = (updateGlobalBox) => {
    const classColorsCache = useRef({});
    const selectedClassColor = useRef(null);

    const { settings } = useSettings();
    const pointColorRef = useRef(settings.editorSettings.colors);

    const { pcdFiles } = usePCDManager();
    const { nonHiddenClasses } = useConfig();
    const { activeFrameIndex, areFramesLoading } = useFrames();
    const {
        pointCloudRefs,
        activeFramePositionsRef,
        selectedClassIndex,
        pointLabelsRef,
        originalPositionsRef,
        classesVisibilityRef,
        minMaxZRef,
    } = useEditor();

    useEffect(() => {
        if (selectedClassIndex == null) return;

        const originalIndex = nonHiddenClasses[selectedClassIndex].originalIndex;
        selectedClassColor.current = classColorsCache.current[originalIndex];
    }, [selectedClassIndex]);

    useEffect(() => {
        if (!pcdFiles.length || areFramesLoading) return;

        const newColorMap = nonHiddenClasses.reduce((map, cls) => {
            const hex = cls.color;
            const idx = cls.originalIndex;
            const rgb = hexToRgb(hex);

            map[idx] = rgb;
            return map;
        }, {});
        classColorsCache.current = newColorMap;
    }, [areFramesLoading, nonHiddenClasses, pcdFiles]);

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
                mode,
                points,
                frameData: {
                    ref: activeFrameRef,
                    colors: activeFrameColors,
                    labels: activeFrameLabels,
                    intensity: activeFrameIntensity,
                    positions: activeFramePositionsRef,
                    originalPositions: originalPositionsRef,
                },
                colorData: {
                    pointColor: pointColorRef.current,
                    classColor: selectedClassColor.current,
                    classIndex: originalClassIndex,
                },
                visibilityData: {
                    classVisible,
                    minMaxZ: minMaxZRef.current,
                },
                updateBox: updateGlobalBox,
            });
        },
        [pcdFiles, activeFrameIndex, selectedClassIndex],
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
                updatePointCloudColors(
                    activeFrameLabels,
                    activeFrameRef,
                    classColorsCache,
                    activeFrameIntensity,
                    pointColorRef.current,
                );
            }
        },
        [pcdFiles, activeFrameIndex, pointCloudRefs],
    );

    useSubscribeFunction("pointColor", handlePointCloudColors, [
        pcdFiles,
        activeFrameIndex,
        pointCloudRefs,
    ]);

    return { handlePointCloudColors, paintSelectedPoints };
};
