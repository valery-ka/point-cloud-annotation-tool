import React, { createContext, useContext, useState } from "react";
import { isEmpty } from "lodash";

import { useFrames, useLoading } from "contexts";

import { API_PATHS } from "config/apiPaths";

const { NAVIGATOR } = API_PATHS;

const FileManagerContext = createContext();

export const FileManagerProvider = ({ children }) => {
    const { setActiveFrameIndex } = useFrames();
    const { setGlobalIsLoading } = useLoading();

    const [folderName, setFolderName] = useState([]);
    const [pcdFiles, setPcdFiles] = useState([]);
    const [images, setImages] = useState({});

    const handleFolderChange = (folder, folderFiles) => {
        const pointclouds = folderFiles.pointclouds;
        const pcdPaths = pointclouds.map((file) => NAVIGATOR.PCD(folder, file));

        if (isEmpty(pcdPaths)) {
            throw new Error("No PCD files provided in this folder");
        }

        const imagesByCamera = folderFiles.images;
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
        setGlobalIsLoading(true);
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
