import { useEffect, useRef, useCallback } from "react";

import {
    useFileManager,
    useSettings,
    useEditor,
    useFrames,
    useConfig,
    useImages,
    useCalibrations,
} from "contexts";
import { useSubscribeFunction } from "hooks";

import { hexToRgb, changeClassOfSelection, updatePointCloudColors } from "utils/editor";

export const usePaintFramePoints = (updateGlobalBox) => {
    const classColorsCache = useRef({});
    const selectedClassColor = useRef(null);

    const { settings } = useSettings();
    const pointColorRef = useRef(settings.editorSettings.colors);
    const imagesPointRef = useRef(settings.editorSettings.images);

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

    const { loadedImages, selectedImagePath, selectedCamera } = useImages();
    const { projectedPointsRef } = useCalibrations();

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

            const image = loadedImages[selectedImagePath];

            changeClassOfSelection({
                mode,
                points,
                frameData: {
                    ref: activeFrameRef,
                    colors: activeFrameColors,
                    labels: activeFrameLabels,
                    intensity: activeFrameIntensity,
                    positions: activeFramePositionsRef.current,
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
                imageData: {
                    image,
                    projectedPoints: projectedPointsRef.current,
                    visibleVOID: imagesPointRef.current.visibleVOID,
                },
                updateBox: updateGlobalBox,
            });
        },
        [
            pcdFiles,
            activeFrameIndex,
            selectedClassIndex,
            nonHiddenClasses,
            selectedImagePath,
            loadedImages,
        ],
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
            const image = loadedImages[selectedImagePath];

            if (activeFrameRef?.geometry?.attributes?.color) {
                updatePointCloudColors({
                    frameData: {
                        ref: activeFrameRef,
                        labels: activeFrameLabels,
                        intensity: activeFrameIntensity,
                    },
                    colorData: {
                        classColorsCache,
                        pointColor: pointColorRef.current,
                    },
                    imageData: {
                        image,
                        projectedPoints: projectedPointsRef.current,
                    },
                });
            }
        },
        [pcdFiles, activeFrameIndex, selectedImagePath, loadedImages],
    );

    useSubscribeFunction("pointColor", handlePointCloudColors, [
        pcdFiles,
        activeFrameIndex,
        selectedImagePath,
        loadedImages,
    ]);

    useEffect(() => {
        handlePointCloudColors();
    }, [selectedCamera]);

    return { handlePointCloudColors, paintSelectedPoints };
};
