import { memo, useCallback } from "react";
import { faSave } from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";
import { isEmpty } from "lodash";

import { useBatch, useFileManager, useEditor } from "contexts";
import { useClickOutsideBlur, useSaveSolution } from "hooks";

import { Checkbox } from "components";

import { RenderFileNavigatorButton } from "../../../FileNavigator/RenderFileNavigatorButton";

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

    const { pendingSaveState } = useEditor();
    const { pcdFiles, folderName } = useFileManager();
    const { viewsCount, setViewsCount, activeCameraViews, setActiveCameraViews } = useBatch();

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

    const handleSaveClick = () => {
        if (isEmpty(folderName)) return;
        saveLabelsSolution({ updateStack: false, isAutoSave: true });
        saveObjectsSolution({ updateStack: false, isAutoSave: true });
    };

    return (
        <div className="batch-editor">
            <div className="batch-editor-content">
                <div className="batch-header-selectors">
                    <select
                        id="frames-select"
                        onChange={handleFramesChange}
                        value={viewsCount}
                        ref={framesSelectRef}
                    >
                        <option value="" disabled>
                            {"Количество батчей"}
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
