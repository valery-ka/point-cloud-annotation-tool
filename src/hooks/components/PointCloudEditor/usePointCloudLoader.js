import { BufferAttribute, Points } from "three";
import { useEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";

import { useFileManager, useEditor, useFrames, useSettings, useConfig } from "contexts";

import { PointShader } from "shaders";
import { PCDLoaderWorker } from "workers";
import { rebuildGeometry, loadLabels } from "utils/editor";
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

    const POINT_MATERIAL = PointShader(POINT_SIZE_MULTIPLIER, theme, THEME_COLORS);

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
                const positionArray = geometry.attributes.position.array;
                const numPoints = positionArray.length / 3;

                const colorArray = new Uint8Array(numPoints * 3);
                const sizeArray = new Uint8Array(numPoints);

                geometry.setAttribute("color", new BufferAttribute(colorArray, 3, true));
                geometry.setAttribute("size", new BufferAttribute(sizeArray, 1));

                if (geometry?.attributes?.intensity) {
                    const [minColor, maxColor] = [50, 255];
                    const intensityArray = geometry.attributes.intensity.array;

                    const intensityToColor = intensityArray.map((intensity) => {
                        return Math.round(minColor + (maxColor - minColor) * (intensity / 255));
                    });

                    const intensityToColorArray = new Uint8Array(intensityToColor);
                    geometry.setAttribute(
                        "intensity",
                        new BufferAttribute(intensityToColorArray, 1),
                    );
                }

                if (geometry?.attributes?.label) {
                    const labels = geometry.attributes.label.array;
                    pointLabelsRef.current[filePath] = new Uint8Array(labels);

                    geometry.deleteAttribute("label"); // release memory (we use pointLabelsRef to store labels)
                }

                const pointCloud = new Points(geometry, POINT_MATERIAL);
                loadedPointClouds[filePath] = pointCloud;

                scene.add(pointCloud);
                pointCloudRefs.current[filePath] = pointCloud;
                originalPositionsRef.current[filePath] = new Float32Array(positionArray);

                getLabels(filePath, numPoints);

                loadedFrames++;
                updateProgress();

                activeWorkers--;
                if (loadedFrames < pcdFiles.length) {
                    processNextFile();
                }
            };
        };

        const getLabels = async (filePath, numPoints) => {
            const path = filePath.split("/");
            const fileName = path.pop();

            if (!labelsCache[folderName]) {
                await loadLabelsForFolder(folderName);
            }

            const labels = labelsCache[folderName];

            const fileData = Array.isArray(labels)
                ? labels.find((entry) => entry.fileName === fileName)
                : null;

            if (fileData) {
                pointLabelsRef.current[filePath] = new Uint8Array(fileData.labels);
            } else {
                if (!pointLabelsRef.current[filePath]) {
                    pointLabelsRef.current[filePath] = new Uint8Array(numPoints).fill(0);
                }
            }

            // check if label is available for annotation
            const updatedLabels = pointLabelsRef.current[filePath].map((label) =>
                availableLabels.has(label) ? label : 0,
            );

            pointLabelsRef.current[filePath] = new Uint8Array(updatedLabels);
            prevLabelsRef.current[filePath] = new Uint8Array(pointLabelsRef.current[filePath]);

            loadedLabels++;
            updateProgress();
        };

        const loadLabelsForFolder = async (folderName) => {
            try {
                const labels = await loadLabels(folderName);
                labelsCache[folderName] = labels;
            } catch (error) {
                console.error(`Error loading labels for ${folderName}`, error);
            }
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
            Object.values(pointCloudRefs.current).forEach((pointCloud) => {
                scene.remove(pointCloud);
            });

            pointCloudRefs.current = {};
            pointLabelsRef.current = {};
            prevLabelsRef.current = {};
            loaderWorker.terminate();
        };
    }, [pcdFiles, scene, availableLabels]);
};
