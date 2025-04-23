import { Texture } from "three";

import { useEffect, useMemo } from "react";
import {
    useFileManager,
    useFrames,
    useImages,
    useCalibrations,
    useEditor,
    useConfig,
} from "contexts";

import { buildImageGeometry } from "utils/calibrations";

export const useImageLoader = (loadingBarRef) => {
    const { config } = useConfig();
    const { images } = useFileManager();
    const { pointCloudRefs } = useEditor();
    const {
        setAspectRatio,
        setLoadedImages,
        selectedImagePath,
        imagesByCamera,
        setSelectedCamera,
    } = useImages();
    const { arePointCloudsLoading, setAreImagesLoading, setLoadingProgress } = useFrames();
    const { calibrations, areCalibrationsProcessed, projectedPointsRef } = useCalibrations();

    const defaultCamera = useMemo(() => {
        if (!config?.job?.default_camera) return "";
        const { default_camera } = config.job;
        return default_camera;
    }, [config.job]);

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

                    buildImageGeometry(
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
                        setLoadedImages(loaded);
                        setSelectedCamera(defaultCamera);
                        setAreImagesLoading(false);
                        loadingBarRef?.current?.complete();
                    }

                    const texture = new Texture(img);
                    texture.needsUpdate = true;

                    loaded[url] = {
                        src: url,
                        width: img.width,
                        height: img.height,
                        texture,
                    };
                };
            }
        });

        return () => {
            projectedPointsRef.current = {};
        };
    }, [images, arePointCloudsLoading, areCalibrationsProcessed]);
};
