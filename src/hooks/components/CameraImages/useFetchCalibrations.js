import { useEffect } from "react";

import { useFileManager, useImages, useCalibrations } from "contexts";

import { API_PATHS } from "config/apiPaths";
import { parseExtrinsic } from "utils/calibrations";

const { NAVIGATOR } = API_PATHS;

export const useFetchCalibrations = () => {
    const { folderName } = useFileManager();
    const { imagesByCamera } = useImages();
    const { setCalibrations, setAreCalibrationsProcessed } = useCalibrations();

    useEffect(() => {
        if (!imagesByCamera.length || !folderName) return;

        setAreCalibrationsProcessed(false);

        const fetchCalibrations = async () => {
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
                    }
                }),
            );

            setCalibrations(allCalibrations);
            setAreCalibrationsProcessed(true);
        };

        fetchCalibrations();
    }, [imagesByCamera, folderName]);
};

// export const useFetchCalibrations = () => {
//     const { folderName } = useFileManager();
//     const { imagesByCamera } = useImages();
//     const { setCalibrations, setAreCalibrationsProcessed } = useCalibrations();

//     useEffect(() => {
//         if (!imagesByCamera.length || !folderName) return;

//         setAreCalibrationsProcessed(false);

//         const fetchCalibrations = async () => {
//             const allCalibrations = {};

//             await Promise.all(
//                 imagesByCamera.map(async (camera) => {
//                     const url = NAVIGATOR.CALIBRATIONS(folderName, camera);

//                     try {
//                         const response = await fetch(url);
//                         if (!response.ok) return;

//                         const data = await response.json();
//                         const { rotation, translation } = parseExtrinsic(data.extrinsic);

//                         allCalibrations[camera] = {
//                             intrinsic: data.intrinsic,
//                             distortion: data.distortion,
//                             rotation,
//                             translation,
//                         };
//                     } catch (error) {
//                         console.warn(`Failed to load calibrations for ${camera}:`, error);
//                     }
//                 }),
//             );

//             setCalibrations(allCalibrations);
//             setAreCalibrationsProcessed(true);
//         };

//         fetchCalibrations();
//     }, [imagesByCamera, folderName]);
// };
