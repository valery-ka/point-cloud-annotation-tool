import { Texture } from "three";

import { useEffect, useMemo } from "react";
import {
    useFileManager,
    useLoading,
    useImages,
    useCalibrations,
    useEditor,
    useConfig,
    useSettings,
} from "contexts";

import { buildImageGeometry } from "utils/calibrations";

export const useImageLoader = () => {
    const { config } = useConfig();
    const { settings } = useSettings();
    const { images } = useFileManager();
    const { pointCloudRefs } = useEditor();
    const {
        setAspectRatio,
        setLoadedImages,
        selectedImagePath,
        imagesByCamera,
        setSelectedCamera,
    } = useImages();
    const { topLoaderBarRef, loadedData, setLoadedData, setTopLoaderLoadingProgress } =
        useLoading();
    const { calibrations, projectedPointsRef } = useCalibrations();

    const defaultCamera = useMemo(() => {
        if (!config?.job?.default_camera) return "";
        const { default_camera } = config.job;
        return default_camera;
    }, [config.job]);

    const distortionThreshold = useMemo(() => {
        return settings.editorSettings.images.distortionThreshold;
    }, []);

    useEffect(() => {
        if (!loadedData.pointclouds) return;
        const message = "loadingImages";

        setTopLoaderLoadingProgress({ message: message, progress: 0, isLoading: true });

        const onFinish = () => {
            setTopLoaderLoadingProgress({
                message: "",
                progress: 0,
                isLoading: false,
            });
            setLoadedData((prev) => ({
                ...prev,
                images: true,
            }));
            topLoaderBarRef?.current?.complete();
        };

        const loaded = {};
        const allUrls = Object.values(images).flat();
        const total = allUrls.length;
        let loadedCount = 0;

        if (total === 0) {
            onFinish();
            return;
        }

        allUrls.forEach((url) => {
            if (!loaded[url]) {
                const img = new Image();
                img.src = url;

                img.onload = () => {
                    loadedCount++;
                    const progress = loadedCount / total;
                    setTopLoaderLoadingProgress({
                        message: "loadingImages",
                        progress: progress,
                        isLoading: true,
                    });
                    topLoaderBarRef?.current?.staticStart(progress * 100);

                    buildImageGeometry(
                        url,
                        img,
                        imagesByCamera,
                        calibrations,
                        pointCloudRefs,
                        projectedPointsRef,
                        distortionThreshold,
                    );

                    if (url === selectedImagePath) {
                        const ratio = img.width / img.height;
                        setAspectRatio(ratio);
                    }

                    if (loadedCount === total) {
                        setLoadedImages(loaded);
                        setSelectedCamera(defaultCamera);
                        onFinish();
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
    }, [images, loadedData.pointclouds]);
};
