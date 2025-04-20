import { useRef, useCallback, useEffect } from "react";

import { useSubscribeFunction } from "hooks";
import { useSettings } from "contexts";

import { updateProjectedPointsSize } from "utils/editor";

export const useImagePointsSize = (geometry) => {
    const { settings } = useSettings();
    const pointProjectRef = useRef(settings.editorSettings.project);

    const updatePointsSize = useCallback(
        (data) => {
            if (data) {
                const { value, settingKey } = data;
                pointProjectRef.current[settingKey] = value;
            }
            updateProjectedPointsSize(geometry, pointProjectRef.current.projectPointSize);
        },
        [geometry],
    );

    useEffect(() => {
        updateProjectedPointsSize(geometry, pointProjectRef.current.projectPointSize);
    }, [geometry]);

    useSubscribeFunction("projectPointSize", updatePointsSize, [geometry]);
};
