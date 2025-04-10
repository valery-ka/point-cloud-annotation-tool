import { BufferAttribute, Points } from "three";
import { useEffect } from "react";
import { useThree } from "@react-three/fiber";

import { usePCDManager, useEditor, useFrames, useSettings } from "@contexts";

import { PointShader } from "@shaders";
import { PCDLoaderWorker, LoadInputWorker, SaveOutputWorker } from "@workers";
import { rebuildGeometry, loadLabels, saveLabels } from "@utils/editor";
import * as APP_CONSTANTS from "@constants";

const { POINT_SIZE_MULTIPLIER } = APP_CONSTANTS;

export const usePointCloudLoader = (THEME_COLORS) => {
    const { scene } = useThree();

    const { settings } = useSettings();
    const { theme } = settings.general;
    const { pcdFiles } = usePCDManager();
    const { setAreFramesLoading, setLoadingProgress } = useFrames();
    const { originalPositionsRef, pointCloudRefs, pointLabelsRef, prevLabelsRef } = useEditor();

    const POINT_MATERIAL = PointShader(POINT_SIZE_MULTIPLIER, theme, THEME_COLORS);

    useEffect(() => {
        const loaderWorker = PCDLoaderWorker();
        let activeWorkers = 0;
        const MAX_WORKERS = 2;

        const loadQueue = [...pcdFiles];
        const loadedPointClouds = {};
        let loadedFrames = 0;
        let loadedLabels = 0;

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

                const pointCloud = new Points(geometry, POINT_MATERIAL);
                loadedPointClouds[filePath] = pointCloud;

                scene.add(pointCloud);
                pointCloudRefs.current[filePath] = pointCloud;
                originalPositionsRef.current[filePath] = new Float32Array(positionArray);

                loadedFrames++;
                updateProgress();

                getLabels(filePath, numPoints);

                if (geometry?.attributes?.intensity) {
                    const [minColor, maxColor] = [50, 255];
                    const intensityArray = geometry.attributes.intensity.array;

                    const intensityToColor = intensityArray.map((intensity) => {
                        const intensityColor = Math.round(
                            minColor + (maxColor - minColor) * (intensity / 255),
                        );
                        return intensityColor;
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

                activeWorkers--;
                if (loadedFrames < pcdFiles.length) {
                    processNextFile();
                }
            };
        };

        const getLabels = async (filePath, numPoints) => {
            const path = filePath.split("/");
            const fileName = path.pop();
            const folderName = path.pop();

            try {
                const inputWorker = LoadInputWorker();
                const labels = await loadLabels({ folderName, fileName }, inputWorker);
                pointLabelsRef.current[filePath] = new Uint8Array(Object.values(labels));
                inputWorker.terminate();
            } catch (error) {
                if (!pointLabelsRef.current[filePath]) {
                    pointLabelsRef.current[filePath] = new Uint8Array(numPoints).fill(0);
                }

                const outputWorker = SaveOutputWorker();
                const labels = pointLabelsRef.current[filePath];
                const prevLabels = {};

                saveLabels({ folderName, fileName }, labels, prevLabels, outputWorker);
            }

            prevLabelsRef.current[filePath] = new Uint8Array(pointLabelsRef.current[filePath]);

            loadedLabels++;
            updateProgress();
        };

        const updateProgress = () => {
            const totalFiles = pcdFiles.length;
            if (loadedFrames === totalFiles && loadedLabels === totalFiles) {
                setLoadingProgress(1);
                setAreFramesLoading(false);
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
    }, [pcdFiles, scene]);
};
