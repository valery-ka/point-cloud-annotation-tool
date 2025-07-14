import React, { useState, useEffect, memo } from "react";
import { faSave, faDownload } from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";

import { useFileManager, useFrames, useEditor, useLoading } from "contexts";
import { useClickOutsideBlur, useSaveSolution } from "hooks";

import { RenderFileNavigatorButton } from "./RenderFileNavigatorButton";

import { isEmpty } from "lodash";
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

    const { setGlobalIsLoading, setIsCleaningUp, setLoadingProgress, loadedData } = useLoading();
    const { pendingSaveState } = useEditor();
    const { activeFrameIndex, setActiveFrameIndex } = useFrames();
    const { folderName, setFolderName, pcdFiles, setPcdFiles, setImages } = useFileManager();

    const { saveLabelsSolution, saveObjectsSolution } = useSaveSolution();

    const handleFolderChange = (folder, folderFiles) => {
        setGlobalIsLoading(true);

        const message = "cleaningScene";
        setLoadingProgress({ message: message, progress: 0, isLoading: true });
        setIsCleaningUp((prev) => ({
            ...prev,
            isCleaningRunning: true,
        }));

        const pointclouds = folderFiles.pointclouds;
        const pcdPaths = pointclouds.map((file) => NAVIGATOR.PCD(folder, file));

        if (isEmpty(pcdPaths)) {
            throw new Error("No PCD files provided in this folder");
        }

        const imagesByCamera = folderFiles.images;
        const imagesPaths = imagesByCamera
            ? Object.fromEntries(
                  Object.entries(imagesByCamera).map(([cameraName, files]) => [
                      cameraName,
                      files.map((file) => NAVIGATOR.IMG(folder, cameraName, file)),
                  ]),
              )
            : {};

        setFolderName(folder);
        setPcdFiles(pcdPaths);
        setImages(imagesPaths);
    };

    const handleFileChange = (folder, file) => {
        const newFilePath = NAVIGATOR.PCD(folder, file);
        const newIndex = pcdFiles.indexOf(newFilePath);
        setActiveFrameIndex(newIndex);
    };

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
        saveLabelsSolution({ updateStack: false, isAutoSave: true });
        saveObjectsSolution({ updateStack: false, isAutoSave: true });
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
                                <option
                                    key={folder.name}
                                    value={folder.name}
                                    disabled={loadedData.isLoadingRunning || pendingSaveState}
                                >
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
