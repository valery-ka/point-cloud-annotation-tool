import { memo, useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";

import {
    useCalibrations,
    useEditor,
    useFrames,
    useFileManager,
    useSettings,
    useHoveredPoint,
} from "contexts";

import {
    invalidateHighlighterPointsColor,
    invalidateHighlighterPointsSize,
    invalidateHighlighterPointsVisibility,
} from "utils/editor/";

const MS_TO_SEC = 1000;
const FRAME_LIMIT_FPS = 30;
const FRAME_INTERVAL_MS = 1000 / FRAME_LIMIT_FPS;

export const HighlightedPointGeometryUpdater = memo(({ image }) => {
    const { pcdFiles } = useFileManager();
    const { projectedPointsRef } = useCalibrations();
    const { pointCloudRefs } = useEditor();
    const { activeFrameIndex } = useFrames();
    const { settings } = useSettings();
    const { highlightedPoint } = useHoveredPoint();

    const pointSize = useMemo(() => {
        return settings.editorSettings.highlighter.generalPointSize;
    }, [settings.editorSettings.highlighter]);

    const lastFrameTimeRef = useRef(0);

    useFrame(({ clock }) => {
        const now = clock.elapsedTime * MS_TO_SEC;
        if (now - lastFrameTimeRef.current < FRAME_INTERVAL_MS) return;

        lastFrameTimeRef.current = now;

        if (!highlightedPoint) return;

        const activeFrameFilePath = pcdFiles[activeFrameIndex];
        const cloudGeometry = pointCloudRefs.current[activeFrameFilePath].geometry;
        const projectedPoints = projectedPointsRef.current;
        const imageGeometry = projectedPoints[image.src].geometry;

        invalidateHighlighterPointsVisibility({
            geometry: { cloudGeometry, highlightedPoint },
            imageData: { image, projectedPoints },
        });
        invalidateHighlighterPointsColor({
            geometry: cloudGeometry,
            imageData: { image, projectedPoints },
        });
        invalidateHighlighterPointsSize({
            geometry: imageGeometry,
            size: pointSize,
        });
    });

    return null;
});
