import { useEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";

import { useFileManager, useEditor, useSettings, useLoading } from "contexts";
import { useLabelsLoader, useObjectsLoader } from "hooks";

import { CloudPointShader } from "shaders";
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
    const { setGlobalIsLoading, setLoadingProgress } = useLoading();
    const { pointCloudRefs, pointLabelsRef, prevLabelsRef } = useEditor();

    const POINT_MATERIAL = useMemo(() => {
        return CloudPointShader({
            sizeMultiplier: POINT_SIZE_MULTIPLIER,
            theme: theme,
            THEME_COLORS: THEME_COLORS,
        });
    }, [theme]);

    const { labelsCacheRef, areLabelsLoaded, availableLabels } = useLabelsLoader();
    const { areObjectsLoaded, findPointsInsideCuboids } = useObjectsLoader();

    useEffect(() => {
        if (!availableLabels.size || !areLabelsLoaded || !areObjectsLoaded) return;

        const message = "loadingFrames";
        const loaderWorker = PCDLoaderWorker();
        let activeWorkers = 0;
        const MAX_WORKERS = 8;

        const loadQueue = [...pcdFiles];
        const loadedPointClouds = {};
        let loadedFrames = 0;

        const labelsCache = labelsCacheRef.current;
        setLoadingProgress({ message: message, progress: 0, isLoading: true });

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

                pointCloudRefs.current[filePath] = pointCloud;

                getLabelsForFile({
                    filePath,
                    numPoints,
                    folderName,
                    labelsCache,
                    pointLabelsRef,
                    prevLabelsRef,
                    availableLabels,
                    loadLabels,
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
            if (loadedFrames === totalFiles) {
                findPointsInsideCuboids();
                setLoadingProgress({ message: message, progress: 0, isLoading: false });
                setGlobalIsLoading(false);
                loaderWorker.terminate();
            } else {
                const progress = loadedFrames / totalFiles;
                setLoadingProgress({
                    message: message,
                    progress: progress,
                    isLoading: true,
                });
            }
        };

        for (let i = 0; i < MAX_WORKERS; i++) {
            processNextFile();
        }

        return () => {
            cleanupPointClouds(scene, pointCloudRefs, pointLabelsRef, prevLabelsRef, loaderWorker);
        };
    }, [pcdFiles, scene, availableLabels, areLabelsLoaded, areObjectsLoaded]);

    useEffect(() => {
        return () => console.log("ДУ НОТ ФОРГЕТ ТУ ОЧИСТИТЬ СЦЕНУ ХРИСТА РАДИ!!!!!!!!!");
    }, [folderName]);
};
