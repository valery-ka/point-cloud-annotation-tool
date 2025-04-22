import { memo, useRef } from "react";
import { useFrame } from "@react-three/fiber";

import { useCalibrations, useEditor, useFrames, useFileManager, useSettings } from "contexts";

import {
    invalidateHighlighterPointsColor,
    invalidateHighlighterPointsSize,
    invalidateHighlighterPointsVisibility,
} from "utils/editor/";

const MS_TO_SEC = 1000;
const FRAME_LIMIT_FPS = 30;
const FRAME_INTERVAL_MS = 1000 / FRAME_LIMIT_FPS;

export const HighlightedPointGeometryUpdater = memo(({ image, point }) => {
    const { pcdFiles } = useFileManager();
    const { projectedPointsRef } = useCalibrations();
    const { pointCloudRefs } = useEditor();
    const { activeFrameIndex } = useFrames();
    const { settings } = useSettings();

    const pointSizeRef = useRef(settings.editorSettings.project.projectPointSize);

    const lastFrameTimeRef = useRef(0);

    useFrame(({ clock }) => {
        const now = clock.elapsedTime * MS_TO_SEC;
        if (now - lastFrameTimeRef.current < FRAME_INTERVAL_MS) return;

        lastFrameTimeRef.current = now;

        if (!point) return;
        const activeFrameFilePath = pcdFiles[activeFrameIndex];
        const cloudGeometry = pointCloudRefs.current[activeFrameFilePath].geometry;
        const projectedPoints = projectedPointsRef.current;
        const imageGeometry = projectedPoints[image.src].geometry;

        invalidateHighlighterPointsVisibility({
            geometry: { cloudGeometry, highlightedPoint: point },
            imageData: { image, projectedPoints },
        });
        invalidateHighlighterPointsColor({
            geometry: cloudGeometry,
            imageData: { image, projectedPoints },
        });
        invalidateHighlighterPointsSize({
            geometry: imageGeometry,
            size: pointSizeRef.current,
        });
    }, []);

    return null;
});
