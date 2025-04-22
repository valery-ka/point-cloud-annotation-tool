import { useRef, useCallback, useEffect } from "react";

import { useSubscribeFunction } from "hooks";
import { useSettings } from "contexts";

import { invalidateImagePointsSize } from "utils/editor";

export const useImagePointsSize = (geometry) => {
    const { settings } = useSettings();
    const pointProjectRef = useRef(settings.editorSettings.project);

    const updatePointsSize = useCallback(
        (data) => {
            if (data) {
                const { value, settingKey } = data;
                pointProjectRef.current[settingKey] = value;
            }
            invalidateImagePointsSize({
                geometry: geometry,
                size: pointProjectRef.current.projectPointSize,
            });
        },
        [geometry],
    );

    useEffect(() => {
        if (!geometry) return;
        invalidateImagePointsSize({
            geometry: geometry,
            size: pointProjectRef.current.projectPointSize,
        });
    }, [geometry]);

    useSubscribeFunction("projectPointSize", updatePointsSize, [geometry]);
};
