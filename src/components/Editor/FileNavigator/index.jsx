import React, { useState, useEffect, memo } from "react";
import { faSave, faDownload } from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";
import { isEmpty } from "lodash";

import { useFileManager, useFrames, useEditor, useEvent } from "contexts";
import { useClickOutsideBlur } from "hooks";

import { RenderFileNavigatorButton } from "./RenderFileNavigatorButton";

import { API_PATHS } from "config/apiPaths";

// const COMPONENT_NAME = "FileNavigator.";
const COMPONENT_NAME = "";
const { NAVIGATOR, DOWNLOAD } = API_PATHS;

export const FileNavigator = memo(() => {
    const sceneSelectRef = useClickOutsideBlur();
    const frameSelectRef = useClickOutsideBlur();
    const [scenes, setScenes] = useState([]);
    const [selectedScene, setSelectedScene] = useState("");
    const [frame, setFrame] = useState([]);
    const [selectedFrame, setSelectedFrame] = useState("");

    const { t } = useTranslation();

    const { publish } = useEvent();
    const { pendingSaveState } = useEditor();
    const { activeFrameIndex } = useFrames();
    const { handleFileChange, handleFolderChange, folderName, pcdFiles } = useFileManager();

    const handleSceneChange = (event) => {
        const folderName = event.target.value;
        const folder = scenes.find((f) => f.name === folderName);
        const folderFiles = folder ? folder : [];

        if (folderFiles.length > 0) {
            setSelectedFrame(folderFiles.pointclouds[0]);
            handleFileChange(folderName, folderFiles.pointclouds[0]);
        } else {
            setSelectedFrame("");
        }

        handleFolderChange(folderName, folderFiles);

        setSelectedScene(folderName);
        setFrame(folderFiles.pointclouds);
        event.target.blur();
    };

    const handleCloudChange = (event) => {
        const fileName = event.target.value;
        setSelectedFrame(fileName);
        handleFileChange(selectedScene, fileName);
        event.target.blur();
    };

    const handleDownloadClick = () => {
        if (isEmpty(folderName)) return;
        window.open(DOWNLOAD.PCD(folderName), "_blank");
    };

    const handleSaveClick = () => {
        if (isEmpty(folderName)) return;
        publish("saveLabelsSolution", { updateStack: false, isAutoSave: true });
        publish("saveObjectsSolution", { updateStack: false, isAutoSave: true });
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
                        {Array.isArray(scenes) &&
                            scenes.map((folder) => (
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
                <div className="file-navigator-buttons-group">
                    <RenderFileNavigatorButton
                        icon={faDownload}
                        title={t(`${COMPONENT_NAME}downloadFolder`)}
                        className={""}
                        onClick={handleDownloadClick}
                    />
                    <RenderFileNavigatorButton
                        icon={faSave}
                        title={t(`${COMPONENT_NAME}saveFolder`)}
                        className={`${pendingSaveState ? "saving" : ""}`}
                        onClick={handleSaveClick}
                    />
                </div>
            </div>
        </div>
    );
});
