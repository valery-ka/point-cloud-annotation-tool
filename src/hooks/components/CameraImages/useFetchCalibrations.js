import { useEffect } from "react";

import { useFileManager, useImages, useCalibrations, useLoading } from "contexts";

import { API_PATHS } from "config/apiPaths";

const { NAVIGATOR } = API_PATHS;

export const useFetchCalibrations = () => {
    const { folderName } = useFileManager();
    const { imagesByCamera } = useImages();
    const { setCalibrations } = useCalibrations();
    const { setLoadingProgress } = useLoading();

    useEffect(() => {
        if (!imagesByCamera.length || !folderName) return;
        const message = "loadingCalibrations";
        let loadedCalibrations = 0;

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
            setLoadingProgress({ message: message, progress: 0, isLoading: false });
        };

        fetchCalibrations();
    }, [folderName]);
};
