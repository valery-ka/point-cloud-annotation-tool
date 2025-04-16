import { createContext, useContext, useState, useMemo, useRef } from "react";

import { useFrames, useFileManager } from "contexts";

import { DEFAULT_CAMERA, MIN_IMAGE_HEIGHT } from "constants";

const ImagesContext = createContext();

export const ImagesProvider = ({ children }) => {
    const { images } = useFileManager();
    const { activeFrameIndex } = useFrames();

    const cameraWrapperRef = useRef(null);
    const [imageMaximized, setImageMaximized] = useState(false);

    const [loadedImages, setLoadedImages] = useState({});

    const [selectedImage, setSelectedImage] = useState(DEFAULT_CAMERA);
    const selectedImagePath = useMemo(() => {
        return images[selectedImage]?.[activeFrameIndex] ?? null;
    }, [images, selectedImage, activeFrameIndex]);

    const imagesByCamera = useMemo(() => {
        return Object.keys(images) ?? {};
    }, [images]);

    const [aspectRatio, setAspectRatio] = useState(1);
    const [imageHeight, setImageHeight] = useState(MIN_IMAGE_HEIGHT);
    const imageWidth = useMemo(() => imageHeight * aspectRatio, [imageHeight, aspectRatio]);

    return (
        <ImagesContext.Provider
            value={{
                cameraWrapperRef,
                selectedImage,
                selectedImagePath,
                setSelectedImage,
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
            }}
        >
            {children}
        </ImagesContext.Provider>
    );
};

export const useImages = () => useContext(ImagesContext);
