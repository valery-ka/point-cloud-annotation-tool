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
    useCuboids,
} from "contexts";

import {
    invalidateImagePointsVisibility,
    invalidateImagePointsColor,
    invalidateImagePointsSize,
} from "utils/editor";

const MS_TO_SEC = 1000;

export const ImageGeometryUpdater = memo(({ image }) => {
    const { nonHiddenClasses } = useConfig();
    const { pcdFiles } = useFileManager();
    const { activeFrameIndex } = useFrames();

    const { pointCloudRefs, pointLabelsRef, selectedClassIndex } = useEditor();

    const {
        imagePointsAlphaNeedsUpdateRef,
        imagePointsColorNeedsUpdateRef,
        imagePointsSizeNeedsUpdateRef,
        selectedCamera,
    } = useImages();
    const { projectedPointsRef } = useCalibrations();

    const { selectedCuboid, cuboidsGeometriesRef, pointsInsideCuboidsRef } = useCuboids();

    const { settings } = useSettings();

    const visibleVOID = useMemo(() => {
        return settings.editorSettings.images.visibleVOID;
    }, [settings.editorSettings.images.visibleVOID]);

    const generalPointSize = useMemo(() => {
        return settings.editorSettings.images.generalPointSize;
    }, [settings.editorSettings.images.generalPointSize]);

    const selectedClassSize = useMemo(() => {
        return settings.editorSettings.images.selectedClassSize;
    }, [settings.editorSettings.images.selectedClassSize]);

    const imageFPS = useMemo(() => {
        return settings.editorSettings.performance.imageFPS;
    }, [settings.editorSettings.performance.imageFPS]);

    const selectedClass = useMemo(() => {
        return nonHiddenClasses[selectedClassIndex]?.originalIndex;
    }, [nonHiddenClasses, selectedClassIndex]);

    const projectedCuboids = useMemo(() => {
        imagePointsAlphaNeedsUpdateRef.current = true;
        return settings.editorSettings.images.projectedCuboids;
    }, [settings.editorSettings.images.projectedCuboids]);

    useEffect(() => {
        imagePointsSizeNeedsUpdateRef.current = true;
    }, [selectedClassIndex, generalPointSize, selectedClassSize, image]);

    useEffect(() => {
        imagePointsAlphaNeedsUpdateRef.current = true;
        imagePointsColorNeedsUpdateRef.current = true;
        imagePointsSizeNeedsUpdateRef.current = true;
    }, [selectedCamera]);

    useEffect(() => {
        imagePointsAlphaNeedsUpdateRef.current = true;
    }, [visibleVOID]);

    const lastFrameTimeRef = useRef(0);
    const FRAME_INTERVAL_MS = MS_TO_SEC / imageFPS;

    useFrame(({ clock }) => {
        const now = clock.elapsedTime * MS_TO_SEC;
        if (now - lastFrameTimeRef.current < FRAME_INTERVAL_MS) return;

        lastFrameTimeRef.current = now;

        const activeFrameFilePath = pcdFiles[activeFrameIndex];
        const activeFrameCloudGeometry = pointCloudRefs.current[activeFrameFilePath]?.geometry;
        const activeFrameLabels = pointLabelsRef.current[activeFrameFilePath];
        const activeFrameCuboidsPoints = pointsInsideCuboidsRef.current[activeFrameFilePath];
        const cuboids = cuboidsGeometriesRef.current;
        const projectedPoints = projectedPointsRef.current;
        const imageGeometry = projectedPointsRef.current[image?.src]?.geometry;

        const filterCuboidPoints = (cuboidsPoints) => {
            let filteredCuboidsPoints = {};

            switch (projectedCuboids) {
                case "all":
                    filteredCuboidsPoints = cuboidsPoints;
                    break;
                case "selected":
                    if (selectedCuboid?.id && cuboidsPoints[selectedCuboid.id]) {
                        filteredCuboidsPoints = {
                            [selectedCuboid.id]: cuboidsPoints[selectedCuboid.id],
                        };
                    }
                    break;
                case "none":
                    filteredCuboidsPoints = {};
                    break;
                default:
                    break;
            }

            return filteredCuboidsPoints;
        };

        // Alpha (visibility) update
        if (imagePointsAlphaNeedsUpdateRef.current) {
            const filteredCuboidsPoints = filterCuboidPoints(activeFrameCuboidsPoints);

            invalidateImagePointsVisibility({
                cloudData: {
                    geometry: activeFrameCloudGeometry,
                    labels: activeFrameLabels,
                    cuboidsPoints: filteredCuboidsPoints,
                    cuboids: cuboids,
                },
                imageData: {
                    image,
                    projectedPoints,
                    visibleVOID,
                },
            });
            imagePointsAlphaNeedsUpdateRef.current = false;
        }

        // Color update
        if (imagePointsColorNeedsUpdateRef.current) {
            invalidateImagePointsColor({
                cloudData: { geometry: activeFrameCloudGeometry },
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
                cloudData: { labels: activeFrameLabels },
                imageData: {
                    geometry: imageGeometry,
                },
                sizeData: {
                    selectedClass: selectedClass,
                    defaultSize: generalPointSize,
                    selectedClassIncrement: selectedClassSize,
                },
            });
            imagePointsSizeNeedsUpdateRef.current = false;
        }
    });

    return null;
});
