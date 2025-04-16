import { useEffect } from "react";
import { useFileManager, useFrames, useImages, useCalibrations, useEditor } from "contexts";

import { getProjectedPoints } from "utils/calibrations";

export const useImageLoader = (loadingBarRef) => {
    const { images } = useFileManager();
    const { pointCloudRefs } = useEditor();
    const { setAspectRatio, setLoadedImages, selectedImagePath, imagesByCamera } = useImages();
    const { arePointCloudsLoading, setAreImagesLoading, setLoadingProgress } = useFrames();
    const { calibrations, areCalibrationsProcessed, projectedPointsRef } = useCalibrations();

    useEffect(() => {
        if (arePointCloudsLoading || !areCalibrationsProcessed) return;

        setAreImagesLoading(true);

        const loaded = {};
        const allUrls = Object.values(images).flat();
        const total = allUrls.length;
        let loadedCount = 0;

        if (total === 0) {
            setAreImagesLoading(false);
            loadingBarRef?.current?.complete();
            return;
        }

        allUrls.forEach((url) => {
            if (!loaded[url]) {
                const img = new Image();
                img.src = url;

                img.onload = () => {
                    loadedCount++;
                    const progress = loadedCount / total;
                    setLoadingProgress(progress);
                    loadingBarRef?.current?.staticStart(progress * 100);

                    getProjectedPoints(
                        url,
                        img,
                        imagesByCamera,
                        calibrations,
                        pointCloudRefs,
                        projectedPointsRef,
                    );

                    if (url === selectedImagePath) {
                        const ratio = img.width / img.height;
                        setAspectRatio(ratio);
                    }

                    if (loadedCount === total) {
                        setAreImagesLoading(false);
                        loadingBarRef?.current?.complete();
                        console.log(projectedPointsRef.current);
                    }
                };

                loaded[url] = img;
            }
        });

        setLoadedImages(loaded);

        return () => {
            projectedPointsRef.current = {};
        };
    }, [images, arePointCloudsLoading, areCalibrationsProcessed]);
};
