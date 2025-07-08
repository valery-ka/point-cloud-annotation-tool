import { useEffect, useCallback } from "react";

import {
    useFileManager,
    useEditor,
    useFrames,
    useConfig,
    useImages,
    useCuboids,
    useLoading,
} from "contexts";
import { useSubscribeFunction, useCuboidInterpolation } from "hooks";

import {
    filterPoints,
    updateObjectsFilter,
    filterPointsBySelection,
    showFilterPointsBySelection,
} from "utils/editor";
import * as APP_CONSTANTS from "constants";

const { SELECTION } = APP_CONSTANTS.HIDDEN_POSITION;

export const useFramePointsVisibility = (updateGlobalBox) => {
    const { pcdFiles } = useFileManager();
    const { nonHiddenClasses } = useConfig();
    const { activeFrameIndex } = useFrames();
    const { globalIsLoading } = useLoading();
    const {
        pointCloudRefs,
        classesVisibilityRef,
        pointLabelsRef,
        minMaxZRef,
        setHasFilterSelectionPoint,
        cloudPointsColorNeedsUpdateRef,
    } = useEditor();

    const { updateProjectedCuboidsRef, cuboidsVisibilityRef } = useCuboids();

    const { imagePointsAlphaNeedsUpdateRef } = useImages();

    const { updateCuboidPSR } = useCuboidInterpolation();

    const filterFramePoints = useCallback(
        (frame) => {
            const frameIndex = frame ?? activeFrameIndex;
            const activeFrameFilePath = pcdFiles[frameIndex];

            const activeFrameCloud = pointCloudRefs.current[activeFrameFilePath];
            const activeFrameLabels = pointLabelsRef.current[activeFrameFilePath];

            if (activeFrameCloud?.geometry.attributes.original.array) {
                filterPoints({
                    cloudData: {
                        cloud: activeFrameCloud,
                        labels: activeFrameLabels,
                    },
                    filterData: {
                        visibility: classesVisibilityRef.current,
                        minZ: minMaxZRef.current[0],
                        maxZ: minMaxZRef.current[1],
                    },
                });
                updateGlobalBox();
                imagePointsAlphaNeedsUpdateRef.current = true;
            }
        },
        [pcdFiles, activeFrameIndex],
    );

    const filterSelectedPoints = useCallback(
        (mode, points) => {
            const activeFrameFilePath = pcdFiles[activeFrameIndex];

            const activeFrameCloud = pointCloudRefs.current[activeFrameFilePath];
            const activeFrameLabels = pointLabelsRef.current[activeFrameFilePath];

            if (activeFrameCloud?.geometry.attributes.original.array) {
                filterPointsBySelection({
                    cloudData: {
                        cloud: activeFrameCloud,
                        labels: activeFrameLabels,
                    },
                    selectionData: {
                        selectedPoints: points,
                        selectionMode: mode,
                        isSelection: false,
                        updateGlobalBox,
                    },
                    filterData: {
                        visibility: classesVisibilityRef.current,
                        minZ: minMaxZRef.current[0],
                        maxZ: minMaxZRef.current[1],
                    },
                    callbacks: {
                        showFilterPoints: showFilterPointsBySelection,
                        updateGlobalBox: updateGlobalBox,
                    },
                });
                const hasFilterSelectionPoint =
                    activeFrameCloud.geometry.attributes.position.array.some(
                        (coord) => coord === SELECTION,
                    );

                setHasFilterSelectionPoint(hasFilterSelectionPoint);
                imagePointsAlphaNeedsUpdateRef.current = true;
            }
        },
        [pcdFiles, activeFrameIndex],
    );

    const showFilterSelectedPoints = useCallback(() => {
        const activeFrameFilePath = pcdFiles[activeFrameIndex];

        const activeFrameCloud = pointCloudRefs.current[activeFrameFilePath];
        const activeFrameLabels = pointLabelsRef.current[activeFrameFilePath];

        if (activeFrameCloud?.geometry.attributes.original.array) {
            for (
                let i = 0;
                i < activeFrameCloud.geometry.attributes.position.array.length;
                i += 3
            ) {
                showFilterPointsBySelection({
                    cloudData: {
                        cloud: activeFrameCloud,
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
    }, [pcdFiles, activeFrameIndex]);

    useSubscribeFunction("showFilteredPoints", showFilterSelectedPoints, []);

    useEffect(() => {
        if (globalIsLoading || !pcdFiles.length || !nonHiddenClasses.length) return;

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
    }, [globalIsLoading, pcdFiles, nonHiddenClasses]);

    const updateMinMaxZ = useCallback(
        (data) => {
            if (data) {
                minMaxZRef.current = data;
            }
            filterFramePoints();
        },
        [filterFramePoints],
    );

    useSubscribeFunction("minMaxZ", updateMinMaxZ, []);

    const updateObjectsVisibility = useCallback(
        (data) => {
            if (data) {
                const unit = data.action.unit;
                const action = data.action.filter;
                const index = data.index;

                const classesData = classesVisibilityRef.current;
                const cuboidsData = cuboidsVisibilityRef.current;

                updateObjectsFilter(unit, action, index, classesData, cuboidsData);
            }
            updateCuboidPSR();
            filterFramePoints();

            cloudPointsColorNeedsUpdateRef.current = true;
            updateProjectedCuboidsRef.current = true;
        },
        [filterFramePoints, updateCuboidPSR],
    );

    useSubscribeFunction("filterObject", updateObjectsVisibility, []);

    return { filterFramePoints, filterSelectedPoints };
};
