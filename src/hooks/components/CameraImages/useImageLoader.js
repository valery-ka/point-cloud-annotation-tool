import React, { useEffect } from "react";
import { useFileManager, useFrames } from "contexts";

export const useImageLoader = (
    selectedImagePath,
    setLoadedImages,
    setAspectRatio,
    loadingBarRef,
) => {
    const { images } = useFileManager();
    const { arePointCloudsLoading, setAreImagesLoading, setLoadingProgress } = useFrames();

    useEffect(() => {
        if (arePointCloudsLoading) return;

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

                    if (url === selectedImagePath) {
                        const ratio = img.width / img.height;
                        setAspectRatio(ratio);
                    }

                    if (loadedCount === total) {
                        setAreImagesLoading(false);
                        loadingBarRef?.current?.complete();
                    }
                };

                loaded[url] = img;
            }
        });

        setLoadedImages(loaded);
    }, [images, arePointCloudsLoading]);
};
