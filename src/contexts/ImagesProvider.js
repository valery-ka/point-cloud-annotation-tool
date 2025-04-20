import { createContext, useContext, useState, useMemo, useRef } from "react";

import { useFrames, useFileManager } from "contexts";

import { MIN_IMAGE_HEIGHT } from "constants";

const ImagesContext = createContext();

export const ImagesProvider = ({ children }) => {
    const { images } = useFileManager();
    const { activeFrameIndex } = useFrames();

    const cameraWrapperRef = useRef(null);
    const [imageMaximized, setImageMaximized] = useState(false);

    const [loadedImages, setLoadedImages] = useState({});

    const [selectedCamera, setSelectedCamera] = useState(null);
    const selectedImagePath = useMemo(() => {
        return images[selectedCamera]?.[activeFrameIndex] ?? null;
    }, [images, selectedCamera, activeFrameIndex]);

    const imagesByCamera = useMemo(() => {
        return Object.keys(images ?? {});
    }, [images]);

    const [aspectRatio, setAspectRatio] = useState(1);
    const [imageHeight, setImageHeight] = useState(MIN_IMAGE_HEIGHT);
    const imageWidth = useMemo(() => imageHeight * aspectRatio, [imageHeight, aspectRatio]);
    const imageSize = useMemo(
        () => ({ height: imageHeight, width: imageWidth }),
        [imageHeight, imageWidth],
    );

    return (
        <ImagesContext.Provider
            value={{
                cameraWrapperRef,
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
            }}
        >
            {children}
        </ImagesContext.Provider>
    );
};

export const useImages = () => useContext(ImagesContext);
