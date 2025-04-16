import { useEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";

import { useFileManager, useEditor, useFrames, useSettings, useConfig } from "contexts";

import { PointShader } from "shaders";
import { PCDLoaderWorker } from "workers";
import {
    rebuildGeometry,
    loadLabels,
    handleIntensityAttribute,
    handleLabelAttribute,
    setupPointCloudGeometry,
    getLabelsForFile,
    createPointCloud,
    cleanupPointClouds,
} from "utils/editor";
import * as APP_CONSTANTS from "constants";

const { POINT_SIZE_MULTIPLIER } = APP_CONSTANTS;

export const usePointCloudLoader = (THEME_COLORS) => {
    const { scene } = useThree();

    const { settings } = useSettings();
    const { theme } = settings.general;
    const { pcdFiles, folderName } = useFileManager();
    const { setArePointCloudsLoading, setLoadingProgress } = useFrames();
    const { originalPositionsRef, pointCloudRefs, pointLabelsRef, prevLabelsRef } = useEditor();
    const { nonHiddenClasses } = useConfig();

    const availableLabels = useMemo(() => {
        return new Set(nonHiddenClasses.map((cls) => cls.originalIndex));
    }, [nonHiddenClasses]);

    const POINT_MATERIAL = useMemo(() => {
        return PointShader(POINT_SIZE_MULTIPLIER, theme, THEME_COLORS);
    }, [theme]);

    useEffect(() => {
        if (!availableLabels.size) return;

        const loaderWorker = PCDLoaderWorker();
        let activeWorkers = 0;
        const MAX_WORKERS = 8;

        const loadQueue = [...pcdFiles];
        const loadedPointClouds = {};
        let loadedFrames = 0;
        let loadedLabels = 0;

        const labelsCache = {};

        const processNextFile = () => {
            if (loadQueue.length === 0) return;
            if (activeWorkers >= MAX_WORKERS) return;

            const filePath = loadQueue.shift();
            activeWorkers++;

            loaderWorker.postMessage({ filePath });

            loaderWorker.onmessage = (event) => {
                const { filePath, geometryWorker } = event.data;

                const geometry = rebuildGeometry(geometryWorker);
                const numPoints = setupPointCloudGeometry(geometry);

                handleIntensityAttribute(geometry);
                handleLabelAttribute(geometry, filePath, pointLabelsRef);

                const pointCloud = createPointCloud(geometry, POINT_MATERIAL);
                loadedPointClouds[filePath] = pointCloud;

                scene.add(pointCloud);
                pointCloudRefs.current[filePath] = pointCloud;
                originalPositionsRef.current[filePath] = new Float32Array(
                    geometry.attributes.position.array,
                );

                getLabelsForFile({
                    filePath,
                    numPoints,
                    folderName,
                    labelsCache,
                    pointLabelsRef,
                    prevLabelsRef,
                    availableLabels,
                    loadLabels,
                    onLoaded: () => {
                        loadedLabels++;
                        updateProgress();
                    },
                });

                loadedFrames++;
                updateProgress();

                activeWorkers--;
                if (loadedFrames < pcdFiles.length) {
                    processNextFile();
                }
            };
        };

        const updateProgress = () => {
            const totalFiles = pcdFiles.length;
            if (loadedFrames === totalFiles && loadedLabels === totalFiles) {
                setLoadingProgress(1);
                setArePointCloudsLoading(false);
                loaderWorker.terminate();
            } else {
                setLoadingProgress((loadedFrames + loadedLabels) / (2 * totalFiles));
            }
        };

        for (let i = 0; i < MAX_WORKERS; i++) {
            processNextFile();
        }

        return () => {
            cleanupPointClouds(scene, pointCloudRefs, pointLabelsRef, prevLabelsRef, loaderWorker);
        };
    }, [pcdFiles, scene, availableLabels]);
};
