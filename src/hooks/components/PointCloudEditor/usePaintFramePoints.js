import { useEffect, useRef, useCallback } from "react";

import {
    useFileManager,
    useSettings,
    useEditor,
    useFrames,
    useConfig,
    useImages,
    useCuboids,
    useBatch,
} from "contexts";
import { useSubscribeFunction } from "hooks";

import { hexToRgb, changeClassOfSelection, updatePointCloudColors } from "utils/editor";
import { useFrame } from "@react-three/fiber";

export const usePaintFramePoints = (updateGlobalBox) => {
    const selectedClassColor = useRef(null);

    const classColorsCache = useRef({});
    const objectColorsCache = useRef({});

    const { settings } = useSettings();
    const pointColorRef = useRef(settings.editorSettings.colors);

    const { pcdFiles } = useFileManager();
    const { config, nonHiddenClasses } = useConfig();
    const { activeFrameIndex, arePointCloudsLoading } = useFrames();
    const {
        pointCloudRefs,
        selectedClassIndex,
        pointLabelsRef,
        classesVisibilityRef,
        minMaxZRef,
        cloudPointsColorNeedsUpdateRef,
    } = useEditor();

    const { cuboidIdToLabelRef, pointsInsideCuboidsRef, cuboidsSolutionRef, cuboidsVisibilityRef } =
        useCuboids();
    const { batchMode, currentFrame } = useBatch();

    const { imagePointsColorNeedsUpdateRef, imagePointsAlphaNeedsUpdateRef } = useImages();

    // когда будем красить объекты, тоже обновляем selectedClassColor по objectColorsCache
    useEffect(() => {
        if (selectedClassIndex === null) return;
        const originalClassIndex = nonHiddenClasses[selectedClassIndex]?.originalIndex;
        selectedClassColor.current = classColorsCache.current[originalClassIndex];
    }, [selectedClassIndex, nonHiddenClasses]);

    // cache classes colors
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

    // cache objects colors
    useEffect(() => {
        const objects = config.objects?.[0];
        if (!objects) return;

        const newObjectColorMap = Object.entries(objects).reduce((map, [key, value]) => {
            if (!value.color) return map;
            const rgb = hexToRgb(value.color);
            map[key] = rgb;
            return map;
        }, {});

        objectColorsCache.current = newObjectColorMap;
    }, [config.objects]);

    // main functions
    const paintSelectedPoints = useCallback(
        (mode, points) => {
            const activeFrameFilePath = pcdFiles[activeFrameIndex];

            const activeFrameCloud = pointCloudRefs.current[activeFrameFilePath];
            const activeFrameLabels = pointLabelsRef.current[activeFrameFilePath];
            const activeFrameCuboidsPoints = pointsInsideCuboidsRef.current[activeFrameFilePath];

            if (!activeFrameCloud?.geometry.attributes.color.array || !selectedClassColor.current)
                return;

            const originalClassIndex = nonHiddenClasses[selectedClassIndex].originalIndex;
            const classVisible = classesVisibilityRef.current[originalClassIndex].visible;

            const cuboidsSolution = cuboidsSolutionRef.current[activeFrameIndex];
            const cuboidsVisibility = cuboidsVisibilityRef.current;
            const idToLabel = cuboidIdToLabelRef.current;

            changeClassOfSelection({
                cloudData: {
                    cloud: activeFrameCloud,
                    labels: activeFrameLabels,
                },
                colorData: {
                    pointColor: pointColorRef.current,
                    selectedClassColor: selectedClassColor.current,
                    originalClassIndex: originalClassIndex,
                    objectColorsCache: objectColorsCache.current,
                },
                cuboidData: {
                    idToLabel: idToLabel,
                    cuboidsPoints: activeFrameCuboidsPoints,
                    cuboidsSolution: cuboidsSolution,
                    cuboidsVisibility: cuboidsVisibility,
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
        (data, frame) => {
            if (data) {
                const { value, settingKey } = data;
                pointColorRef.current[settingKey] = value;
            }
            const frameIndex = frame ?? activeFrameIndex;
            const activeFrameFilePath = pcdFiles[frameIndex];

            const activeFrameCloud = pointCloudRefs.current[activeFrameFilePath];
            const activeFrameLabels = pointLabelsRef.current[activeFrameFilePath];

            const cuboidsVisibility = cuboidsVisibilityRef.current;
            const activeFrameCuboidsPoints = pointsInsideCuboidsRef.current[activeFrameFilePath];
            const cuboidsSolution = cuboidsSolutionRef.current[frameIndex];
            const idToLabel = cuboidIdToLabelRef.current;

            if (activeFrameCloud?.geometry?.attributes?.color) {
                updatePointCloudColors({
                    cloudData: {
                        cloud: activeFrameCloud,
                        labels: activeFrameLabels,
                    },
                    colorData: {
                        classColorsCache: classColorsCache.current,
                        objectColorsCache: objectColorsCache.current,
                        pointColor: pointColorRef.current,
                    },
                    cuboidData: {
                        idToLabel: idToLabel,
                        cuboidsPoints: activeFrameCuboidsPoints,
                        cuboidsSolution: cuboidsSolution,
                        cuboidsVisibility: cuboidsVisibility,
                    },
                });

                imagePointsColorNeedsUpdateRef.current = true;
            }
        },
        [pcdFiles, activeFrameIndex],
    );

    useFrame(() => {
        if (cloudPointsColorNeedsUpdateRef.current) {
            if (!batchMode) {
                handlePointCloudColors(null, activeFrameIndex);
            } else {
                for (let frame = currentFrame[0]; frame < currentFrame[1] + 1; frame++) {
                    handlePointCloudColors(null, frame);
                }
            }
        }
        cloudPointsColorNeedsUpdateRef.current = false;
    });

    useSubscribeFunction("pointColor", handlePointCloudColors, []);

    return { handlePointCloudColors, paintSelectedPoints };
};
