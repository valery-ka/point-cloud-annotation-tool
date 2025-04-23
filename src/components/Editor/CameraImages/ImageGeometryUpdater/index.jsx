import { memo, useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";

import {
    useConfig,
    useFileManager,
    useSettings,
    useEditor,
    useFrames,
    useImages,
    useCalibrations,
} from "contexts";

import {
    invalidateImagePointsVisibility,
    invalidateImagePointsColor,
    invalidateImagePointsSize,
} from "utils/editor";

const MS_TO_SEC = 1000;
const FRAME_LIMIT_FPS = 60;
const FRAME_INTERVAL_MS = 1000 / FRAME_LIMIT_FPS;

export const ImageGeometryUpdater = memo(({ image }) => {
    const { nonHiddenClasses } = useConfig();
    const { pcdFiles } = useFileManager();
    const { activeFrameIndex } = useFrames();

    const { pointCloudRefs, pointLabelsRef, selectedClassIndex } = useEditor();

    const {
        imagePointsAlphaNeedsUpdateRef,
        imagePointsColorNeedsUpdateRef,
        imagePointsSizeNeedsUpdateRef,
    } = useImages();
    const { projectedPointsRef } = useCalibrations();

    const { settings } = useSettings();

    const imagesPointRef = useRef(settings.editorSettings.images);

    const generalPointSize = useMemo(() => {
        return settings.editorSettings.images.generalPointSize;
    }, [settings.editorSettings.images.generalPointSize]);

    const selectedClassSize = useMemo(() => {
        return settings.editorSettings.images.selectedClassSize;
    }, [settings.editorSettings.images.selectedClassSize]);

    const selectedClass = useMemo(() => {
        return nonHiddenClasses[selectedClassIndex]?.originalIndex;
    }, [nonHiddenClasses, selectedClassIndex]);

    useEffect(() => {
        imagePointsSizeNeedsUpdateRef.current = true;
    }, [selectedClassIndex, generalPointSize, selectedClassSize, image]);

    const lastFrameTimeRef = useRef(0);

    useFrame(({ clock }) => {
        const now = clock.elapsedTime * MS_TO_SEC;
        if (now - lastFrameTimeRef.current < FRAME_INTERVAL_MS) return;

        lastFrameTimeRef.current = now;

        const activeFrameFilePath = pcdFiles[activeFrameIndex];
        const cloudGeometry = pointCloudRefs.current[activeFrameFilePath]?.geometry;
        const frameLabels = pointLabelsRef.current[activeFrameFilePath];
        const projectedPoints = projectedPointsRef.current;
        const imagesPoints = imagesPointRef.current;
        const imageGeometry = projectedPointsRef.current[image?.src]?.geometry;

        // Alpha (visibility) update
        if (imagePointsAlphaNeedsUpdateRef.current) {
            invalidateImagePointsVisibility({
                frameData: {
                    geometry: cloudGeometry,
                    labels: frameLabels,
                },
                imageData: {
                    image,
                    projectedPoints,
                    imagesPoints,
                },
            });
            imagePointsAlphaNeedsUpdateRef.current = false;
        }

        // Color update
        if (imagePointsColorNeedsUpdateRef.current) {
            invalidateImagePointsColor({
                geometry: cloudGeometry,
                imageData: {
                    image,
                    projectedPoints,
                },
            });
            imagePointsColorNeedsUpdateRef.current = false;
        }

        // Size update
        if (imagePointsSizeNeedsUpdateRef.current) {
            invalidateImagePointsSize({
                geometry: imageGeometry,
                labels: frameLabels,
                selectedClass: selectedClass,
                defaultSize: generalPointSize,
                selectedClassIncrement: selectedClassSize,
            });
            imagePointsSizeNeedsUpdateRef.current = false;
        }
    });

    // На всякий случай
    // useFrame(() => {
    //     if (!imagePointsAlphaNeedsUpdateRef.current) return;
    //     const activeFrameFilePath = pcdFiles[activeFrameIndex];

    //     const cloudGeometry = pointCloudRefs.current[activeFrameFilePath].geometry;
    //     const frameLabels = pointLabelsRef.current[activeFrameFilePath];

    //     const projectedPoints = projectedPointsRef.current;
    //     const imagesPoints = imagesPointRef.current;

    //     invalidateImagePointsVisibility({
    //         frameData: {
    //             geometry: cloudGeometry,
    //             labels: frameLabels,
    //         },
    //         imageData: {
    //             image,
    //             projectedPoints,
    //             imagesPoints,
    //         },
    //     });

    //     imagePointsAlphaNeedsUpdateRef.current = false;
    // });

    // useFrame(() => {
    //     if (!imagePointsColorNeedsUpdateRef.current) return;
    //     const activeFrameFilePath = pcdFiles[activeFrameIndex];

    //     const cloudGeometry = pointCloudRefs.current[activeFrameFilePath].geometry;

    //     const projectedPoints = projectedPointsRef.current;

    //     invalidateImagePointsColor({
    //         geometry: cloudGeometry,
    //         imageData: {
    //             image,
    //             projectedPoints,
    //         },
    //     });

    //     imagePointsColorNeedsUpdateRef.current = false;
    // });

    // useFrame(() => {
    //     if (!imagePointsSizeNeedsUpdateRef.current) return;
    //     const activeFrameFilePath = pcdFiles[activeFrameIndex];

    //     const frameLabels = pointLabelsRef.current[activeFrameFilePath];
    //     const imageGeometry = projectedPointsRef.current[image?.src]?.geometry;

    //     invalidateImagePointsSize({
    //         geometry: imageGeometry,
    //         labels: frameLabels,
    //         selectedClass: selectedClass,
    //         defaultSize: generalPointSize,
    //         selectedClassIncrement: selectedClassSize,
    //     });

    //     imagePointsSizeNeedsUpdateRef.current = false;
    // });

    return null;
});
