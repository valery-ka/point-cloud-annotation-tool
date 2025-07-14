import { Matrix4 } from "three";

import { useCallback, useEffect } from "react";

import { useFrames, useCuboids, useOdometry, useFileManager, useLoading } from "contexts";
import { useSubscribeFunction, useCuboidInterpolation, useSaveSolution } from "hooks";

import {
    computeRelativeMatrix,
    applyRelativeMatrix,
    computeOdometryTransform,
    applyOdometryTransform,
} from "utils/cuboids";

import { API_PATHS } from "config/apiPaths";

const { NAVIGATOR } = API_PATHS;

export const useWorldShifting = () => {
    const { folderName, pcdFiles } = useFileManager();
    const { activeFrameIndex } = useFrames();

    const { odometry, setOdometry } = useOdometry();
    const { loadedData, setLoadedData, setLoadingProgress } = useLoading();
    const { selectedCuboid, copiedPSRRef, cuboidsSolutionRef, updateSingleCuboidRef } =
        useCuboids();

    const { findFrameMarkers, updateCuboidPSR, interpolatePSR } = useCuboidInterpolation();
    const { saveObjectsSolution } = useSaveSolution();

    //
    // Fetch odometry start
    useEffect(() => {
        if (!pcdFiles.length || !loadedData.calibrations || !loadedData.isLoadingRunning) return;
        const message = "loadingOdometry";
        let loadedOdometriesCount = 0;

        const onFinish = () => {
            setLoadingProgress({ message: message, progress: 0, isLoading: false });
            setLoadedData((prev) => ({
                ...prev,
                odometry: true,
            }));
        };

        const loadAllOdometries = async () => {
            setLoadingProgress({ message: message, progress: 0, isLoading: true });

            const allOdometries = {};

            await Promise.all(
                pcdFiles.map(async (filePath) => {
                    const fileName = filePath.split("/").pop().replace(".pcd", "");
                    const odometryFile = NAVIGATOR.ODOMETRY(folderName, fileName);

                    try {
                        const response = await fetch(odometryFile);
                        if (!response.ok) {
                            return;
                        }

                        const odometryData = await response.json();

                        const matrix = new Matrix4()
                            .fromArray(odometryData.transform.flat())
                            .transpose();

                        allOdometries[filePath] = matrix;
                    } catch (error) {
                        console.warn(`Failed to load odometry for ${filePath}:`, error);
                    } finally {
                        loadedOdometriesCount++;
                        const progress = loadedOdometriesCount / pcdFiles.length;

                        setLoadingProgress({
                            message: message,
                            progress: progress,
                            isLoading: true,
                        });
                    }
                }),
            );

            setOdometry(allOdometries);
            onFinish();
        };

        loadAllOdometries();
    }, [folderName, loadedData.calibrations, loadedData.isLoadingRunning]);
    // Fetch odometry end
    //

    //
    // Shift functions start
    const copyObjectTransform = useCallback(() => {
        if (!selectedCuboid?.id) return;
        copiedPSRRef.current = { source: "psr", id: selectedCuboid.id };
    }, [selectedCuboid?.id]);

    useSubscribeFunction("copyObjectTransform", copyObjectTransform, []);

    const fixOdometryFrame = useCallback(() => {
        if (!selectedCuboid?.id) return;
        copiedPSRRef.current = { source: "odometry", frame: activeFrameIndex };
    }, [activeFrameIndex, selectedCuboid?.id]);

    useSubscribeFunction("fixOdometryFrame", fixOdometryFrame, []);

    const applyCuboidRelativePSR = useCallback(() => {
        const sourceId = copiedPSRRef.current.id;
        const targetId = selectedCuboid?.id;
        if (!sourceId || !targetId) return;

        const relativeMatrix = computeRelativeMatrix(
            cuboidsSolutionRef.current,
            activeFrameIndex,
            sourceId,
            targetId,
        );
        if (!relativeMatrix) return;

        applyRelativeMatrix(cuboidsSolutionRef.current, sourceId, targetId, relativeMatrix);

        updateCuboidPSR();
        findFrameMarkers();
        saveObjectsSolution({ updateStack: false, isAutoSave: false, id: null });

        updateSingleCuboidRef.current.needsUpdate = true;
    }, [activeFrameIndex, selectedCuboid?.id, saveObjectsSolution, updateCuboidPSR]);

    const applyOdometry = useCallback(() => {
        if (!selectedCuboid?.id) return;

        const targetId = selectedCuboid.id;
        const sourceFrame = copiedPSRRef.current.frame;

        const sourceFramePath = pcdFiles[sourceFrame];
        const targetFramePath = pcdFiles[activeFrameIndex];

        const baseToCurrentMatrix = computeOdometryTransform(
            odometry,
            sourceFramePath,
            targetFramePath,
        );
        if (!baseToCurrentMatrix) return;

        applyOdometryTransform(
            cuboidsSolutionRef.current,
            sourceFrame,
            activeFrameIndex,
            targetId,
            baseToCurrentMatrix,
        );

        updateCuboidPSR();
        findFrameMarkers();
        interpolatePSR();
        saveObjectsSolution({ updateStack: false, isAutoSave: false, id: null });

        updateSingleCuboidRef.current.needsUpdate = true;
    }, [
        odometry,
        pcdFiles,
        activeFrameIndex,
        selectedCuboid?.id,
        saveObjectsSolution,
        updateCuboidPSR,
    ]);

    const applyTransform = useCallback(() => {
        const transformAction = copiedPSRRef.current?.source;

        switch (transformAction) {
            case "psr":
                applyCuboidRelativePSR();
            case "odometry":
                applyOdometry();
            default:
                break;
        }
    }, [applyOdometry, applyCuboidRelativePSR]);

    useSubscribeFunction("applyTransform", applyTransform, []);
    // Shift functions end
    //
};
