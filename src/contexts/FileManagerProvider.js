import React, { createContext, useContext, useState } from "react";

const FileManagerContext = createContext();

export const FileManagerProvider = ({ children }) => {
    const [folderName, setFolderName] = useState([]);
    const [pcdFiles, setPcdFiles] = useState([]);
    const [images, setImages] = useState({});

    return (
        <FileManagerContext.Provider
            value={{
                folderName,
                setFolderName,
                pcdFiles,
                setPcdFiles,
                images,
                setImages,
            }}
        >
            {children}
        </FileManagerContext.Provider>
    );
};

export const useFileManager = () => useContext(FileManagerContext);
