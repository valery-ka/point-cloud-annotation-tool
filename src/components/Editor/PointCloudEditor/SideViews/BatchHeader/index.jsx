import { memo, useCallback } from "react";

import { useCuboids, useFileManager } from "contexts";
import { useClickOutsideBlur } from "hooks";

import { Checkbox } from "components";

const frameOptions = [1, 5, 10, 20];

const checkboxItems = [
    { id: "top", label: "Камера сверху" },
    { id: "left", label: "Камера сбоку" },
    { id: "front", label: "Камера спереди" },
];

export const BatchHeader = memo(() => {
    const { pcdFiles } = useFileManager();
    const { viewsCount, setViewsCount, activeCameraViews, setActiveCameraViews } = useCuboids();

    const framesSelectRef = useClickOutsideBlur();

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
                                label={label}
                                checked={activeCameraViews[id]}
                                disabled={checkedCount === 1 && activeCameraViews[id]}
                                onChange={(val) => handleCheckboxChange(id, val)}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
});
