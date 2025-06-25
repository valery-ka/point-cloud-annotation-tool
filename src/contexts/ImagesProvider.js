import { createContext, useContext, useState, useMemo, useRef } from "react";
import { isEmpty } from "lodash";

import { useFrames, useFileManager, useLoading } from "contexts";

import { MIN_IMAGE_HEIGHT } from "constants";

const ImagesContext = createContext();

export const ImagesProvider = ({ children }) => {
    const { images, pcdFiles } = useFileManager();
    const { activeFrameIndex } = useFrames();
    const { globalIsLoading } = useLoading();

    const imagePointsAlphaNeedsUpdateRef = useRef(true);
    const imagePointsColorNeedsUpdateRef = useRef(true);
    const imagePointsSizeNeedsUpdateRef = useRef(true);

    const [imageMaximized, setImageMaximized] = useState(false);
    const [loadedImages, setLoadedImages] = useState({});
    const [selectedCamera, setSelectedCamera] = useState(null);

    const imagesByCamera = useMemo(() => {
        return Object.keys(images ?? {});
    }, [images]);

    const frameFileName = useMemo(() => {
        if (globalIsLoading || isEmpty(pcdFiles)) return null;
        return pcdFiles[activeFrameIndex].split("/").pop().replace(".pcd", ".");
    }, [activeFrameIndex, globalIsLoading]);

    const activeFrameImagesPath = useMemo(() => {
        if (!frameFileName || !loadedImages) return [];
        return Object.entries(loadedImages)
            .filter(([path]) => path.includes(`/${frameFileName}`))
            .map(([path, image]) => ({ path, image }));
    }, [loadedImages, frameFileName]);

    const [aspectRatio, setAspectRatio] = useState(1);
    const [imageHeight, setImageHeight] = useState(MIN_IMAGE_HEIGHT);
    const imageWidth = useMemo(() => imageHeight * aspectRatio, [imageHeight, aspectRatio]);
    const imageSize = useMemo(
        () => ({ height: imageHeight, width: imageWidth }),
        [imageHeight, imageWidth],
    );

    const selectedImagePath = useMemo(() => {
        return (
            images[selectedCamera]?.find((imagePath) => imagePath.includes(frameFileName)) ?? null
        );
    }, [images, selectedCamera, frameFileName]);

    return (
        <ImagesContext.Provider
            value={{
                selectedCamera,
                selectedImagePath,
                setSelectedCamera,
                aspectRatio,
                setAspectRatio,
                imageWidth,
                imageHeight,
                setImageHeight,
                imageMaximized,
                setImageMaximized,
                loadedImages,
                setLoadedImages,
                imagesByCamera,
                imageSize,
                activeFrameImagesPath,
                imagePointsAlphaNeedsUpdateRef,
                imagePointsColorNeedsUpdateRef,
                imagePointsSizeNeedsUpdateRef,
            }}
        >
            {children}
        </ImagesContext.Provider>
    );
};

export const useImages = () => useContext(ImagesContext);
