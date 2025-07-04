import { memo, useCallback } from "react";
import { faQuestionCircle, faSave, faXmark } from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";
import { isEmpty } from "lodash";

import { useBatch, useFileManager, useEditor, useEvent } from "contexts";
import { useClickOutsideBlur, useSaveSolution } from "hooks";

import { Checkbox } from "components";

import { BatchInfoDialog } from "../BatchInfoDialog";
import { RenderFileNavigatorButton } from "components/Editor/FileNavigator/RenderFileNavigatorButton";

const frameOptions = [1, 5, 10, 20];

const checkboxItems = [
    { id: "top", label: "cameraTop" },
    { id: "left", label: "cameraLeft" },
    { id: "front", label: "cameraFront" },
];

// const COMPONENT_NAME = "BatchHeader.";
const COMPONENT_NAME = "";

export const BatchHeader = memo(() => {
    const { t } = useTranslation();

    const { publish } = useEvent();
    const { pendingSaveState } = useEditor();
    const { pcdFiles, folderName } = useFileManager();
    const { viewsCount, setViewsCount, activeCameraViews, setActiveCameraViews, setBatchMode } =
        useBatch();

    const framesSelectRef = useClickOutsideBlur();
    const { saveLabelsSolution, saveObjectsSolution } = useSaveSolution();

    const checkedCount = Object.values(activeCameraViews).filter(Boolean).length;

    const handleFramesChange = (event) => {
        const value = event.target.value;
        setViewsCount(value);
        event.target.blur();
    };

    const handleCheckboxChange = useCallback(
        (id, checked) => {
            if (!checked && checkedCount === 1) {
                return;
            }
            setActiveCameraViews((prev) => ({
                ...prev,
                [id]: checked,
            }));
        },
        [checkedCount],
    );

    const handleOpenInfo = useCallback(() => {
        publish("openBatchInfoDialog");
    }, [publish]);

    const handleSaveClick = () => {
        if (isEmpty(folderName)) return;
        saveLabelsSolution({ updateStack: false, isAutoSave: true });
        saveObjectsSolution({ updateStack: false, isAutoSave: true });
    };

    const handleClose = () => {
        setBatchMode(false);
    };

    return (
        <div className="batch-header">
            <div className="batch-header-content">
                <div className="batch-header-selectors">
                    <select
                        id="frames-select"
                        onChange={handleFramesChange}
                        value={viewsCount}
                        ref={framesSelectRef}
                    >
                        <option value="" disabled>
                            {t("batchCount")}
                        </option>
                        {frameOptions.map((count) => (
                            <option key={count} value={count} disabled={count > pcdFiles.length}>
                                {count}
                            </option>
                        ))}
                    </select>
                    <div className="batch-header-checkboxes-group">
                        {checkboxItems.map(({ id, label }) => (
                            <Checkbox
                                key={id}
                                label={t(`${label}`)}
                                checked={activeCameraViews[id]}
                                disabled={checkedCount === 1 && activeCameraViews[id]}
                                onChange={(val) => handleCheckboxChange(id, val)}
                            />
                        ))}
                    </div>
                </div>
                <div className="file-navigator-buttons-group">
                    <RenderFileNavigatorButton
                        icon={faQuestionCircle}
                        title={t(`${COMPONENT_NAME}openBatchInfoDialog`)}
                        onClick={handleOpenInfo}
                    />
                    <RenderFileNavigatorButton
                        icon={faSave}
                        title={t(`${COMPONENT_NAME}saveFolder`)}
                        className={`${pendingSaveState ? "saving" : ""}`}
                        onClick={handleSaveClick}
                    />
                    <RenderFileNavigatorButton
                        icon={faXmark}
                        title={t(`${COMPONENT_NAME}closeBatchEditor`)}
                        onClick={handleClose}
                    />
                </div>
            </div>
            <BatchInfoDialog />
        </div>
    );
});
