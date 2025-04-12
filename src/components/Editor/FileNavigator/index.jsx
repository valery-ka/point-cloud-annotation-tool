import React, { useState, useEffect, memo } from "react";
import { useTranslation } from "react-i18next";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSave } from "@fortawesome/free-solid-svg-icons";

import { usePCDManager, useFrames, useEditor } from "contexts";
import { useClickOutsideBlur } from "hooks";

import { API_PATHS } from "config/apiPaths";

// const COMPONENT_NAME = "FileNavigator.";
const COMPONENT_NAME = "";
const { NAVIGATOR } = API_PATHS;

export const FileNavigator = memo(() => {
    const sceneSelectRef = useClickOutsideBlur();
    const frameSelectRef = useClickOutsideBlur();
    const [scenes, setScenes] = useState([]);
    const [selectedScene, setSelectedScene] = useState("");
    const [frame, setFrame] = useState([]);
    const [selectedFrame, setSelectedFrame] = useState("");

    const { t } = useTranslation();

    const { pendingSaveState } = useEditor();
    const { activeFrameIndex } = useFrames();
    const { handleFileChange, handleFolderChange, pcdFiles } = usePCDManager();

    const handleSceneChange = (event) => {
        const folderName = event.target.value;
        setSelectedScene(folderName);

        const folder = scenes.find((f) => f.name === folderName);
        const folderFiles = folder ? folder : [];
        setFrame(folderFiles.pointclouds);

        if (folderFiles.length > 0) {
            setSelectedFrame(folderFiles.pointclouds[0]);
            handleFileChange(folderName, folderFiles.pointclouds[0]);
        } else {
            setSelectedFrame("");
        }

        handleFolderChange(folderName, folderFiles);
        event.target.blur();
    };

    const handleCloudChange = (event) => {
        const fileName = event.target.value;
        setSelectedFrame(fileName);
        handleFileChange(selectedScene, fileName);
        event.target.blur();
    };

    useEffect(() => {
        fetch(NAVIGATOR.ROOT)
            .then((res) => res.json())
            .then(setScenes)
            .catch(console.error);
    }, []);

    useEffect(() => {
        if (pcdFiles.length > 0 && activeFrameIndex < pcdFiles.length) {
            const filePath = pcdFiles[activeFrameIndex];
            const fileName = filePath.split("/").pop();
            setSelectedFrame(fileName);
        }
    }, [pcdFiles, activeFrameIndex]);

    return (
        <div className="file-navigator">
            <div className="file-navigator-content">
                <div className="file-navigator-selectors">
                    <select
                        id="folder-select"
                        onChange={handleSceneChange}
                        value={selectedScene}
                        ref={sceneSelectRef}
                    >
                        <option value="" disabled>
                            {t(`${COMPONENT_NAME}selectScene`)}
                        </option>
                        {scenes.map((folder) => (
                            <option key={folder.name} value={folder.name}>
                                {folder.name}
                            </option>
                        ))}
                    </select>
                    {frame.length > 0 && (
                        <>
                            <select
                                id="file-select"
                                onChange={handleCloudChange}
                                value={selectedFrame}
                                ref={frameSelectRef}
                            >
                                <option value="" disabled>
                                    {t(`${COMPONENT_NAME}selectFrame`)}
                                </option>
                                {frame.map((file) => (
                                    <option key={file} value={file}>
                                        {file}
                                    </option>
                                ))}
                            </select>
                        </>
                    )}
                </div>
                <div className="file-navigator-save-state">
                    <FontAwesomeIcon
                        icon={faSave}
                        className={`file-navigator-save-icon ${pendingSaveState ? "saving" : ""}`}
                    />
                </div>
            </div>
        </div>
    );
});
