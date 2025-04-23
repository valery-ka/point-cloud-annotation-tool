import { useEffect, useCallback, useRef } from "react";

import {
    useFileManager,
    useEditor,
    useFrames,
    useConfig,
    useImages,
    useCalibrations,
    useSettings,
} from "contexts";
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
        minMaxZRef,
        setHasFilterSelectionPoint,
    } = useEditor();

    const { loadedImages, selectedImagePath, selectedCamera, imagePointsAlphaNeedsUpdateRef } =
        useImages();
    const { projectedPointsRef } = useCalibrations();

    const { settings } = useSettings();
    const imagesPointsRef = useRef(settings.editorSettings.images);

    useEffect(() => {
        filterFramePoints();
    }, [selectedCamera]);

    const filterFramePoints = useCallback(() => {
        const activeFrameFilePath = pcdFiles[activeFrameIndex];
        const activeFrameRef = pointCloudRefs.current[activeFrameFilePath];
        const activeFrameLabels = pointLabelsRef.current[activeFrameFilePath];

        const image = loadedImages[selectedImagePath];

        if (activeFrameRef && activeFrameRef.geometry.attributes.original.array) {
            filterPoints({
                frameData: {
                    geometry: activeFrameRef.geometry,
                    positions: activeFramePositionsRef.current,
                    originalPositions: activeFrameRef.geometry.attributes.original.array,
                    labels: activeFrameLabels,
                },
                filterData: {
                    visibility: classesVisibilityRef.current,
                    minZ: minMaxZRef.current[0],
                    maxZ: minMaxZRef.current[1],
                },
                imageData: {
                    image,
                    projectedPoints: projectedPointsRef.current,
                    imagesPoints: imagesPointsRef.current,
                },
            });
            updateGlobalBox();
            imagePointsAlphaNeedsUpdateRef.current = true;
        }
    }, [pcdFiles, activeFrameIndex, selectedImagePath, loadedImages]);

    const filterSelectedPoints = useCallback(
        (mode, points) => {
            const activeFrameFilePath = pcdFiles[activeFrameIndex];
            const activeFrameRef = pointCloudRefs.current[activeFrameFilePath];
            const activeFrameLabels = pointLabelsRef.current[activeFrameFilePath];

            const image = loadedImages[selectedImagePath];

            if (activeFrameRef && activeFrameRef.geometry.attributes.original.array) {
                filterPointsBySelection({
                    frameData: {
                        geometry: activeFrameRef.geometry,
                        positions: activeFramePositionsRef.current,
                        originalPositions: activeFrameRef.geometry.attributes.original.array,
                        labels: activeFrameLabels,
                    },
                    selectionData: {
                        points,
                        mode,
                        isSelection: false,
                        updateGlobalBox,
                    },
                    filterData: {
                        visibility: classesVisibilityRef.current,
                        minZ: minMaxZRef.current[0],
                        maxZ: minMaxZRef.current[1],
                    },
                    imageData: {
                        image,
                        projectedPoints: projectedPointsRef.current,
                        imagesPoints: imagesPointsRef.current,
                    },
                    showFilterPoints: showFilterPointsBySelection,
                });
                const hasFilterSelectionPoint = activeFramePositionsRef.current.some(
                    (coord) => coord === SELECTION,
                );

                setHasFilterSelectionPoint(hasFilterSelectionPoint);
                imagePointsAlphaNeedsUpdateRef.current = true;
            }
        },
        [pcdFiles, activeFrameIndex, selectedImagePath, loadedImages],
    );

    const showFilterSelectedPoints = useCallback(() => {
        const activeFrameFilePath = pcdFiles[activeFrameIndex];
        const activeFrameRef = pointCloudRefs.current[activeFrameFilePath];
        const activeFrameLabels = pointLabelsRef.current[activeFrameFilePath];

        const image = loadedImages[selectedImagePath];

        if (activeFrameRef && activeFrameRef.geometry.attributes.original.array) {
            for (let i = 0; i < activeFramePositionsRef.current.length; i += 3) {
                showFilterPointsBySelection({
                    frameData: {
                        geometry: activeFrameRef.geometry,
                        positions: activeFramePositionsRef.current,
                        originalPositions: activeFrameRef.geometry.attributes.original.array,
                        labels: activeFrameLabels,
                    },
                    filterData: {
                        visibility: classesVisibilityRef.current,
                        minZ: minMaxZRef.current[0],
                        maxZ: minMaxZRef.current[1],
                    },
                    index: i,
                });
            }
            updateGlobalBox();
            setHasFilterSelectionPoint(false);
            imagePointsAlphaNeedsUpdateRef.current = true;
        }
    }, [pcdFiles, activeFrameIndex, selectedImagePath, loadedImages]);

    useSubscribeFunction("showFilteredPoints", showFilterSelectedPoints, [
        pcdFiles,
        activeFrameIndex,
        selectedImagePath,
        loadedImages,
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
    }, [arePointCloudsLoading, pcdFiles, nonHiddenClasses, loadedImages]);

    const updateMinMaxZ = useCallback(
        (data) => {
            if (data) {
                minMaxZRef.current = data;
            }
            filterFramePoints();
        },
        [filterFramePoints],
    );

    useSubscribeFunction("minMaxZ", updateMinMaxZ, [filterFramePoints]);

    const updateClassesVisibility = useCallback(
        (data) => {
            if (data) {
                const action = data.action;
                const classIndex = data.index;

                updateClassFilter(action, classIndex, classesVisibilityRef);
            }
            filterFramePoints();
        },
        [filterFramePoints],
    );

    useSubscribeFunction("filterClass", updateClassesVisibility, [filterFramePoints]);

    const handleVOIDProject = useCallback(
        (data) => {
            if (data) {
                const { value, settingKey } = data;
                imagesPointsRef.current[settingKey] = value;
            }
            filterFramePoints();
        },
        [filterFramePoints],
    );

    useSubscribeFunction("visibleVOID", handleVOIDProject, [filterFramePoints]);

    return { filterFramePoints, filterSelectedPoints };
};
