import { useEffect } from "react";

import { useFileManager, useImages, useCalibrations, useLoading } from "contexts";

import { API_PATHS } from "config/apiPaths";

const { NAVIGATOR } = API_PATHS;

export const useFetchCalibrations = () => {
    const { folderName } = useFileManager();
    const { imagesByCamera } = useImages();
    const { setCalibrations } = useCalibrations();
    const { loadedData, setLoadedData, setLoadingProgress } = useLoading();

    useEffect(() => {
        if (!imagesByCamera.length || !folderName || !loadedData.config) return;
        const message = "loadingCalibrations";
        let loadedCalibrations = 0;

        const onFinish = () => {
            setLoadingProgress({ message: "", progress: 0, isLoading: false });
            setLoadedData((prev) => ({
                ...prev,
                calibrations: true,
            }));
        };

        const fetchCalibrations = async () => {
            setLoadingProgress({ message: message, progress: 0, isLoading: true });
            const allCalibrations = {};

            await Promise.all(
                imagesByCamera.map(async (camera) => {
                    const url = NAVIGATOR.CALIBRATIONS(folderName, camera);

                    try {
                        const response = await fetch(url);
                        if (!response.ok) {
                            return;
                        }

                        const calibrationData = await response.json();
                        allCalibrations[camera] = calibrationData;
                    } catch (error) {
                        console.warn(`Failed to load calibrations for ${camera}:`, error);
                    } finally {
                        loadedCalibrations++;
                        const progress = loadedCalibrations / imagesByCamera.length;

                        setLoadingProgress({
                            message: message,
                            progress: progress,
                            isLoading: true,
                        });
                    }
                }),
            );

            setCalibrations(allCalibrations);
            onFinish();
        };

        fetchCalibrations();
    }, [folderName, loadedData.config]);
};
