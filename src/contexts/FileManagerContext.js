import React, { createContext, useContext, useState } from "react";
import { useFrames } from "./FramesProvider";

import { API_PATHS } from "config/apiPaths";

const { NAVIGATOR } = API_PATHS;

const FileManagerContext = createContext();

export const FileManagerProvider = ({ children }) => {
    const { setActiveFrameIndex, setLoadingProgress, setAreFramesLoading } = useFrames();

    const [folderName, setFolderName] = useState([]);
    const [pcdFiles, setPcdFiles] = useState([]);
    const [images, setImages] = useState({});

    const handleFolderChange = (folder, folderFiles) => {
        const pointclouds = folderFiles.pointclouds;
        const imagesByCamera = folderFiles.images;

        const pcdPaths = pointclouds.map((file) => NAVIGATOR.PCD(folder, file));

        const imagesPaths = Object.fromEntries(
            Object.entries(imagesByCamera).map(([cameraName, files]) => [
                cameraName,
                files.map((file) => NAVIGATOR.IMG(folder, cameraName, file)),
            ]),
        );

        setFolderName(folder);
        setPcdFiles(pcdPaths);
        setImages(imagesPaths);

        setActiveFrameIndex(0);
        setLoadingProgress(0);
        setAreFramesLoading(true);
    };

    const handleFileChange = (folder, file) => {
        const newFilePath = NAVIGATOR.PCD(folder, file);
        const newIndex = pcdFiles.indexOf(newFilePath);
        setActiveFrameIndex(newIndex);
    };

    return (
        <FileManagerContext.Provider
            value={{
                folderName,
                pcdFiles,
                images,
                handleFileChange,
                handleFolderChange,
            }}
        >
            {children}
        </FileManagerContext.Provider>
    );
};

export const useFileManager = () => useContext(FileManagerContext);
