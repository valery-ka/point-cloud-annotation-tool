import React, { createContext, useContext, useState } from "react";
import { useFrames } from "./FramesProvider";

import { API_PATHS } from "@config/apiPaths";

const { FILES } = API_PATHS;

const PCDManagerContext = createContext();

export const PCDManagerProvider = ({ children }) => {
    const { setActiveFrameIndex, setLoadingProgress, setAreFramesLoading } =
        useFrames();

    const [folderName, setFolderName] = useState([]);
    const [filePath, setFilePath] = useState(null);
    const [pcdFiles, setPcdFiles] = useState([]);

    const handleFolderChange = (folder, folderFiles) => {
        const pcdFiles = folderFiles.filter((file) => file.endsWith(".pcd"));
        const filePaths = pcdFiles.map((file) => FILES(folder, file));

        setPcdFiles(filePaths);
        setActiveFrameIndex(0);
        setLoadingProgress(0);
        setAreFramesLoading(true);

        setFolderName(folder);

        if (filePaths.length > 0) {
            setFilePath(filePaths[0]);
        } else {
            setFilePath(null);
        }
    };

    const handleFileChange = (folder, file) => {
        const newFilePath = FILES(folder, file);
        setFilePath(newFilePath);

        const newIndex = pcdFiles.indexOf(newFilePath);
        if (newIndex !== -1) {
            setActiveFrameIndex(newIndex);
        }
    };

    return (
        <PCDManagerContext.Provider
            value={{
                pcdFiles,
                filePath,
                handleFileChange,
                handleFolderChange,
                folderName
            }}
        >
            {children}
        </PCDManagerContext.Provider>
    );
};

export const usePCDManager = () => useContext(PCDManagerContext);
