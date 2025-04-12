import React, { createContext, useContext, useState } from "react";
import { useFrames } from "./FramesProvider";

import { API_PATHS } from "config/apiPaths";

const { NAVIGATOR } = API_PATHS;
const POINTCLOUDS_ROOT = "pointclouds";

const PCDManagerContext = createContext();

export const PCDManagerProvider = ({ children }) => {
    const { setActiveFrameIndex, setLoadingProgress, setAreFramesLoading } = useFrames();

    const [folderName, setFolderName] = useState([]);
    const [pcdFiles, setPcdFiles] = useState([]);

    const handleFolderChange = (folder, folderFiles) => {
        const pointclouds = folderFiles.pointclouds;
        const pcdPaths = pointclouds.map((file) => NAVIGATOR.FILE(folder, POINTCLOUDS_ROOT, file));

        setFolderName(folder);
        setPcdFiles(pcdPaths);

        setActiveFrameIndex(0);
        setLoadingProgress(0);
        setAreFramesLoading(true);
    };

    const handleFileChange = (folder, file) => {
        const newFilePath = NAVIGATOR.FILE(folder, POINTCLOUDS_ROOT, file);
        const newIndex = pcdFiles.indexOf(newFilePath);

        if (newIndex !== -1) {
            setActiveFrameIndex(newIndex);
        }
    };

    return (
        <PCDManagerContext.Provider
            value={{
                pcdFiles,
                handleFileChange,
                handleFolderChange,
                folderName,
            }}
        >
            {children}
        </PCDManagerContext.Provider>
    );
};

export const usePCDManager = () => useContext(PCDManagerContext);
