import { useRef, useCallback, useEffect } from "react";

import { useSubscribeFunction } from "hooks";
import { useSettings } from "contexts";

import { invalidateImagePointsSize } from "utils/editor";

export const useImagePointsSize = (geometry) => {
    const { settings } = useSettings();
    const imagesPointsRef = useRef(settings.editorSettings.images);

    useEffect(() => {
        if (!geometry) return;
        invalidateImagePointsSize({
            geometry: geometry,
            size: imagesPointsRef.current.imagesPointSize,
        });
    }, [geometry]);

    const updateImagesPointsSize = useCallback(
        (data) => {
            if (data && geometry) {
                const { value, settingKey } = data;
                imagesPointsRef.current[settingKey] = value;
                invalidateImagePointsSize({
                    geometry: geometry,
                    size: imagesPointsRef.current.imagesPointSize,
                });
            }
        },
        [geometry],
    );

    useSubscribeFunction("imagesPointSize", updateImagesPointsSize, [geometry]);
};
